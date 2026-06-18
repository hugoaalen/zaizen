import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getSafeAuthError,
  MIN_PASSWORD_LENGTH,
  validatePublicSupabaseConfig
} from '../src/securityUtils.js'

const toJwt = payload => {
  const encode = value => btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`
}

test('accepts public Supabase browser configuration', () => {
  assert.deepEqual(
    validatePublicSupabaseConfig('https://example.supabase.co', 'sb_publishable_example'),
    {
      url: 'https://example.supabase.co',
      key: 'sb_publishable_example'
    }
  )
})

test('rejects privileged Supabase keys in the browser', () => {
  assert.throws(
    () => validatePublicSupabaseConfig(
      'https://example.supabase.co',
      toJwt({ role: 'service_role' })
    ),
    /clave privilegiada/
  )
  assert.throws(
    () => validatePublicSupabaseConfig('https://example.supabase.co', 'sb_secret_example'),
    /clave privilegiada/
  )
})

test('requires HTTPS outside local development', () => {
  assert.throws(
    () => validatePublicSupabaseConfig('http://example.com', 'sb_publishable_example'),
    /HTTPS/
  )
})

test('uses a stronger password baseline and generic auth errors', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 12)
  assert.equal(getSafeAuthError('login'), 'Email o contraseña incorrectos.')
})
