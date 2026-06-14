import test from 'node:test'
import assert from 'node:assert/strict'
import {
  groupTransactionsByCategory,
  mergeCategoryNames,
  normalizeCategoryKey
} from '../src/categoryUtils.js'

test('normaliza mayúsculas, espacios y distintas formas Unicode', () => {
  assert.equal(normalizeCategoryKey('  EDUCACIÓN  '), 'educacion')
  assert.equal(normalizeCategoryKey('Educacio\u0301n'), 'educacion')
})

test('mezcla categorías equivalentes conservando el nombre preferido', () => {
  assert.deepEqual(
    mergeCategoryNames(['Educación'], ['EDUCACION', ' Educación ']),
    ['Educación']
  )
})

test('agrupa importes de categorías visualmente equivalentes', () => {
  const transactions = [
    { type: 'expense', category: 'Educación', amount: 300 },
    { type: 'expense', category: 'EDUCACION ', amount: 175 }
  ]

  assert.deepEqual(
    groupTransactionsByCategory(transactions, 'expense', ['Educación']),
    [{ name: 'Educación', value: 475 }]
  )
})
