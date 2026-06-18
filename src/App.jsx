import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import PwaStatus from './PwaStatus'
import { clearAllOfflineData } from './offlineCache'

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(
    () => window.location.hash.includes('type=recovery')
  )
  
  const [theme, setTheme] = useState(() => {
  // 1. ¿Hay algo guardado de antes? Úsalo.
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;

  // 2. Si no hay nada, pregunta al sistema operativo:
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
  });

  // Aplica el tema al HTML cada vez que cambie
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .finally(() => setAuthReady(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') clearAllOfflineData()
      setSession(session)
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authReady && !session && !recoveryMode) clearAllOfflineData()
  }, [authReady, recoveryMode, session])

  useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    // Solo cambiamos automáticamente si el usuario no ha fijado un tema a mano
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);

  return (
    <div>
      {!authReady ? null : !session || recoveryMode ?
        <Auth
          recoveryMode={recoveryMode}
          onRecoveryComplete={() => setRecoveryMode(false)}
        /> :
        /* Pasamos la función de cambiar tema al Dashboard */
        <Dashboard session={session} theme={theme} setTheme={setTheme} />
      }
      <PwaStatus />
    </div>
  )
}

export default App
