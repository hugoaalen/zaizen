import { useState } from 'react'
import { supabase } from './supabaseClient'
import BrandIcon from './BrandIcon'

const AUTH_COPY = {
  login: {
    eyebrow: 'Bienvenido de nuevo',
    title: 'Tu dinero, más claro.',
    description: 'Accede a tu espacio financiero y continúa donde lo dejaste.',
    submit: 'Iniciar sesión'
  },
  register: {
    eyebrow: 'Empieza hoy',
    title: 'Construye tu calma financiera.',
    description: 'Crea una cuenta y reúne movimientos, objetivos y presupuestos en un solo lugar.',
    submit: 'Crear cuenta'
  },
  forgot: {
    eyebrow: 'Recuperar acceso',
    title: 'Vuelve a entrar en ZaiZen.',
    description: 'Te enviaremos un enlace seguro para elegir una contraseña nueva.',
    submit: 'Enviar enlace'
  },
  update: {
    eyebrow: 'Nueva contraseña',
    title: 'Protege de nuevo tu cuenta.',
    description: 'Elige una contraseña nueva de al menos seis caracteres.',
    submit: 'Guardar contraseña'
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
      <path fill="#34a853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.53l3.35-2.61Z" />
      <path fill="#ea4335" d="M12 5.95c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
    </svg>
  )
}

export default function Auth({ recoveryMode = false, onRecoveryComplete }) {
  const [mode, setMode] = useState(recoveryMode ? 'update' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const copy = AUTH_COPY[mode]
  const isPasswordMode = mode === 'login' || mode === 'register' || mode === 'update'

  const changeMode = nextMode => {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  const handleAuth = async event => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error
        setMessage({
          type: 'success',
          text: 'Cuenta creada. Revisa tu correo para confirmar el registro.'
        })
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        })
        if (error) throw error
        setMessage({
          type: 'success',
          text: 'Enlace enviado. Revisa también la carpeta de correo no deseado.'
        })
      }

      if (mode === 'update') {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.')
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' })
        window.history.replaceState({}, document.title, window.location.pathname)
        onRecoveryComplete?.()
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase" aria-label="Presentación de ZaiZen">
        <div className="auth-brand">
          <BrandIcon />
          <div>
            <strong>ZaiZen</strong>
            <span>Control financiero personal</span>
          </div>
        </div>

        <div className="auth-showcase-copy">
          <h1>Ordena tus finanzas.<br />Respira tranquilo.</h1>
          <p>Una visión sencilla de lo que entra, lo que sale y todo lo que quieres conseguir.</p>
        </div>

        <div className="auth-preview-card">
          <div className="auth-preview-header">
            <div>
              <span>Balance del mes</span>
              <strong>Todo bajo control</strong>
            </div>
            <i>+12%</i>
          </div>
          <div className="auth-preview-bars" aria-hidden="true">
            <span style={{ height: '42%' }} />
            <span style={{ height: '60%' }} />
            <span style={{ height: '48%' }} />
            <span style={{ height: '76%' }} />
            <span style={{ height: '64%' }} />
            <span style={{ height: '90%' }} />
            <span className="current" style={{ height: '72%' }} />
          </div>
          <div className="auth-preview-footer">
            <span><i className="income" /> Ingresos</span>
            <span><i className="expense" /> Gastos</span>
          </div>
        </div>

        <p className="auth-showcase-note">Tus datos financieros, organizados en un espacio privado.</p>
      </section>

      <section className="auth-access">
        <div className="auth-access-inner">
          <div className="auth-mobile-brand">
            <BrandIcon />
            <strong>ZaiZen</strong>
          </div>

          <header className="auth-heading">
            <span>{copy.eyebrow}</span>
            <h2>{copy.title}</h2>
            <p>{copy.description}</p>
          </header>

          {mode !== 'forgot' && mode !== 'update' && (
            <>
              <button className="auth-google-button" type="button" onClick={handleGoogleLogin} disabled={loading}>
                <GoogleIcon />
                Continuar con Google
              </button>
              <div className="auth-divider"><span>o continúa con email</span></div>
            </>
          )}

          <form className="auth-form" onSubmit={handleAuth}>
            {mode === 'register' && (
              <label>
                Nombre completo
                <input
                  className="input-minimal"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  required
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                />
              </label>
            )}

            {mode !== 'update' && (
              <label>
                Email
                <input
                  className="input-minimal"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </label>
            )}

            {isPasswordMode && (
              <div className="auth-password-field">
                <label>
                  Contraseña
                  <input
                    className="input-minimal"
                    type="password"
                    name="password"
                    minLength="6"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Mínimo 6 caracteres"
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                </label>
                {mode === 'login' && (
                  <button
                    className="auth-forgot-button"
                    type="button"
                    onClick={() => changeMode('forgot')}
                  >
                    ¿La has olvidado?
                  </button>
                )}
              </div>
            )}

            {mode === 'update' && (
              <label>
                Repite la contraseña
                <input
                  className="input-minimal"
                  type="password"
                  name="confirmPassword"
                  minLength="6"
                  autoComplete="new-password"
                  placeholder="Repite tu nueva contraseña"
                  required
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                />
              </label>
            )}

            {message && <p className={`auth-message ${message.type}`} role="status">{message.text}</p>}

            <button type="submit" className="btn-minimal auth-submit" disabled={loading}>
              {loading ? 'Procesando...' : copy.submit}
            </button>
          </form>

          {mode === 'login' && (
            <p className="auth-switch">¿Todavía no tienes cuenta? <button type="button" onClick={() => changeMode('register')}>Crear cuenta</button></p>
          )}
          {mode === 'register' && (
            <p className="auth-switch">¿Ya tienes una cuenta? <button type="button" onClick={() => changeMode('login')}>Iniciar sesión</button></p>
          )}
          {mode === 'forgot' && (
            <button className="auth-back-button" type="button" onClick={() => changeMode('login')}>← Volver al inicio de sesión</button>
          )}
        </div>
      </section>
    </main>
  )
}
