import {
  calculatePercentageChange,
  getExpenseCategoryChanges,
  getMonthProgress,
  summarizeTransactions
} from './insightUtils'

const formatMoney = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)

const formatChange = (current, previous) => {
  const change = calculatePercentageChange(current, previous)
  if (change === null) return 'Sin base anterior'
  return `${change > 0 ? '+' : ''}${change.toFixed(0)}% vs. mes anterior`
}

export default function MonthlySummary({
  transactions,
  previousTransactions,
  selectedMonth,
  selectedYear
}) {
  const current = summarizeTransactions(transactions)
  const previous = summarizeTransactions(previousTransactions)
  const savingsRate = current.income > 0 ? Math.round((current.balance / current.income) * 100) : 0
  const expenseChange = calculatePercentageChange(current.expense, previous.expense)
  const categoryChanges = getExpenseCategoryChanges(transactions, previousTransactions)
  const biggestIncrease = categoryChanges.find(item => item.difference > 0)
  const biggestSaving = [...categoryChanges].reverse().find(item => item.difference < 0)
  const { elapsedDays, daysInMonth, isFuture } = getMonthProgress(selectedYear, selectedMonth)
  const dailyAverage = elapsedDays > 0 ? current.expense / elapsedDays : 0
  const projectedExpense = elapsedDays > 0 ? dailyAverage * daysInMonth : 0

  const statusText = current.income === 0
    ? 'Añade ingresos para medir tu balance'
    : current.balance < 0
      ? 'Gastas más de lo que ingresas'
      : savingsRate >= 20
        ? 'Buen ritmo de ahorro'
        : 'Balance mensual positivo'

  return (
    <section className="dashboard-summary">
      <div className="summary-balance">
        <span>Balance del mes</span>
        <strong className={current.balance >= 0 ? 'positive' : 'negative'}>
          {formatMoney(current.balance)}
        </strong>
        <p>{statusText}</p>
      </div>

      <div className="summary-metrics">
        <article>
          <span>Ingresos</span>
          <strong>{formatMoney(current.income)}</strong>
          <small>{formatChange(current.income, previous.income)}</small>
        </article>
        <article>
          <span>Gastos</span>
          <strong>{formatMoney(current.expense)}</strong>
          <small className={expenseChange !== null && expenseChange <= 0 ? 'positive' : 'negative'}>
            {formatChange(current.expense, previous.expense)}
          </small>
        </article>
        <article>
          <span>Tasa de ahorro</span>
          <strong>{current.income > 0 ? `${savingsRate}%` : '--'}</strong>
          <small>{isFuture ? 'Mes futuro' : `${formatMoney(dailyAverage)} al día`}</small>
        </article>
      </div>

      <div className="summary-insights">
        <p>
          <span className="insight-dot negative" />
          {biggestIncrease
            ? `${biggestIncrease.category} sube ${formatMoney(biggestIncrease.difference)}`
            : 'Sin subidas destacables'}
        </p>
        <p>
          <span className="insight-dot positive" />
          {biggestSaving
            ? `${biggestSaving.category} baja ${formatMoney(Math.abs(biggestSaving.difference))}`
            : 'Sin ahorros destacables'}
        </p>
        <p>
          <span className="insight-dot projection" />
          {isFuture ? 'Sin proyección para meses futuros' : `Proyección: ${formatMoney(projectedExpense)}`}
        </p>
      </div>
    </section>
  )
}
