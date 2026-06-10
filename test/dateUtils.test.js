import test from 'node:test'
import assert from 'node:assert/strict'
import { formatTransactionDate, getMonthIndex, toDatabaseDate } from '../src/dateUtils.js'

test('formats a local date without converting it to UTC', () => {
  const date = new Date(2026, 5, 10, 23, 30)
  assert.equal(toDatabaseDate(date), '2026-06-10')
})

test('reads month from an ISO database date', () => {
  assert.equal(getMonthIndex('2026-01-31'), 0)
  assert.equal(getMonthIndex('2026-12-01'), 11)
})

test('formats transaction dates consistently', () => {
  assert.equal(formatTransactionDate('2026-06-10'), '10 Jun')
})
