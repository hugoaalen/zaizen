import test from 'node:test'
import assert from 'node:assert/strict'
import {
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
