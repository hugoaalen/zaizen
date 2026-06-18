import { createClient } from '@supabase/supabase-js'
import { validatePublicSupabaseConfig } from './securityUtils'

const { url: supabaseUrl, key: supabaseAnonKey } = validatePublicSupabaseConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true
  }
})
