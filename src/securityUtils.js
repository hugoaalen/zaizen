export const MIN_PASSWORD_LENGTH = 12
export const MAX_FINANCIAL_AMOUNT = 9999999999.99
export const MAX_DESCRIPTION_LENGTH = 500
export const MAX_CATEGORY_LENGTH = 80
export const MAX_GOAL_NAME_LENGTH = 120
export const MAX_CSV_FILE_BYTES = 5 * 1024 * 1024
export const MAX_CSV_ROWS = 5000

const isLocalSupabaseUrl = hostname =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

const decodeJwtPayload = token => {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(globalThis.atob(padded))
  } catch {
    return null
  }
}

export const validatePublicSupabaseConfig = (urlValue, keyValue) => {
  const url = String(urlValue || '').trim()
  const key = String(keyValue || '').trim()

  if (!url || !key) {
    throw new Error('Faltan las variables públicas de Supabase.')
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('La URL pública de Supabase no es válida.')
  }

  if (parsedUrl.protocol !== 'https:' && !isLocalSupabaseUrl(parsedUrl.hostname)) {
    throw new Error('Supabase debe utilizar HTTPS fuera del entorno local.')
  }

  const payload = decodeJwtPayload(key)
  const isPrivilegedKey = key.startsWith('sb_secret_')
    || payload?.role === 'service_role'
    || payload?.role === 'supabase_admin'

  if (isPrivilegedKey) {
    throw new Error('No se puede utilizar una clave privilegiada de Supabase en el navegador.')
  }

  return { url, key }
}

export const getSafeAuthError = mode => {
  if (mode === 'login') return 'Email o contraseña incorrectos.'
  if (mode === 'register') return 'No se pudo crear la cuenta. Revisa los datos o inténtalo más tarde.'
  if (mode === 'forgot') return 'No se pudo solicitar el enlace. Inténtalo de nuevo más tarde.'
  return 'No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.'
}
