import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeYear, comparableYearTotals, summarizeYearCategories } from '../src/yearlyUtils.js'

test('annual categories merge equivalent names and separate flows and years', () => {
  const result = summarizeYearCategories([
    { date: '2026-01-01', type: 'expense', category: 'Educación', amount: 100 },
    { date: '2026-02-01', type: 'expense', category: ' educacion ', amount: 50 },
    { date: '2026-02-01', type: 'income', category: 'Educación', amount: 500 },
    { date: '2025-02-01', type: 'expense', category: 'Educación', amount: 900 }
  ], 2026, 'expense', new Date(2026, 2, 15))
  assert.equal(result.length, 1)
  assert.equal(result[0].total, 150)
  assert.equal(result[0].average, 50)
  assert.equal(result[0].peak.fullName, 'Enero')
  assert.equal(result[0].rows[2].actual, 0)
  assert.equal(result[0].rows[3].actual, null)
})

test('annual categories preserve future plans without counting them as observed', () => {
  const [category] = summarizeYearCategories([
    { date: '2026-12-01', type: 'expense', amount: 80 }
  ], 2026, 'expense', new Date(2026, 9, 15))
  assert.equal(category.name, 'Varios')
  assert.equal(category.total, 0)
  assert.equal(category.rows[11].value, 80)
  assert.equal(category.rows[11].actual, null)
  assert.equal(category.peak, null)
  assert.deepEqual(summarizeYearCategories([], 2026, 'expense'), [])
})

test('annual rows distinguish future months and preserve planned transactions', () => {
  const rows = summarizeYear([
    { date: '2026-10-01', type: 'income', amount: 100 },
    { date: '2026-12-01', type: 'expense', amount: 40 },
    { date: '2025-10-01', type: 'income', amount: 900 }
  ], 2026, new Date(2026, 9, 15))
  assert.equal(rows.length, 12)
  assert.equal(rows[9].balance, 100)
  assert.equal(rows[9].future, false)
  assert.equal(rows[11].future, true)
  assert.equal(rows[11].expense, 40)
})

test('comparison excludes later dates in both years and clamps leap day', () => {
  const result = comparableYearTotals([
    { date: '2024-02-29', type: 'expense', amount: 40 },
    { date: '2024-03-01', type: 'expense', amount: 999 },
    { date: '2023-02-28', type: 'expense', amount: 30 },
    { date: '2023-03-01', type: 'expense', amount: 999 }
  ], 2024, new Date(2024, 1, 29))
  assert.equal(result.current.expense, 40)
  assert.equal(result.previous.expense, 30)
  assert.equal(comparableYearTotals([], 2027, new Date(2026, 1, 1)), null)
})

test('completed years compare full calendar years', () => {
  const result = comparableYearTotals([{ date: '2025-12-31', type: 'income', amount: 100 }], 2025, new Date(2026, 1, 1))
  assert.equal(result.current.income, 100)
})
