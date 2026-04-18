import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts'

export default function ExpenseChart({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>No hay datos para mostrar en el gráfico.</p>
  }

  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += Number(t.amount)
    if (t.type === 'expense') totalExpense += Number(t.amount)
  })

  const data = [
    { name: 'Gastos', value: totalExpense, color: '#ef4444' },
    { name: 'Ingresos', value: totalIncome, color: '#10b981' }
  ]

  const balance = totalIncome - totalExpense
  const balanceColor = balance >= 0 ? '#10b981' : '#ef4444'

  return (
    <div style={{ height: '350px', width: '100%', marginTop: '10px' }}>
      
      <ResponsiveContainer width="100%" height="100%">
        {/* Eliminamos el margin problemático */}
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            
            {/* Centrado perfecto usando el viewBox real */}
            <Label
              content={({ viewBox: { cx, cy } }) => (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                  <tspan x={cx} dy="-25" fill="#6b7280" style={{ fontSize: '14px' }}>
                    Saldo Total
                  </tspan>
                  {/* El dy="24" empuja esta línea exactamente 24px por debajo de la anterior */}
                  <tspan x={cx} dy="24" fill={balanceColor} style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {balance.toFixed(2)} €
                  </tspan>
                </text>
              )}
            />
          </Pie>
          
          <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
          {/* Añadimos wrapperStyle para separar la leyenda sin romper la gráfica */}
          <Legend iconType="square" verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}