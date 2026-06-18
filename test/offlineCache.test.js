import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearAllOfflineData,
  clearOfflineData,
  createOfflineCacheKey,
  getMonthlyCachePeriod
} from '../src/offlineCache.js'

test('creates user-scoped offline cache keys', () => {
  assert.equal(
    createOfflineCacheKey('user-1', 'transactions', '2026-06'),
    'zaizen:offline:v1:user-1:transactions:2026-06'
  )
})

test('formats monthly cache periods', () => {
  assert.equal(getMonthlyCachePeriod(2026, 6), '2026-06')
  assert.equal(getMonthlyCachePeriod(2026, 12), '2026-12')
})

test('clears cached financial data by user or globally', () => {
  const values = new Map([
    ['zaizen:offline:v1:user-1:transactions:2026-06', 'one'],
    ['zaizen:offline:v2:user-1:transactions:2026-07', 'newer'],
    ['zaizen:offline:v1:user-2:transactions:2026-06', 'two'],
    ['theme', 'dark']
  ])

  globalThis.window = {
    localStorage: {
      get length() { return values.size },
      key: index => [...values.keys()][index] ?? null,
      removeItem: key => values.delete(key)
    }
  }

  assert.equal(clearOfflineData('user-1'), true)
  assert.equal(values.has('zaizen:offline:v1:user-1:transactions:2026-06'), false)
  assert.equal(values.has('zaizen:offline:v2:user-1:transactions:2026-07'), false)
  assert.equal(values.has('zaizen:offline:v1:user-2:transactions:2026-06'), true)

  assert.equal(clearAllOfflineData(), true)
  assert.equal(values.has('zaizen:offline:v1:user-2:transactions:2026-06'), false)
  assert.equal(values.get('theme'), 'dark')

  delete globalThis.window
})
