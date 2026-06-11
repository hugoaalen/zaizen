import test from 'node:test'
import assert from 'node:assert/strict'
import { getGoalProgress, getMonthsUntil } from '../src/savingsGoalUtils.js'

test('calculates months until target date', () => {
  assert.equal(getMonthsUntil('2026-09-20', new Date(2026, 5, 11)), 4)
  assert.equal(getMonthsUntil('2026-06-10', new Date(2026, 5, 11)), 0)
})

test('calculates savings progress and recommended monthly amount', () => {
  const progress = getGoalProgress({
    target_amount: 1000,
    target_date: '2026-09-20',
    savings_contributions: [{ amount: 200 }, { amount: 100 }]
  }, new Date(2026, 5, 11))

  assert.equal(progress.saved, 300)
  assert.equal(progress.remaining, 700)
  assert.equal(progress.percentage, 30)
  assert.equal(progress.monthlyRecommended, 175)
  assert.equal(progress.completed, false)
})

test('marks completed and overdue goals', () => {
  assert.equal(getGoalProgress({
    target_amount: 100,
    target_date: '2026-01-01',
    savings_contributions: [{ amount: 100 }]
  }, new Date(2026, 5, 11)).completed, true)

  assert.equal(getGoalProgress({
    target_amount: 100,
    target_date: '2026-01-01',
    savings_contributions: []
  }, new Date(2026, 5, 11)).overdue, true)
})
