import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { supabase } from './supabaseClient'
import { getMonthIndex } from './dateUtils'

const formatMoney = value => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(value)

function AnnualTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip annual-chart-tooltip">
      <span>{label}</span>
      {payload.map(item => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <i style={{ background: item.color }} />
          <small>{item.name}</small>
          <strong>{formatMoney(item.value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default function YearlyView({ user, chartType = 'barras', palette = 'normal' }) {
  const [yearData, setYearData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [totals, setTotals] = useState({ income: 0, expense: 0 })
  const currentYear = new Date().getFullYear()

  const colorIncome = palette === 'pastel' ? '#4ade80' : palette === 'vibrante' ? '#00c853' : 'var(--color-income)'
  const colorExpense = palette === 'pastel' ? '#f87171' : palette === 'vibrante' ? '#ff1744' : 'var(--color-expense)'
  const chartLabel = chartType === 'lineas'
    ? 'Líneas'
    : chartType === 'area'
      ? 'Área'
      : 'Barras'

  useEffect(() => {
    let active = true

    const loadYearlyData = async () => {
      let query = supabase
        .from('transactions')
        .select('amount,type,date')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)

      if (user?.id) query = query.eq('user_id', user.id)

      const { data, error } = await query
      if (error || !active) return

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const chartData = months.map(name => ({ name, ingresos: 0, gastos: 0 }))
      let totalI = 0
      let totalE = 0

      data.forEach(transaction => {
        const monthIndex = getMonthIndex(transaction.date)
        const amount = Number(transaction.amount)
        if (transaction.type === 'income') {
          chartData[monthIndex].ingresos += amount
          totalI += amount
        } else {
          chartData[monthIndex].gastos += amount
          totalE += amount
        }
      })

      setYearData(chartData)
      setTotals({ income: totalI, expense: totalE })
    }

    loadYearlyData()
    return () => { active = false }
  }, [selectedYear, user?.id])

  const netSavings = totals.income - totals.expense
  const activeExpenseMonths = yearData.filter(month => month.gastos > 0).length
  const averageMonthlyExpense = activeExpenseMonths ? totals.expense / activeExpenseMonths : 0
  const savingsRate = totals.income ? Math.round((netSavings / totals.income) * 100) : 0
  const hasYearData = totals.income > 0 || totals.expense > 0
  const bestMonth = hasYearData
    ? yearData.reduce((best, month) => {
        const balance = month.ingresos - month.gastos
        return !best || balance > best.balance ? { name: month.name, balance } : best
      }, null)
    : null

  const chartProps = {
    data: yearData,
    margin: { top: 12, right: 10, left: -12, bottom: 0 }
  }

  const chartContent = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
      <Tooltip content={<AnnualTooltip />} cursor={{ fill: 'var(--input-bg)' }} />
      <Legend verticalAlign="top" height={42} wrapperStyle={{ fontSize: '13px' }} />
    </>
  )

  return (
    <div className="yearly-view">
      <section className="yearly-toolbar">
        <div>
          <span className="section-kicker">Resumen anual</span>
          <h2>Tu año financiero</h2>
          <p>Compara ingresos, gastos y capacidad de ahorro mes a mes.</p>
        </div>
        <div className="yearly-period">
          <div className="year-stepper">
            <button type="button" onClick={() => setSelectedYear(year => year - 1)} aria-label="Año anterior">‹</button>
            <strong>{selectedYear}</strong>
            <button type="button" onClick={() => setSelectedYear(year => year + 1)} aria-label="Año siguiente">›</button>
          </div>
          {selectedYear !== currentYear && (
            <button className="btn-outline" type="button" onClick={() => setSelectedYear(currentYear)}>Este año</button>
          )}
        </div>
      </section>

      <section className="yearly-summary">
        <div className="yearly-balance">
          <span>Balance del año</span>
          <strong className={netSavings >= 0 ? 'positive' : 'negative'}>{formatMoney(netSavings)}</strong>
          <p>{savingsRate}% de los ingresos conservados</p>
        </div>
        <div className="yearly-metrics">
          <article>
            <span>Ingresos totales</span>
            <strong className="positive">{formatMoney(totals.income)}</strong>
          </article>
          <article>
            <span>Gastos totales</span>
            <strong className="negative">{formatMoney(totals.expense)}</strong>
          </article>
          <article>
            <span>Gasto medio mensual</span>
            <strong>{formatMoney(averageMonthlyExpense)}</strong>
          </article>
        </div>
        <div className="yearly-highlight">
          <span>Mejor balance mensual</span>
          <strong>{bestMonth?.name || '--'}</strong>
          <small>{bestMonth ? formatMoney(bestMonth.balance) : 'Sin datos'}</small>
        </div>
      </section>

      <section className="yearly-chart-card">
        <header>
          <div>
            <h3>Evolución mensual</h3>
            <p>Ingresos y gastos registrados durante {selectedYear}.</p>
          </div>
          <span>{chartLabel}</span>
        </header>
        <div className="yearly-chart-canvas">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 900, height: 360 }}>
            {chartType === 'lineas' ? (
              <LineChart {...chartProps}>
                {chartContent}
                <Line type="monotone" dataKey="ingresos" stroke={colorIncome} strokeWidth={3} dot={{ fill: colorIncome, strokeWidth: 0 }} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke={colorExpense} strokeWidth={3} dot={{ fill: colorExpense, strokeWidth: 0 }} name="Gastos" />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart {...chartProps}>
                <defs>
                  <linearGradient id="annualIncomeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorIncome} stopOpacity={0.38} />
                    <stop offset="95%" stopColor={colorIncome} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="annualExpenseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorExpense} stopOpacity={0.34} />
                    <stop offset="95%" stopColor={colorExpense} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                {chartContent}
                <Area type="monotone" dataKey="ingresos" stroke={colorIncome} strokeWidth={3} fill="url(#annualIncomeArea)" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stroke={colorExpense} strokeWidth={3} fill="url(#annualExpenseArea)" name="Gastos" />
              </AreaChart>
            ) : (
              <BarChart {...chartProps}>
                {chartContent}
                <Bar dataKey="ingresos" fill={colorIncome} radius={[5, 5, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill={colorExpense} radius={[5, 5, 0, 0]} name="Gastos" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
