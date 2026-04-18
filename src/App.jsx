import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'

function App() {
  const [session, setSession] = useState(null)
  
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

  // Lógica de Supabase (sin cambios)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

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
      {!session ? 
        <Auth /> : 
        /* Pasamos la función de cambiar tema al Dashboard */
        <Dashboard session={session} theme={theme} setTheme={setTheme} />
      }
    </div>
  )
}

export default App