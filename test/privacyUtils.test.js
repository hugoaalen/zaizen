import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBackupPayload,
  createExportFilename,
  transactionsToCsv
} from '../src/privacyUtils.js'

test('exports transactions as semicolon CSV with escaped values', () => {
  const csv = transactionsToCsv([{
    date: '2026-06-12',
    description: 'Compra; "especial"',
    type: 'expense',
    category: 'Compras',
    amount: 12.5
  }])

  assert.match(csv, /^\uFEFFFecha;Descripción;Tipo;Categoría;Importe/)
  assert.match(csv, /"Compra; ""especial""";Gasto;Compras;12,50/)
})

test('creates a versioned backup without authentication secrets', () => {
  const backup = createBackupPayload({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      created_at: '2026-01-01',
      user_metadata: { full_name: 'Test' },
      app_metadata: { providers: ['email', 'google'] }
    },
    data: { transactions: [] },
    exportedAt: '2026-06-12T10:00:00.000Z'
  })

  assert.equal(backup.format, 'zaizen-backup')
  assert.equal(backup.version, 1)
  assert.deepEqual(backup.profile.providers, ['email', 'google'])
  assert.deepEqual(backup.data.transactions, [])
  assert.equal('access_token' in backup.profile, false)
})

test('creates dated export filenames', () => {
  assert.equal(
    createExportFilename('zaizen-movimientos', 'csv', new Date('2026-06-12T12:00:00Z')),
    'zaizen-movimientos-2026-06-12.csv'
  )
})
