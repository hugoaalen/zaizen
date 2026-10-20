import test from 'node:test'
import assert from 'node:assert/strict'
import { PAYMENT_METHODS, paymentMethodLabel } from '../src/paymentMethods.js'
import { preferencesFromRow, preferencesToRow, sanitizePreferences } from '../src/preferencesUtils.js'
import { transactionsToCsv } from '../src/privacyUtils.js'

test('payment methods are opt-in and survive preference synchronization', () => {
  assert.equal(sanitizePreferences({}).paymentMethods, 'off')
  assert.equal(sanitizePreferences({ paymentMethods: 'invalid' }).paymentMethods, 'off')
  assert.equal(preferencesFromRow(preferencesToRow('user', { paymentMethods: 'on' })).paymentMethods, 'on')
})

test('payment labels cover supported methods and allow unspecified', () => {
  assert.equal(PAYMENT_METHODS.length, 6)
  assert.equal(paymentMethodLabel('card'), 'Tarjeta')
  assert.equal(paymentMethodLabel(null), '')
})

test('CSV preserves payment methods when present', () => {
  const csv = transactionsToCsv([{ date: '2026-10-20', description: 'Prueba', category: 'Varios', type: 'expense', amount: 10, payment_method: 'cash' }])
  assert.match(csv, /Método de pago\/cobro/)
  assert.match(csv, /Efectivo/)
})
