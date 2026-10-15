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
    expense: ['#818cf8', '#c084fc', '#f472b6', '#fbbf24', '#60a5fa', '#fb7185', '#2dd4bf', '#fb923c', '#a3e635', '#a78bfa']
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
  const showAmount = width >= 100 && height >= 62
  const share = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 }).format(value / total)
  const showPercentage = width >= 145 && showName
  const maxCharacters = Math.max(3, Math.floor((width - 24 - (showPercentage ? 58 : 0)) / 8))
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
          {visibleName}{showPercentage ? ` · ${share}` : ''}
        </text>
      )}
      {showAmount && (
        <text x={x + 12} y={y + 43} fill={textColor} fillOpacity="0.78" fontSize="11">
          {formatMoney(value)}
        </text>
      )}
    </g>
  )
}

export default function ExpenseChart({
  transactions,
  chartStyle = { type: 'circular', palette: 'normal' },
  onChartTypeChange
}) {
  const [flow, setFlow] = useState('expense')
  const palette = PALETTES[chartStyle.palette] || PALETTES.normal
  const isBar = chartStyle.type === 'barras'
  const isTreemap = chartStyle.type === 'mosaico'
  const preferredCategories = flow === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES
  const data = groupTransactionsByCategory(transactions, flow, preferredCategories)
  const colors = flow === 'income' ? palette.income : palette.expense
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const income = transactions.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const expense = transactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
  const balance = income - expense
  const biggest = data.reduce((best, item) => !best || item.value > best.value ? item : best, null)
  const percent = value => new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 }).format(value)

  if (transactions.length === 0) {
    return <p className="empty-state chart-empty">No hay datos este mes.</p>
  }

  return (
    <div className="compact-chart">
      <div className="compact-chart-header chart-summary-header">
        <div>
          {chartStyle.type === 'balance' ? <h3>Balance del mes</h3> : <>
            <span className="chart-summary-label">Total {flow === 'income' ? 'ingresos' : 'gastos'}</span>
            <strong className="chart-summary-total">{formatMoney(total)}</strong>
          </>}
        </div>
        {chartStyle.type !== 'balance' && <div className="flow-switch">
          <button aria-pressed={flow === 'expense'} className={flow === 'expense' ? 'active' : ''} onClick={() => setFlow('expense')}>Gastos</button>
          <button aria-pressed={flow === 'income'} className={flow === 'income' ? 'active' : ''} onClick={() => setFlow('income')}>Ingresos</button>
        </div>}
      </div>

      {onChartTypeChange && (
        <label className="chart-type-picker">
          Visualización
          <select className="input-minimal" value={chartStyle.type} onChange={event => onChartTypeChange(event.target.value)}>
            <option value="ranking">Ranking · importes y porcentajes</option>
            <option value="balance">Balance · ingresos frente a gastos</option>
            <option value="circular">Circular · distribución</option>
            <option value="barras">Barras · comparar categorías</option>
            <option value="mosaico">Mosaico · peso de cada categoría</option>
          </select>
        </label>
      )}

      {chartStyle.type === 'balance' ? (
        <div className="balance-chart">
          <div className="chart-overview">
            <span>Disponible después de gastos</span>
            <strong className={balance >= 0 ? 'positive' : 'negative'}>{formatMoney(balance)}</strong>
            <p>{income > 0 ? `Gastos equivalen al ${percent(expense / income)} de tus ingresos.` : 'Añade ingresos para medir la proporción de gasto.'}</p>
          </div>
          {[[ 'Ingresos', income, 'var(--color-income)' ], [ 'Gastos', expense, 'var(--color-expense)' ]].map(([label, value, color]) => (
            <div className="comparison-chart-row" key={label}>
              <div><span>{label}</span><strong>{formatMoney(value)}</strong></div>
              <div className="comparison-chart-track" aria-hidden="true"><i style={{ width: `${Math.max(income, expense) > 0 ? value / Math.max(income, expense) * 100 : 0}%`, background: color }} /></div>
            </div>
          ))}
          <p className="chart-takeaway">{balance >= 0 ? 'Tus ingresos cubren los gastos del mes.' : `Faltan ${formatMoney(-balance)} para cubrir los gastos del mes.`}</p>
        </div>
      ) : data.length === 0 ? (
        <p className="empty-state chart-empty">
          No hay {flow === 'income' ? 'ingresos' : 'gastos'} este mes.
        </p>
      ) : chartStyle.type === 'ranking' ? (
        <div className="ranking-chart">
          <div className="chart-overview">
            {biggest && <p>{biggest.name} concentra el {percent(biggest.value / total)} del total.</p>}
          </div>
          <ol className="ranking-chart-list">
            {[...data].sort((a, b) => b.value - a.value).map((item, index) => (
              <li key={item.name} style={{ '--ranking-color': colors[index % colors.length], '--ranking-share': `${item.value / total * 100}%` }}>
                <div className="ranking-chart-heading"><span><span className="ranking-position" aria-hidden="true">{index + 1}</span>{item.name}<small className="ranking-percentage">{percent(item.value / total)}</small></span><strong>{formatMoney(item.value)}</strong></div>
              </li>
            ))}
          </ol>
        </div>
      ) : isBar ? (
        <div className="chart-canvas" style={{ height: Math.max(230, data.length * 46) }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 300 }}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'var(--input-bg)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
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
                isAnimationActive={false}
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
                <Pie data={data} cx="50%" cy="50%" innerRadius="69%" outerRadius="87%" paddingAngle={1.5} cornerRadius={3} dataKey="value" stroke="none" isAnimationActive={false}>
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
                <strong className="category-chart-value">
                  {formatMoney(item.value)}
                  <small>{new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 }).format(item.value / total)}</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
