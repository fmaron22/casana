import { Logo, Isotipo } from '../components/Logo';
import { Cotizador } from '../components/Cotizador';

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="container">
          <Logo />
          <nav className="nav">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#cotiza">Cotiza</a>
            <a className="btn" href="#cotiza">
              Empezar
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div>
              <h1>
                Protege a quien <em>cuida tu hogar</em>
              </h1>
              <p>
                Casana da de alta ante el IMSS a tu persona trabajadora del hogar, paga sus cuotas y
                le deposita su salario — en automático, con cargo a tu tarjeta. Sin filas, sin
                efectivo, sin complicaciones.
              </p>
              <div className="hero-ctas">
                <a className="btn" href="#cotiza">
                  Calcula cuánto cuesta
                </a>
                <a className="btn btn-ghost" href="#como-funciona">
                  Ver cómo funciona
                </a>
              </div>
            </div>
            <div className="hero-art">
              <Isotipo />
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona">
          <div className="container">
            <div className="kicker">Cómo funciona</div>
            <h2>Tres pasos y te olvidas del trámite</h2>
            <p className="lead">
              Tú registras una vez. Nosotros calculamos, declaramos y pagamos cada mes.
            </p>
            <div className="grid3">
              <div className="cardx">
                <div className="num">1</div>
                <h3>Regístrala en minutos</h3>
                <p>
                  Con tu INE y una tarjeta. Los datos de tu trabajadora del hogar se capturan con una
                  foto de su identificación.
                </p>
              </div>
              <div className="cardx">
                <div className="num">2</div>
                <h3>Nosotros la damos de alta</h3>
                <p>
                  Gestionamos su alta ante el IMSS con su salario y días de trabajo. Cada mes
                  recibimos su línea de captura por ti.
                </p>
              </div>
              <div className="cardx">
                <div className="num">3</div>
                <h3>Todo se paga solo</h3>
                <p>
                  Cargamos a tu tarjeta, pagamos sus cuotas al IMSS y le depositamos su salario.
                  Los comprobantes quedan guardados en tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="alt">
          <div className="container">
            <div className="kicker">Beneficios</div>
            <h2>Ganan los dos</h2>
            <p className="lead">
              Quien trabaja en tu casa es parte de tu vida diaria. Darle seguridad social es lo
              mínimo — y además, es obligatorio por ley.
            </p>
            <div className="benefits">
              <div className="cardx">
                <h3>Para ella y su familia</h3>
                <ul>
                  <li>Atención médica, medicinas y hospitalización del IMSS</li>
                  <li>Incapacidades pagadas por enfermedad o maternidad</li>
                  <li>Guardería para sus hijas e hijos</li>
                  <li>Ahorro para el retiro (AFORE) y crédito INFONAVIT</li>
                </ul>
              </div>
              <div className="cardx">
                <h3>Para ti</h3>
                <ul>
                  <li>Cumples con la ley sin hacer un solo trámite</li>
                  <li>Adiós al efectivo: ni banco, ni cajero, ni riesgos</li>
                  <li>Comprobantes de pago siempre disponibles</li>
                  <li>Cargo automático a tu tarjeta, transparente y predecible</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Cotizador */}
        <section id="cotiza">
          <div className="container">
            <div className="kicker">Cotizador</div>
            <h2>¿Cuánto cuesta asegurar a quien trabaja en tu casa?</h2>
            <p className="lead">Muévele al salario y míralo al instante.</p>
            <Cotizador />
          </div>
        </section>

        {/* Banda legal */}
        <section className="band">
          <div className="container">
            <div>
              <h2>Es un derecho — y una obligación</h2>
              <p>
                Desde 2023 es obligatorio inscribir al IMSS a las personas trabajadoras del hogar.
                Casana lo hace por ti: correcta, puntual y automáticamente, con evidencia de cada
                pago.
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a className="btn" href="#cotiza">
                Empieza hoy
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <Logo />
          <span>© {new Date().getFullYear()} Casana. Hecho en México.</span>
        </div>
      </footer>
    </>
  );
}
