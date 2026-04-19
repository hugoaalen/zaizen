import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function YearlyView({ session }) {
  const [yearData, setYearData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [totals, setTotals] = useState({ income: 0, expense: 0 })

  const fetchYearlyData = async () => {
    const firstDay = `${selectedYear}-01-01`
    const lastDay = `${selectedYear}-12-31`

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)

    if (data) {
      // 1. Inicializar los 12 meses
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const chartData = months.map(m => ({ name: m, ingresos: 0, gastos: 0 }))
      
      let totalI = 0, totalE = 0

      // 2. Agrupar datos por mes
      data.forEach(t => {
        const monthIndex = new Date(t.date).getMonth()
        const amount = Number(t.amount)
        if (t.type === 'income') {
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
  }

  useEffect(() => { fetchYearlyData() }, [selectedYear])

  // --- LÓGICA NUEVA: Calcular el promedio de gasto mensual ---
  // Filtramos para saber en cuántos meses ha habido algún gasto (para no falsear la media dividiendo entre 12 si llevas 2 meses en la app)
  const activeExpenseMonths = yearData.filter(m => m.gastos > 0).length || 1 // || 1 evita dividir por cero
  const averageMonthlyExpense = totals.expense / activeExpenseMonths

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SELECTOR DE AÑO CON FLECHAS */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ fontSize: '18px', margin: 0 }}>Balance Anual</h3>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--input-bg)', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          minWidth: '130px',
          justifyContent: 'space-between'
        }}>
          <button 
            type="button"
            onClick={() => setSelectedYear(y => Number(y) - 1)} 
            style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px' }}
          >◀</button>
          
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{selectedYear}</span>
          
          <button 
            type="button"
            onClick={() => setSelectedYear(y => Number(y) + 1)} 
            style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px' }}
          >▶</button>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN (Ahora un Grid 2x2 Perfecto) */}
      <div style={{ 
        display: 'grid', 
        /* Con minmax(280px) aseguramos que entren justo 2 en escritorio y salte a 1 columna en móvil */
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '15px',
        marginBottom: '10px'
      }}>
        
        {/* 1. Ingresos */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Ingresos Totales</p>
          <h2 style={{ color: 'var(--color-income)', margin: 0, fontSize: '22px' }}>{totals.income.toFixed(2)}€</h2>
        </div>
        
        {/* 2. Gastos */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Gastos Totales</p>
          <h2 style={{ color: 'var(--color-expense)', margin: 0, fontSize: '22px' }}>{totals.expense.toFixed(2)}€</h2>
        </div>
        
        {/* 3. Ahorro Neto */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Ahorro Neto</p>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '22px' }}>{(totals.income - totals.expense).toFixed(2)}€</h2>
        </div>

        {/* 4. Promedio Mensual (NUEVA TARJETA) */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Gasto Promedio Mensual</p>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '22px', opacity: 0.8 }}>{averageMonthlyExpense.toFixed(2)}€</h2>
        </div>

      </div>

      {/* GRÁFICO DE BARRAS COMPARATIVO */}
      <div className="card" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value) => `${value.toFixed(2)}€`}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }}/>
            <Bar dataKey="ingresos" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="gastos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  )
}