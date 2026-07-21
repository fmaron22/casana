// Genera una versión self-contained (un solo archivo HTML) inlineando CSS y el
// motor de cálculo. Útil para abrir sin servidor y para publicar/compartir.
// Uso:  node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "styles.css"), "utf8");
const engine = readFileSync(join(dir, "engine.mjs"), "utf8");
let html = readFileSync(join(dir, "index.html"), "utf8");

// 1) Inlinar CSS
html = html.replace(
  '<link rel="stylesheet" href="./styles.css" />',
  `<style>\n${css}\n</style>`
);

// 2) Inlinar el motor (reemplaza el import por el código del módulo)
html = html.replace('import { calcular } from "./engine.mjs";', `\n${engine}\n`);

mkdirSync(join(dir, "dist"), { recursive: true });
const out = join(dir, "dist", "casana-calculadora.html");
writeFileSync(out, html, "utf8");
console.log("OK ->", out, `(${(html.length / 1024).toFixed(1)} KB)`);

// 3) Versión "content-only" para el publicador de Artifacts (sin doctype/html/
//    head/body). Extrae el <style> y el contenido del <body>.
const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
const bodyInner = html.match(/<body>([\s\S]*?)<\/body>/)[1].trim();
const artifact = `${style}\n${bodyInner}\n`;
const outArt = join(dir, "dist", "artifact.html");
writeFileSync(outArt, artifact, "utf8");
console.log("OK ->", outArt, `(${(artifact.length / 1024).toFixed(1)} KB)`);
