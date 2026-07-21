import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Browser, Page } from 'playwright';
import {
  CaptchaDetectadoError,
  DatosDeclaracion,
  ImssGateway,
  LineaDeCaptura,
} from '../imss-gateway.service';
import { SELECTORS } from './selectors';

/**
 * Adaptador RPA (Playwright) del portal PTH. Ver ADR-0004.
 *
 * ⚠️ Los SELECTORES son placeholders (selectors.ts): el DOM real se mapea con
 *    acceso autorizado. NO se ejecuta contra el portal en CI/dev sin credenciales.
 *    El robot NUNCA resuelve CAPTCHAs: los detecta y escala a intervención humana.
 */
@Injectable()
export class PlaywrightImssGateway extends ImssGateway {
  private readonly logger = new Logger(PlaywrightImssGateway.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async generarLineaDeCaptura(datos: DatosDeclaracion): Promise<LineaDeCaptura> {
    const url = this.config.get<string>('IMSS_PORTAL_URL', 'https://adodigital.imss.gob.mx/pth/');
    const headless = this.config.get<string>('IMSS_RPA_HEADLESS', 'true') !== 'false';

    // Carga diferida de Playwright (requiere `npx playwright install chromium`).
    const { chromium } = await import('playwright');
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless });
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await this.abortarSiCaptcha(page);

      // Paso 1 — empleador
      await page.fill(SELECTORS.empleador.curp, datos.empleador.curp);
      await page.fill(SELECTORS.empleador.correo, datos.empleador.correo);
      await page.click(SELECTORS.empleador.continuar);
      await this.abortarSiCaptcha(page);

      // Paso 2 — contacto/domicilio
      await page.click(SELECTORS.contacto.continuar);

      // Paso 3 — trabajador y cotización
      if (datos.trabajador.nss) await page.fill(SELECTORS.trabajador.nss, datos.trabajador.nss);
      await page.fill(SELECTORS.trabajador.curp, datos.trabajador.curp);
      await page.selectOption(SELECTORS.trabajador.modalidad, this.modalidadPortal(datos.modalidad));
      await page.fill(
        SELECTORS.trabajador.salarioDiario,
        (datos.salarioDiarioCentavos / 100).toFixed(2),
      );
      if (datos.diasLaborados != null) {
        await page.fill(SELECTORS.trabajador.diasLaborados, String(datos.diasLaborados));
      }
      await page.click(SELECTORS.trabajador.continuar);
      await this.abortarSiCaptcha(page);

      // Paso 4 — confirmación
      await page.click(SELECTORS.confirmacion.confirmar);
      await this.abortarSiCaptcha(page);

      // Paso 5 — resultado + descargas
      const lineaCaptura = (await page.textContent(SELECTORS.resultado.lineaCaptura))?.trim();
      const importeTxt = (await page.textContent(SELECTORS.resultado.importe))?.trim() ?? '';
      const vigencia = (await page.textContent(SELECTORS.resultado.vigencia))?.trim();

      const urlPdfLineaCaptura = await this.descargar(page, SELECTORS.resultado.descargarLinea);
      const urlPdfComprobante = await this.descargar(page, SELECTORS.resultado.descargarComprobante);

      return {
        estado: 'GENERADA',
        lineaCaptura,
        importeCentavos: this.pesosTextoACentavos(importeTxt),
        vigencia,
        urlPdfLineaCaptura,
        urlPdfComprobante,
      };
    } catch (err) {
      if (err instanceof CaptchaDetectadoError) {
        this.logger.warn('CAPTCHA detectado → escalado a intervención humana');
        return { estado: 'REQUIERE_INTERVENCION', motivo: err.message, urlDiagnostico: err.urlDiagnostico };
      }
      this.logger.error(`Fallo RPA IMSS: ${(err as Error).message}`);
      return { estado: 'ERROR', motivo: (err as Error).message };
    } finally {
      await browser?.close();
    }
  }

  /** Si aparece un CAPTCHA, captura diagnóstico y lanza para escalar. NO lo resuelve. */
  private async abortarSiCaptcha(page: Page): Promise<void> {
    for (const sel of SELECTORS.captcha) {
      if (await page.locator(sel).count()) {
        const urlDiagnostico = await this.capturaDiagnostico(page, 'captcha');
        throw new CaptchaDetectadoError(urlDiagnostico);
      }
    }
  }

  /** Captura de pantalla para diagnóstico. TODO: subir a Cloud Storage y devolver su URL. */
  private async capturaDiagnostico(page: Page, tag: string): Promise<string | undefined> {
    try {
      await page.screenshot({ fullPage: true });
      // TODO: subir a Cloud Storage (documents) y devolver la URL.
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async descargar(page: Page, selector: string): Promise<string | undefined> {
    if (!(await page.locator(selector).count())) return undefined;
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(selector),
    ]);
    // TODO: subir el archivo (download.path()) a Cloud Storage y devolver su URL.
    return download.suggestedFilename();
  }

  private modalidadPortal(m: 'MES_COMPLETO' | 'POR_DIA'): string {
    // ⚠️ Ajustar a los valores reales del <select> del portal al mapear.
    return m === 'POR_DIA' ? 'por-dia' : 'mes-completo';
  }

  private pesosTextoACentavos(txt: string): number | undefined {
    const limpio = txt.replace(/[^0-9.]/g, '');
    if (!limpio) return undefined;
    return Math.round(parseFloat(limpio) * 100);
  }
}
