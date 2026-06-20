import test from 'node:test'
import assert from 'node:assert/strict'
import {
  preferencesFromRow,
  preferencesToRow,
  sanitizePreferences
} from '../src/preferencesUtils.js'

test('sanitizes unsupported preference values', () => {
  assert.deepEqual(
    sanitizePreferences({
      theme: 'dark',
      monthlyChart: 'unknown',
      yearlyChart: 'area',
      chartPalette: 'vibrante',
      accentColor: 'blue',
      density: 'huge',
      initialView: 'yearly'
    }),
    {
      theme: 'dark',
      monthlyChart: 'circular',
      yearlyChart: 'area',
      chartPalette: 'vibrante',
      accentColor: 'blue',
      density: 'normal',
      initialView: 'yearly'
    }
  )
})

test('maps database preferences to application preferences', () => {
  assert.deepEqual(
    preferencesFromRow({
      theme: 'light',
      monthly_chart: 'mosaico',
      yearly_chart: 'lineas',
      chart_palette: 'pastel',
      accent_color: 'rose',
      density: 'compact',
      initial_view: 'yearly'
    }),
    {
      theme: 'light',
      monthlyChart: 'mosaico',
      yearlyChart: 'lineas',
      chartPalette: 'pastel',
      accentColor: 'rose',
      density: 'compact',
      initialView: 'yearly'
    }
  )
})

test('maps application preferences to a user-scoped database row', () => {
  const row = preferencesToRow('user-1', {
    theme: 'dark',
    monthlyChart: 'barras',
    yearlyChart: 'area',
    chartPalette: 'normal',
    accentColor: 'green',
    density: 'comfortable',
    initialView: 'monthly'
  })

  assert.equal(row.user_id, 'user-1')
  assert.equal(row.monthly_chart, 'barras')
  assert.equal(row.yearly_chart, 'area')
  assert.equal(row.accent_color, 'green')
  assert.equal(row.density, 'comfortable')
  assert.equal(row.initial_view, 'monthly')
  assert.match(row.updated_at, /^\d{4}-\d{2}-\d{2}T/)
})
