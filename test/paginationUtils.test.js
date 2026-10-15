import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchAllRows } from '../src/paginationUtils.js'

test('loads every row beyond the server cap with fresh ordered queries', async () => {
  const rows = Array.from({ length: 1237 }, (_, id) => ({ id }))
  let calls = 0
  const result = await fetchAllRows(() => {
    calls++
    return { range: async (from, to) => ({ data: rows.slice(from, Math.min(to + 1, from + 200)), error: null }) }
  })
  assert.deepEqual(result, { data: rows, error: null })
  assert.equal(calls, 8)
})

test('returns no partial backup when a later page fails', async () => {
  const error = { message: 'Request failed' }
  const result = await fetchAllRows(() => ({ range: async from => from === 0
    ? { data: [{ id: 1 }], error: null }
    : { data: null, error } }))
  assert.deepEqual(result, { data: null, error })
})

test('handles empty results and network exceptions', async () => {
  assert.deepEqual(await fetchAllRows(() => ({ range: async () => ({ data: [], error: null }) })), { data: [], error: null })
  const error = new Error('Offline')
  assert.deepEqual(await fetchAllRows(() => { throw error }), { data: null, error })
})
