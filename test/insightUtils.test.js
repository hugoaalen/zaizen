import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculatePercentageChange,
  getExpenseCategoryChanges,
  getMonthProgress,
  summarizeTransactions
} from '../src/insightUtils.js'

test('summarizes income, expense and balance', () => {
  assert.deepEqual(summarizeTransactions([
    { type: 'income', amount: 2000 },
    { type: 'expense', amount: 500 },
    { type: 'expense', amount: 100 }
  ]), { income: 2000, expense: 600, balance: 1400 })
})

test('calculates percentage changes and handles missing base', () => {
  assert.equal(calculatePercentageChange(120, 100), 20)
  assert.equal(calculatePercentageChange(50, 0), null)
  assert.equal(calculatePercentageChange(0, 0), 0)
})

test('orders category changes by biggest increase', () => {
  const changes = getExpenseCategoryChanges(
    [
      { type: 'expense', category: 'Comida', amount: 150 },
      { type: 'expense', category: 'Ocio', amount: 20 }
    ],
    [
      { type: 'expense', category: 'Comida', amount: 100 },
      { type: 'expense', category: 'Ocio', amount: 70 }
    ]
  )

  assert.equal(changes[0].category, 'Comida')
  assert.equal(changes[0].difference, 50)
  assert.equal(changes[1].difference, -50)
})

test('uses elapsed days only for current month', () => {
  const today = new Date(2026, 5, 10)
  assert.deepEqual(getMonthProgress(2026, 6, today), {
    elapsedDays: 10,
    daysInMonth: 30,
    isFuture: false
  })
  assert.equal(getMonthProgress(2026, 5, today).elapsedDays, 31)
  assert.equal(getMonthProgress(2026, 7, today).isFuture, true)
})
