const emptyTotals = () => ({ income: 0, expense: 0, balance: 0 })

export const summarizeTransactions = (transactions = []) => {
  const totals = transactions.reduce((summary, transaction) => {
    const amount = Number(transaction.amount)
    if (transaction.type === 'income') summary.income += amount
    else summary.expense += amount
    return summary
  }, emptyTotals())

  totals.balance = totals.income - totals.expense
  return totals
}

export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

export const getExpenseCategoryChanges = (currentTransactions = [], previousTransactions = []) => {
  const sumExpenses = (transactions) =>
    transactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((totals, transaction) => {
        const category = transaction.category || 'Varios'
        totals[category] = (totals[category] || 0) + Number(transaction.amount)
        return totals
      }, {})

  const current = sumExpenses(currentTransactions)
  const previous = sumExpenses(previousTransactions)

  return [...new Set([...Object.keys(current), ...Object.keys(previous)])]
    .map(category => ({
      category,
      current: current[category] || 0,
      previous: previous[category] || 0,
      difference: (current[category] || 0) - (previous[category] || 0)
    }))
    .sort((a, b) => b.difference - a.difference)
}

export const getMonthProgress = (year, month, today = new Date()) => {
  const daysInMonth = new Date(year, month, 0).getDate()
  const selected = year * 12 + month
  const current = today.getFullYear() * 12 + today.getMonth() + 1

  if (selected < current) return { elapsedDays: daysInMonth, daysInMonth, isFuture: false }
  if (selected > current) return { elapsedDays: 0, daysInMonth, isFuture: true }
  return { elapsedDays: today.getDate(), daysInMonth, isFuture: false }
}
