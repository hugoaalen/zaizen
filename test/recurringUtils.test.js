import test from 'node:test'
import assert from 'node:assert/strict'
import {
  describeRecurringSchedule,
  getRecurringOccurrenceDate
} from '../src/recurringUtils.js'

test('creates monthly occurrences on the configured charge day', () => {
  const subscription = {
    frequency: 'monthly',
    charge_day: 15,
    start_date: '2026-01-10',
    active: true
  }

  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 6), '2026-06-15')
})

test('adjusts charge day to the last day of short months', () => {
  const subscription = {
    frequency: 'monthly',
    charge_day: 31,
    start_date: '2026-01-01',
    active: true
  }

  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 2), '2026-02-28')
})

test('respects frequency, start date and end date', () => {
  const subscription = {
    frequency: 'quarterly',
    charge_day: 5,
    start_date: '2026-02-01',
    end_date: '2026-09-30',
    active: true
  }

  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 2), '2026-02-05')
  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 3), null)
  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 8), '2026-08-05')
  assert.equal(getRecurringOccurrenceDate(subscription, 2026, 11), null)
})

test('does not create occurrences for paused subscriptions', () => {
  assert.equal(getRecurringOccurrenceDate({
    frequency: 'monthly',
    charge_day: 1,
    start_date: '2026-01-01',
    active: false
  }, 2026, 6), null)
})

test('keeps legacy month-based subscriptions working yearly', () => {
  assert.equal(getRecurringOccurrenceDate({ month: 6 }, 2026, 6), '2026-06-01')
  assert.equal(getRecurringOccurrenceDate({ month: 6 }, 2026, 7), null)
})

test('describes a recurring schedule', () => {
  assert.equal(describeRecurringSchedule({
    frequency: 'semiannual',
    charge_day: 20
  }), 'Semestral · día 20')
})
