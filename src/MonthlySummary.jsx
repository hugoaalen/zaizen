import React from 'react'

export default function MonthlySummary({ transactions }) {
  if (!transactions || transactions.length === 0) return null

  let totalI = 0
  let totalE = 0
  
  const expenseTotals = {}
  const incomeTotals = {}

  // 1. Separar y sumar ingresos y gastos por categoría
  transactions.forEach(t => {
    const amount = Number(t.amount)
    const cat = t.category || 'Varios'

    if (t.type === 'income') {
      totalI += amount
      incomeTotals[cat] = (incomeTotals[cat] || 0) + amount
    } else {
      totalE += amount
      
      // TIP: Si quisieras evitar que "Ahorro" salga como tu mayor gasto, 
      // podrías poner aquí un condicional: if (cat !== 'Ahorro')
      expenseTotals[cat] = (expenseTotals[cat] || 0) + amount
    }
  })

  const netBalance = totalI - totalE
  const savingsRate = totalI > 0 ? Math.round((netBalance / totalI) * 100) : 0

  // 2. Calcular Mayor Gasto
  let topExpenseCat = 'Ninguno'
  let topExpenseAmount = 0
  for (const [cat, amount] of Object.entries(expenseTotals)) {
    if (amount > topExpenseAmount) {
      topExpenseAmount = amount
      topExpenseCat = cat
    }
  }

  // 3. Calcular Mayor Ingreso
  let topIncomeCat = 'Ninguno'
  let topIncomeAmount = 0
  for (const [cat, amount] of Object.entries(incomeTotals)) {
    if (amount > topIncomeAmount) {
      topIncomeAmount = amount
      topIncomeCat = cat
    }
  }

  // 4. Veredicto Mensual
  let veredicto = { text: "Equilibrio perfecto", icon: "🧘‍♂️", color: "var(--text-main)" }
  if (netBalance < 0) {
    veredicto = { text: "Estás gastando más de lo que ingresas", icon: "⚠️", color: "var(--color-expense)" }
  } else if (savingsRate >= 20) {
    veredicto = { text: "Maestro del ahorro (Más del 20%)", icon: "🚀", color: "var(--color-income)" }
  } else if (totalI === 0) {
    veredicto = { text: "Añade tus ingresos para ver el balance", icon: "👀", color: "var(--text-muted)" }
  }

  return (
    <div className="card" style={{ marginBottom: '20px', background: 'var(--input-bg)' }}>
      {/* SECCIÓN VEREDICTO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <span style={{ fontSize: '24px' }}>{veredicto.icon}</span>
        <h3 style={{ margin: 0, fontSize: '16px', color: veredicto.color }}>{veredicto.text}</h3>
      </div>

      {/* SECCIÓN TARJETAS (Grid de 3) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '15px' 
      }}>
        
        {/* TARJETA 1: Tasa de Ahorro (Neutral) */}
        <div style={{ padding: '10px', borderLeft: '3px solid var(--btn-bg)', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasa de Ahorro</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>
            {totalI > 0 ? `${savingsRate}%` : '--'}
          </p>
        </div>

        {/* TARJETA 2: Mayor Ingreso (Verde) */}
        <div style={{ padding: '10px', borderLeft: '3px solid var(--color-income)', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mayor Ingreso</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
            {topIncomeCat} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>({topIncomeAmount.toFixed(0)}€)</span>
          </p>
        </div>

        {/* TARJETA 3: Mayor Gasto (Rojo) */}
        <div style={{ padding: '10px', borderLeft: '3px solid var(--color-expense)', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mayor Gasto</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
            {topExpenseCat} <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>({topExpenseAmount.toFixed(0)}€)</span>
          </p>
        </div>

      </div>
    </div>
  )
}