import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Treemap,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import { groupTransactionsByCategory } from './categoryUtils'

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

const formatMoney = value => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(value)

function CategoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const item = payload[0]
  return (
    <div className="chart-tooltip">
      <span>{label || item.payload?.name}</span>
      <strong style={{ color: item.color || item.fill }}>{formatMoney(item.value)}</strong>
    </div>
  )
}

function TreemapNode({ x, y, width, height, name, value, index = 0, colors, total, darkText, depth }) {
  if (depth === 0) return null

  const safeName = String(name || 'Sin categoría')
  const showName = width >= 72 && height >= 42
  const showPercentage = width >= 72 && height >= 62
  const maxCharacters = Math.max(5, Math.floor(width / 9))
  const visibleName = safeName.length > maxCharacters
    ? `${safeName.slice(0, Math.max(2, maxCharacters - 1))}…`
    : safeName
  const textColor = darkText ? '#111827' : '#ffffff'

  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, width - 4)}
        height={Math.max(0, height - 4)}
        rx="9"
        fill={colors[index % colors.length]}
      />
      {showName && (
        <text x={x + 12} y={y + 23} fill={textColor} fontSize="12" fontWeight="700">
          {visibleName}
        </text>
      )}
      {showPercentage && (
        <text x={x + 12} y={y + 43} fill={textColor} fillOpacity="0.78" fontSize="11">
          {Math.round((value / total) * 100)}%
        </text>
      )}
    </g>
  )
}

export default function ExpenseChart({
  transactions,
  chartStyle = { type: 'circular', palette: 'normal' }
}) {
  const [flow, setFlow] = useState('expense')
  const palette = PALETTES[chartStyle.palette] || PALETTES.normal
  const isBar = chartStyle.type === 'barras'
  const isTreemap = chartStyle.type === 'mosaico'
  const preferredCategories = flow === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES
  const data = groupTransactionsByCategory(transactions, flow, preferredCategories)
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
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'var(--input-bg)' }} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : isTreemap ? (
        <div className="treemap-chart">
          <div className="treemap-canvas">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 310 }}>
              <Treemap
                data={data}
                dataKey="value"
                nameKey="name"
                stroke="none"
                content={(
                  <TreemapNode
                    colors={colors}
                    total={total}
                    darkText={chartStyle.palette === 'pastel'}
                  />
                )}
              >
                <Tooltip content={<CategoryTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <div className="treemap-total">
            <span>Total {flow === 'income' ? 'ingresos' : 'gastos'}</span>
            <strong>{formatMoney(total)}</strong>
            <small>{data.length} {data.length === 1 ? 'categoría' : 'categorías'}</small>
          </div>
        </div>
      ) : (
        <div className="donut-chart">
          <div className="donut-visual">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 250 }}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius="63%" outerRadius="84%" paddingAngle={3} dataKey="value" stroke="none">
                  {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip content={<CategoryTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span>Total {flow === 'income' ? 'ingresos' : 'gastos'}</span>
              <strong>{formatMoney(total)}</strong>
              <small>{data.length} {data.length === 1 ? 'categoría' : 'categorías'}</small>
            </div>
          </div>

          <div className="donut-legend" aria-label="Categorías del gráfico">
            {data.map((item, index) => (
              <div className="donut-legend-item" key={item.name}>
                <i style={{ background: colors[index % colors.length] }} />
                <span title={item.name}>{item.name}</span>
                <strong>{Math.round((item.value / total) * 100)}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
