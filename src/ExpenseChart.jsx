import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const PALETTES = {
  normal: {
    income: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
    expense: ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16', '#e11d48']
  },
  pastel: {
    income: ['#bbf7d0', '#86efac', '#4ade80', '#6ee7b7'],
    expense: ['#ddd6fe', '#fbc7d4', '#fde68a', '#bfdbfe', '#fca5a5', '#fda4af', '#a7f3d0', '#fed7aa', '#d9f99d', '#fecaca']
  },
  vibrante: {
    income: ['#00c853', '#00e676', '#009688', '#69f0ae'],
    expense: ['#7c3aed', '#ec407a', '#ff8f00', '#1e88e5', '#e53935', '#ff6d00', '#00bfa5', '#fdd835', '#8bc34a', '#ab47bc']
  }
}

const groupByCategory = (transactions, type) =>
  transactions
    .filter(transaction => transaction.type === type)
    .reduce((groups, transaction) => {
      const category = transaction.category || 'Varios'
      const existing = groups.find(item => item.name === category)
      if (existing) existing.value += Number(transaction.amount)
      else groups.push({ name: category, value: Number(transaction.amount) })
      return groups
    }, [])
    .sort((a, b) => b.value - a.value)

export default function ExpenseChart({
  transactions,
  chartStyle = { type: 'circular', palette: 'normal' }
}) {
  const [flow, setFlow] = useState('expense')
  const palette = PALETTES[chartStyle.palette] || PALETTES.normal
  const isBar = chartStyle.type === 'barras'
  const data = groupByCategory(transactions, flow)
  const colors = flow === 'income' ? palette.income : palette.expense
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (transactions.length === 0) {
    return <p className="empty-state chart-empty">No hay datos este mes.</p>
  }

  return (
    <div className="compact-chart">
      <div className="compact-chart-header">
        <div>
          <h3>Distribución por categoría</h3>
          <p>Descubre dónde se concentra tu dinero.</p>
        </div>
        <div className="flow-switch">
          <button className={flow === 'expense' ? 'active' : ''} onClick={() => setFlow('expense')}>Gastos</button>
          <button className={flow === 'income' ? 'active' : ''} onClick={() => setFlow('income')}>Ingresos</button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty-state chart-empty">
          No hay {flow === 'income' ? 'ingresos' : 'gastos'} este mes.
        </p>
      ) : isBar ? (
        <div className="chart-canvas" style={{ height: Math.max(230, data.length * 46) }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 300 }}>
            <BarChart data={data} layout="vertical" margin={{ left: 70, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={value => `${value.toFixed(2)} €`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 300 }}>
            <PieChart>
              <Pie data={data} cx="50%" cy="44%" innerRadius={68} outerRadius={94} paddingAngle={4} dataKey="value" stroke="none">
                {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                <Label value={`${total.toFixed(2)} €`} position="center" fill="var(--text-main)" style={{ fontSize: '18px', fontWeight: 'bold' }} />
              </Pie>
              <Tooltip formatter={value => `${value.toFixed(2)} €`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
