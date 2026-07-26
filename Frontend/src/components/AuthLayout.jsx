function RescueMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 5 53 13v16c0 13.8-8.7 25.5-21 30C19.7 54.5 11 42.8 11 29V13L32 5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M32 8.5 50 15v14c0 12-7.3 22.4-18 27-10.7-4.6-18-15-18-27V15l18-6.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M27 20h10v7h7v10h-7v7H27v-7h-7V27h7v-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  isRegister = false,
}) {
  return (
    <main className="auth-page">
      <div className={`auth-card${isRegister ? ' auth-card--register' : ''}`}>
        <aside className="auth-visual" aria-label="Malasiqui Rescue">
          <div className="auth-brand">
            <RescueMark className="auth-brand__mark" />
            <span>Malasiqui Rescue</span>
          </div>

          <div className="auth-visual__art" aria-hidden="true">
            <div className="rescue-orb">
              <div className="rescue-orb__ring" />
              <RescueMark className="rescue-orb__mark" />
            </div>
          </div>

          <div className="auth-visual__copy">
            <p className="auth-visual__eyebrow">Ready when it matters</p>
            <p>One safe place to request help and coordinate a response.</p>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-form-container">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="auth-description">{description}</p>
            {children}
            {footer && <div className="auth-footer">{footer}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
