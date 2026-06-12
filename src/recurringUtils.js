export const RECURRING_FREQUENCIES = [
  { value: 'monthly', label: 'Mensual', months: 1 },
  { value: 'bimonthly', label: 'Cada 2 meses', months: 2 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'semiannual', label: 'Semestral', months: 6 },
  { value: 'yearly', label: 'Anual', months: 12 }
]

const toDateParts = value => {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  }
}

const monthIndex = (year, month) => year * 12 + month - 1

const formatIsoDate = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const getFrequencyLabel = frequency =>
  RECURRING_FREQUENCIES.find(option => option.value === frequency)?.label || 'Mensual'

export const getRecurringOccurrenceDate = (subscription, year, month) => {
  if (subscription.active === false) return null

  const legacyMonth = Number(subscription.month)
  const frequency = subscription.frequency || (legacyMonth ? 'yearly' : 'monthly')
  const frequencyMonths =
    RECURRING_FREQUENCIES.find(option => option.value === frequency)?.months || 1
  const start = toDateParts(subscription.start_date) || {
    year: legacyMonth ? 2000 : year,
    month: legacyMonth || month,
    day: 1
  }
  const chargeDay = Number(subscription.charge_day) || start.day || 1
  const targetMonthIndex = monthIndex(year, month)
  const startMonthIndex = monthIndex(start.year, start.month)

  if (targetMonthIndex < startMonthIndex) return null
  if ((targetMonthIndex - startMonthIndex) % frequencyMonths !== 0) return null

  const lastDay = new Date(year, month, 0).getDate()
  const occurrence = formatIsoDate(year, month, Math.min(chargeDay, lastDay))

  if (occurrence < formatIsoDate(start.year, start.month, start.day)) return null
  if (subscription.end_date && occurrence > String(subscription.end_date).slice(0, 10)) return null

  return occurrence
}

export const describeRecurringSchedule = subscription => {
  const frequency = subscription.frequency || (subscription.month ? 'yearly' : 'monthly')
  const day = Number(subscription.charge_day) || 1
  return `${getFrequencyLabel(frequency)} · día ${day}`
}
