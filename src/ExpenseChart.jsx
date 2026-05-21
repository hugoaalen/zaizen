import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

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

export default function ExpenseChart({ transactions, chartStyle = { type: 'circular', palette: 'normal' } }) {
  const pal = PALETTES[chartStyle.palette] || PALETTES.normal
  const isBar = chartStyle.type === 'barras'

  const dataIngresos = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const n = t.category || 'Varios'
      const e = acc.find(i => i.name === n)
      if (e) e.value += Number(t.amount)
      else acc.push({ name: n, value: Number(t.amount) })
      return acc
    }, [])

  const dataGastos = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const n = t.category || 'Varios'
      const e = acc.find(i => i.name === n)
      if (e) e.value += Number(t.amount)
      else acc.push({ name: n, value: Number(t.amount) })
      return acc
    }, [])

  const totalI = dataIngresos.reduce((s, i) => s + i.value, 0)
  const totalE = dataGastos.reduce((s, i) => s + i.value, 0)

  if (transactions.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay datos este mes.</p>
  }

  const neto = totalI - totalE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance Neto</h4>
        <h2 style={{ fontSize: '32px', color: neto >= 0 ? 'var(--color-income)' : 'var(--color-expense)', margin: 0 }}>
          {neto.toFixed(2)}€
        </h2>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '10px' }}>¿De dónde viene tu dinero?</h4>
        {isBar ? (
          <div style={{ width: '100%', height: Math.max(200, dataIngresos.length * 50) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataIngresos} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `${v.toFixed(2)}€`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {dataIngresos.map((_, i) => <Cell key={i} fill={pal.income[i % pal.income.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataIngresos} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {dataIngresos.map((_, i) => <Cell key={i} fill={pal.income[i % pal.income.length]} />)}
                  <Label value={`${totalI.toFixed(2)}€`} position="center" fill="var(--text-main)" style={{ fontSize: '18px', fontWeight: 'bold' }} />
                </Pie>
                <Tooltip formatter={v => `${v.toFixed(2)}€`} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '10px' }}>¿A dónde ha ido tu dinero?</h4>
        {isBar ? (
          <div style={{ width: '100%', height: Math.max(200, dataGastos.length * 50) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGastos} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `${v.toFixed(2)}€`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {dataGastos.map((_, i) => <Cell key={i} fill={pal.expense[i % pal.expense.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataGastos} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {dataGastos.map((_, i) => <Cell key={i} fill={pal.expense[i % pal.expense.length]} />)}
                  <Label value={`${totalE.toFixed(2)}€`} position="center" fill="var(--text-main)" style={{ fontSize: '18px', fontWeight: 'bold' }} />
                </Pie>
                <Tooltip formatter={v => `${v.toFixed(2)}€`} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
