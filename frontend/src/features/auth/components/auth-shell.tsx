import type { ReactNode } from 'react'

export function AuthShell({
  title,
  footer,
  children,
}: {
  title: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="currency-stream">
          <b>₽</b>
          <b>$</b>
          <b>€</b>
          <b>¥</b>
          <b>£</b>
          <b>₿</b>
          <b>₽</b>
          <b>$</b>
        </span>
        <span className="grain" />
        <span className="grid-dome" />
        <span className="scanline" />
      </div>

      <main className="shell">
        <section className="screen screen-register is-active" aria-labelledby="authTitle">
          <div className="register-stage">
            <button className="hamburger" type="button" aria-label="Меню" tabIndex={-1}>
              <span />
              <span />
              <span />
            </button>

            <div className="water-panel water-panel-back" aria-hidden="true" />
            <div className="water-panel water-panel-front" aria-hidden="true" />
            <div className="glass-gate" aria-hidden="true" />

            <div className="registration-collab" aria-hidden="true">
              <span className="collab-logo logo-crop" />
              <span className="collab-cross">×</span>
              <span className="hackaton-mark">
                <span>Uran</span>
                <strong>235</strong>
              </span>
            </div>

            <div className="register-card">
              <h1 id="authTitle">{title}</h1>
              {children}
              <p className="auth-note">{footer}</p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
