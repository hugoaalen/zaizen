import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyCategorizationRules,
  categorizeBankDescription,
  createTransactionFingerprint,
  detectColumnMapping,
  flagDateOutliers,
  mapCsvRows,
  parseBankAmount,
  parseBankDate,
  parseCsv
  , suggestRulePattern
} from '../src/csvImportUtils.js'

test('parses semicolon CSV with quoted fields', () => {
  const result = parseCsv('Fecha;Concepto;Importe\n10/06/2026;"Compra, supermercado";-1.234,56')
  assert.deepEqual(result.headers, ['Fecha', 'Concepto', 'Importe'])
  assert.equal(result.rows[0].Concepto, 'Compra, supermercado')
})

test('detects common bank columns', () => {
  assert.deepEqual(
    detectColumnMapping(['Fecha valor', 'Concepto', 'Importe EUR']),
    { date: 'Fecha valor', description: 'Concepto', amount: 'Importe EUR', debit: '', credit: '', category: '' }
  )
})

test('parses European and English amounts', () => {
  assert.equal(parseBankAmount('-1.234,56 €'), -1234.56)
  assert.equal(parseBankAmount('1,234.56'), 1234.56)
  assert.equal(parseBankAmount('(42,10)'), -42.1)
})

test('normalizes common bank dates', () => {
  assert.equal(parseBankDate('10/06/2026'), '2026-06-10')
  assert.equal(parseBankDate('2026-06-10'), '2026-06-10')
  assert.equal(parseBankDate('31/02/2026'), null)
})

test('maps signed amount and separate debit credit columns', () => {
  const signed = mapCsvRows(
    [{ Fecha: '10/06/2026', Concepto: 'Pan', Importe: '-2,50' }],
    { date: 'Fecha', description: 'Concepto', amount: 'Importe' }
  )
  assert.equal(signed[0].type, 'expense')
  assert.equal(signed[0].amount, 2.5)
  assert.equal(signed[0].category, 'Comida')

  const split = mapCsvRows(
    [{ Date: '2026-06-11', Details: 'Nómina', Debit: '', Credit: '1600' }],
    { date: 'Date', description: 'Details', debit: 'Debit', credit: 'Credit' }
  )
  assert.equal(split[0].type, 'income')
  assert.equal(split[0].amount, 1600)
})

test('fingerprint ignores accents, casing and spacing', () => {
  assert.equal(
    createTransactionFingerprint({ date: '2026-06-10', type: 'expense', amount: 2.5, description: '  Café Central ' }),
    createTransactionFingerprint({ date: '2026-06-10', type: 'expense', amount: '2.50', description: 'cafe   central' })
  )
})

test('categorizes common descriptions', () => {
  assert.equal(categorizeBankDescription('MERCADONA 1234'), 'Comida')
  assert.equal(categorizeBankDescription('Ingreso Nómina Empresa', 'income'), 'Nómina')
})

test('flags dates outside the dominant extract year', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    date: index === 11 ? '2026-12-30' : `2025-01-${String(index + 1).padStart(2, '0')}`,
    errors: [],
    warnings: [],
    selected: true
  }))
  const flagged = flagDateOutliers(rows)
  assert.equal(flagged[10].selected, true)
  assert.equal(flagged[11].selected, false)
  assert.match(flagged[11].warnings[0], /2025/)
})

test('applies the longest learned categorization rule', () => {
  const [row] = applyCategorizationRules(
    [{ description: 'MERCADONA AVDA FLORIDA VIGO', type: 'expense', category: 'Varios' }],
    [
      { pattern: 'mercadona', transaction_type: 'expense', category: 'Comida' },
      { pattern: 'mercadona avda', transaction_type: 'expense', category: 'Compras' }
    ]
  )
  assert.equal(row.category, 'Compras')
  assert.equal(row.appliedRule, 'mercadona avda')
})

test('suggests a stable merchant pattern', () => {
  assert.equal(suggestRulePattern('MERCADONA AVDA FLORIDA\\VIGO\\ES2512'), 'mercadona avda')
  assert.equal(suggestRulePattern('12 PADEL ZENTER 000000123'), '12 padel')
})
