import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  // 1. Estado para saber si estamos en modo Registro o Login
  const [isRegistering, setIsRegistering] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isRegistering) {
      // Lógica de REGISTRO
      if (!fullName) {
        alert('Por favor, introduce tu nombre')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      })
      if (error) alert(error.message)
      else alert('¡Registro completado! Revisa tu email.')
    } else {
      // Lógica de LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ 
          fontSize: '36px', 
          fontWeight: '900', 
          letterSpacing: '-1.5px',
          margin: 0,
          background: 'linear-gradient(to right, var(--text-main), var(--btn-bg))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ZaiZen
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px', fontWeight: '500' }}>
          {isRegistering ? 'El camino hacia la armonía financiera.' : 'Tu balance en calma.'}
        </p>
      </div>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CAMPO NOMBRE: Solo aparece en REGISTRO */}
          {isRegistering && (
            <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              Nombre completo
              <input
                className="input-minimal"
                type="text"
                placeholder="Tu nombre"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          )}

          <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            Email
            <input
              className="input-minimal"
              type="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          
          <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            Contraseña
            <input
              className="input-minimal"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
            <button type="submit" className="btn-minimal" disabled={loading}>
              {loading ? 'Cargando...' : isRegistering ? 'Crear cuenta' : 'Iniciar Sesión'}
            </button>
            
            {/* BOTÓN PARA CAMBIAR DE MODO */}
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta todavía?'}
              <button 
                type="button"
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setFullName(''); // Limpiamos nombre al cambiar
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--btn-bg)', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
              >
                {isRegistering ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}