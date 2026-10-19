import { useId, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { summarizeYearCategories } from './yearlyUtils'
import InterfaceIcon from './InterfaceIcon'

const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

function CategoryMonthTooltip({ active, payload }) {
  const row = payload?.[0]?.payload
  if (!active || !row || row.future) return null
  return <div className="chart-tooltip"><span>{row.fullName}</span><strong>{money(row.value)}</strong></div>
}

export default function AnnualCategories({ transactions, year }) {
  const [flow, setFlow] = useState('expense')
  const [category, setCategory] = useState('')
  const gradientId = useId().replace(/:/g, '')
  const categories = summarizeYearCategories(transactions, year, flow)
  const selected = categories.find(item => item.name === category) || categories[0]
  return <section className="yearly-chart-card annual-categories">
    <header><div><span className="section-kicker">Explora tu año</span><h3>Categorías por mes</h3><p>Una categoría, doce meses de perspectiva.</p></div></header>
    <div className="annual-category-controls">
      <div className="segmented-control two-options" role="group" aria-label="Tipo de movimientos por categoría">
        {[['expense', 'Gastos'], ['income', 'Ingresos']].map(([value, label]) => <button key={value} aria-pressed={flow === value} className={flow === value ? 'active' : ''} onClick={() => setFlow(value)}>{label}</button>)}
      </div>
      {selected && <select aria-label="Categoría para comparar entre meses" className="input-minimal" value={selected.name} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item.name}>{item.name}</option>)}</select>}
    </div>
    {!selected ? <p className="empty-state">No hay {flow === 'expense' ? 'gastos' : 'ingresos'} por categoría este año.</p> : <>
      <div className="annual-category-hero"><span>{selected.name} <small>· {year}</small></span><strong>{money(selected.total)}</strong><small>Registrado en meses transcurridos · mes actual en curso</small></div>
      <div className="annual-category-stats">
        <div><small>Media mensual</small><strong>{selected.average === null ? '—' : money(selected.average)}</strong></div>
        <div><small>Mayor importe</small><strong>{selected.peak?.fullName || 'Sin actividad'}</strong><small>{selected.peak ? money(selected.peak.value) : 'Sin movimientos registrados'}</small></div>
      </div>
      <div className="yearly-chart-canvas" role="img" aria-label={`Evolución mensual de ${selected.name}. Importes disponibles debajo.`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={selected.rows} margin={{ top: 16, right: 10, left: -10, bottom: 0 }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--btn-bg)" stopOpacity={.9} /><stop offset="100%" stopColor="var(--btn-bg)" stopOpacity={.3} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="2 6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={<CategoryMonthTooltip />} cursor={{ fill: 'var(--input-bg)', radius: 6 }} />
            {selected.average > 0 && <ReferenceLine y={selected.average} stroke="var(--text-muted)" strokeDasharray="4 5" />}
            <Bar dataKey="actual" name={selected.name} radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false}>{selected.rows.map(row => <Cell key={row.month} fill={row.month === selected.peak?.month ? 'var(--btn-bg)' : `url(#${gradientId})`} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="annual-category-chart-note">Línea discontinua: media mensual. Meses futuros sin representar.</p>
      <details className="annual-category-detail"><summary><span>Desglose mensual</span><InterfaceIcon name="chevron" /></summary><dl>{selected.rows.map(row => <div key={row.month}><dt>{row.fullName}{row.future ? ' · previsto' : ''}</dt><dd>{row.future && !row.value ? '—' : money(row.value)}</dd></div>)}</dl></details>
    </>}
  </section>
}
