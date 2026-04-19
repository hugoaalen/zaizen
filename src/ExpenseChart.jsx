import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts'

export default function ExpenseChart({ transactions }) {
  
  // --- 1. LÓGICA DE DATOS ---
  
  // Agrupar INGRESOS por categoría
  const dataIngresos = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const catName = t.category || 'Varios'
      const existing = acc.find(item => item.name === catName)
      if (existing) existing.value += Number(t.amount)
      else acc.push({ name: catName, value: Number(t.amount) })
      return acc
    }, [])

  // Agrupar GASTOS por categoría
  const dataGastos = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const catName = t.category || 'Varios'
      const existing = acc.find(item => item.name === catName)
      if (existing) existing.value += Number(t.amount)
      else acc.push({ name: catName, value: Number(t.amount) })
      return acc
    }, [])

  // Totales para los centros de los gráficos
  const totalIngresos = dataIngresos.reduce((sum, item) => sum + item.value, 0)
  const totalGastos = dataGastos.reduce((sum, item) => sum + item.value, 0)
  const balanceNeto = totalIngresos - totalGastos

  // --- 2. COLORES ---
  const COLORS_INC = ['#10b981', '#34d399', '#059669', '#6ee7b7']; // Verdes
  const COLORS_EXP = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444']; // Variados

  if (transactions.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay datos este mes.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* GRÁFICO 1: BALANCE NETO (PEQUEÑO Y ARRIBA) */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance Neto</h4>
        <h2 style={{ fontSize: '32px', color: balanceNeto >= 0 ? 'var(--color-income)' : 'var(--color-expense)', margin: 0 }}>
          {balanceNeto.toFixed(2)}€
        </h2>
      </div>

      {/* GRÁFICO 2: ORIGEN DE INGRESOS */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '10px' }}>¿De dónde viene tu dinero?</h4>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataIngresos}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={90}
                paddingAngle={5} dataKey="value" stroke="none"
              >
                {dataIngresos.map((entry, index) => (
                  <Cell key={`cell-inc-${index}`} fill={COLORS_INC[index % COLORS_INC.length]} />
                ))}
                <Label 
                  value={`${totalIngresos.toFixed(2)}€`} 
                  position="center" fill="var(--text-main)"
                  style={{ fontSize: '18px', fontWeight: 'bold' }} 
                />
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)}€`} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

      {/* GRÁFICO 3: DISTRIBUCIÓN DE GASTOS */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '10px' }}>¿A dónde ha ido tu dinero?</h4>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataGastos}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={90}
                paddingAngle={5} dataKey="value" stroke="none"
              >
                {dataGastos.map((entry, index) => (
                  <Cell key={`cell-exp-${index}`} fill={COLORS_EXP[index % COLORS_EXP.length]} />
                ))}
                <Label 
                  value={`${totalGastos.toFixed(2)}€`} 
                  position="center" fill="var(--text-main)"
                  style={{ fontSize: '18px', fontWeight: 'bold' }} 
                />
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)}€`} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}