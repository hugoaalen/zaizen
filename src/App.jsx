import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import PwaStatus from './PwaStatus'
import { clearAllOfflineData } from './offlineCache'
import {
  loadLocalPreferences,
  preferencesFromRow,
  preferencesToRow,
  sanitizePreferences,
  saveLocalPreferences
} from './preferencesUtils'

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [preferences, setPreferences] = useState(loadLocalPreferences)
  const preferencesRef = useRef(preferences)
  const userId = session?.user?.id
  const [recoveryMode, setRecoveryMode] = useState(
    () => window.location.hash.includes('type=recovery')
  )
  
  useEffect(() => {
    preferencesRef.current = preferences
    document.documentElement.setAttribute('data-theme', preferences.theme)
    document.documentElement.setAttribute('data-accent', preferences.accentColor)
    document.documentElement.setAttribute('data-density', preferences.density)
    saveLocalPreferences(preferences)
  }, [preferences])

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
    if (!userId) return
    let active = true

    const loadPreferences = async () => {
      const localPreferences = preferencesRef.current
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme,monthly_chart,yearly_chart,chart_palette,accent_color,density,initial_view')
        .eq('user_id', userId)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('No se pudieron sincronizar las preferencias:', error)
        return
      }

      if (data) {
        const remotePreferences = preferencesFromRow(data)
        preferencesRef.current = remotePreferences
        setPreferences(remotePreferences)
        return
      }

      const { error: insertError } = await supabase
        .from('user_preferences')
        .upsert(preferencesToRow(userId, localPreferences), { onConflict: 'user_id' })

      if (insertError) console.error('No se pudieron crear las preferencias:', insertError)
    }

    loadPreferences()
    return () => { active = false }
  }, [userId])

  const updatePreferences = useCallback((patch) => {
    const nextPreferences = sanitizePreferences({
      ...preferencesRef.current,
      ...patch
    })

    preferencesRef.current = nextPreferences
    setPreferences(nextPreferences)
    saveLocalPreferences(nextPreferences)

    if (userId) {
      supabase
        .from('user_preferences')
        .upsert(preferencesToRow(userId, nextPreferences), { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.error('No se pudieron guardar las preferencias:', error)
        })
    }
  }, [userId])

  return (
    <div>
      {!authReady ? null : !session || recoveryMode ?
        <Auth
          recoveryMode={recoveryMode}
          onRecoveryComplete={() => setRecoveryMode(false)}
        /> :
        <Dashboard
          session={session}
          preferences={preferences}
          updatePreferences={updatePreferences}
        />
      }
      <PwaStatus />
    </div>
  )
}

export default App
