import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { supabase } from './supabaseClient'
import ChevronIcon from './ChevronIcon'
import InterfaceIcon from './InterfaceIcon'
import { describeDataError } from './dataErrorUtils'
import { summarizeYear, comparableYearTotals } from './yearlyUtils'
import { fetchAllRows } from './paginationUtils'
import AnnualCategories from './AnnualCategories'

const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

function AnnualTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{label}</span>{payload.map(item => <div className="chart-tooltip-row" key={item.dataKey}><small>{item.name}</small><strong>{money(item.value)}</strong></div>)}</div>
}

export default function YearlyView({ user, chartType = 'barras', palette = 'normal', onSelectMonth }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [metric, setMetric] = useState('flows')
  const today = new Date()
  const rows = summarizeYear(transactions, year, today)
  const totals = rows.reduce((sum, row) => ({ income: sum.income + row.income, expense: sum.expense + row.expense, balance: sum.balance + row.balance }), { income: 0, expense: 0, balance: 0 })
  const comparison = comparableYearTotals(transactions, year, today)
  const rate = totals.income ? Math.round(totals.balance / totals.income * 100) : null
  const colorIncome = palette === 'pastel' ? '#86efac' : palette === 'vibrante' ? '#00c853' : 'var(--color-income)'
  const colorExpense = palette === 'pastel' ? '#fca5a5' : palette === 'vibrante' ? '#ff1744' : 'var(--color-expense)'
  const chartRows = rows.map(row => ({ ...row, income: row.future ? null : row.income, expense: row.future ? null : row.expense, balance: row.future ? null : row.balance }))
  const best = rows.filter(row => !row.future && row.count).reduce((best, row) => !best || row.balance > best.balance ? row : best, null)
  const elapsedMonths = year < today.getFullYear() ? 12 : year === today.getFullYear() ? today.getMonth() + 1 : 0
  const currentExpenses = rows.filter(row => !row.future).reduce((sum, row) => sum + row.expense, 0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      setTransactions([])
      const result = await fetchAllRows(() => supabase.from('transactions').select('amount,type,date,category').eq('user_id', user.id).gte('date', `${year - 1}-01-01`).lte('date', `${year}-12-31`).order('id'))
      if (!active) return
      setLoading(false)
      if (result.error) setError(describeDataError(result.error, 'cargar el resumen anual'))
      else setTransactions(result.data || [])
    }
    load()
    return () => { active = false }
  }, [user.id, year, retry])

  const axes = <>
    <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="2 6" />
    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
    <Tooltip content={<AnnualTooltip />} />
  </>
  const common = { data: chartRows, margin: { top: 16, right: 10, bottom: 0, left: -10 } }
  const series = [['income', 'Ingresos', colorIncome], ['expense', 'Gastos', colorExpense]]

  return <div className="yearly-view">
    <section className="yearly-toolbar">
      <div><span className="section-kicker">Resumen anual</span><h2>Tu año financiero</h2><p>Ingresos, gastos y ahorro, mes a mes.</p></div>
      <div className="yearly-period"><div className="year-stepper">
        <button aria-label="Año anterior" onClick={() => setYear(year - 1)}><ChevronIcon /></button><strong>{year}</strong><button aria-label="Año siguiente" onClick={() => setYear(year + 1)}><ChevronIcon direction="right" /></button>
      </div>{year !== today.getFullYear() && <button className="btn-outline" onClick={() => setYear(today.getFullYear())}>Este año</button>}</div>
    </section>
    {loading ? <p role="status" className="loading-state">Cargando resumen anual…</p> : error ? <div role="alert"><p>{error}</p><button className="btn-outline" onClick={() => setRetry(retry + 1)}>Reintentar</button></div> : <>
      <section className="yearly-summary">
        <div className="yearly-balance"><span>Ahorro neto del año</span><strong className={totals.balance >= 0 ? 'positive' : 'negative'}>{money(totals.balance)}</strong><p>{rate === null ? 'Sin ingresos para calcular tasa de ahorro' : `Tasa de ahorro: ${rate}%`}</p></div>
        <div className="yearly-metrics"><article><span>Ingresos</span><strong>{money(totals.income)}</strong></article><article><span>Gastos</span><strong>{money(totals.expense)}</strong></article><article><span>Tasa de ahorro</span><strong>{rate === null ? '—' : `${rate}%`}</strong></article></div>
        <div className="yearly-highlight"><span>Mejor mes con actividad</span><strong>{best?.fullName || 'Sin actividad'}</strong><small>{best ? money(best.balance) : ''} · Gasto medio: {elapsedMonths ? money(currentExpenses / elapsedMonths) : '—'}/mes</small></div>
      </section>
      {comparison && <div className="yearly-comparison card"><h3>Frente a {year - 1}</h3><p>{year === today.getFullYear() ? `Mismo periodo hasta ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(today)} de cada año.` : 'Comparación de años completos.'}</p>{comparison.previous.income || comparison.previous.expense ? <p>Gasto: {money(Math.abs(comparison.current.expense - comparison.previous.expense))} {comparison.current.expense > comparison.previous.expense ? 'más' : 'menos'}. Ahorro neto: {money(comparison.current.balance - comparison.previous.balance)} de diferencia.</p> : <p>No hay movimientos del año anterior para comparar.</p>}</div>}
      <section className="yearly-chart-card">
        <header><div><h3>{metric === 'flows' ? 'Ingresos y gastos' : 'Ahorro de cada mes'}</h3><p>Meses futuros sin representar como ceros. Consulta registros previstos en el detalle.</p></div></header>
        <div className="segmented-control two-options yearly-metric-switch">{[['flows', 'Ingresos y gastos'], ['savings', 'Ahorro mensual']].map(([value, label]) => <button key={value} aria-pressed={metric === value} className={metric === value ? 'active' : ''} onClick={() => setMetric(value)}>{label}</button>)}</div>
        <div className="annual-savings-key"><span><i style={{ background: colorIncome }} />{metric === 'savings' ? 'Balance positivo' : 'Ingresos'}</span><span><i style={{ background: colorExpense }} />{metric === 'savings' ? 'Balance negativo' : 'Gastos'}</span></div>
        {!rows.some(row => row.count) ? <p className="empty-state">Todavía no hay movimientos este año.</p> : <div className="yearly-chart-canvas"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {metric === 'savings' ? <BarChart {...common}>{axes}<Bar dataKey="balance" name="Ahorro neto" radius={[5, 5, 0, 0]} isAnimationActive={false}>{chartRows.map(row => <Cell key={row.month} fill={row.balance >= 0 ? colorIncome : colorExpense} />)}</Bar></BarChart> : chartType === 'lineas' ? <LineChart {...common}>{axes}{series.map(([key, name, color]) => <Line key={key} dataKey={key} name={name} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />)}</LineChart> : chartType === 'area' ? <AreaChart {...common}>{axes}{series.map(([key, name, color]) => <Area key={key} dataKey={key} name={name} stroke={color} fill={color} fillOpacity={.12} strokeWidth={2.5} isAnimationActive={false} />)}</AreaChart> : <BarChart {...common}>{axes}{series.map(([key, name, color]) => <Bar key={key} dataKey={key} name={name} fill={color} maxBarSize={24} radius={[5, 5, 0, 0]} isAnimationActive={false} />)}</BarChart>}
        </ResponsiveContainer></div>}
      </section>
      <AnnualCategories transactions={transactions} year={year} />
      <section className="card annual-month-details"><h3>Detalle por mes</h3><p>Selecciona un mes para abrir sus movimientos.</p>
        <div className="annual-month-list">{rows.map(row => (
          <button key={row.month} onClick={() => onSelectMonth?.(year, row.month)} className={`annual-month-tile ${row.balance > 0 ? 'surplus' : row.balance < 0 ? 'deficit' : 'neutral'} ${row.future ? 'future' : ''}`} aria-label={`Abrir ${row.fullName} de ${year}. Ingresos ${money(row.income)}, gastos ${money(row.expense)}, balance ${money(row.balance)}`}>
            <span className="annual-month-title"><strong>{row.fullName}</strong><InterfaceIcon name="expense" /></span>
            <span className="annual-month-status">{row.future ? 'Mes futuro · previsto' : row.count ? `${row.count} movimientos` : 'Sin actividad'}</span>
            <span className={`annual-month-balance ${row.balance >= 0 ? 'positive' : 'negative'}`}>{money(row.balance)}<small>Balance del mes</small></span>
            <span className="annual-month-flows"><span><small>Ingresos</small>{money(row.income)}</span><span><small>Gastos</small>{money(row.expense)}</span></span>
          </button>
        ))}</div>
      </section>
    </>}
  </div>
}
