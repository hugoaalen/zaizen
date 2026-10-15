import { summarizeTransactions } from './insightUtils.js'

export function summarizeYear(transactions, year, today = new Date()) {
  return Array.from({ length: 12 }, (_, index) => {
    const entries = transactions.filter(item => Number(item.date.slice(0, 4)) === year && Number(item.date.slice(5, 7)) === index + 1)
    const totals = summarizeTransactions(entries)
    const future = year > today.getFullYear() || (year === today.getFullYear() && index > today.getMonth())
    const label = new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(year, index, 1))
    const fullName = label.charAt(0).toUpperCase() + label.slice(1)
    return { month: index + 1, name: fullName.slice(0, 3), fullName, income: totals.income, expense: totals.expense, balance: totals.balance, count: entries.length, future }
  })
}

// Compare the same calendar interval, clamping Feb 29 in non-leap years.
export function comparableYearTotals(transactions, year, today = new Date()) {
  if (year > today.getFullYear()) return null
  const cutoff = targetYear => {
    if (year < today.getFullYear()) return `${targetYear}-12-31`
    const month = today.getMonth() + 1
    const day = Math.min(today.getDate(), new Date(targetYear, month, 0).getDate())
    return `${targetYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  const totals = targetYear => summarizeTransactions(transactions.filter(item => item.date >= `${targetYear}-01-01` && item.date <= cutoff(targetYear)))
  return { current: totals(year), previous: totals(year - 1) }
}
