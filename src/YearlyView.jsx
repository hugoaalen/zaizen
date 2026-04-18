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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Selector de Año */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>Balance Anual</h3>
        <input 
          type="number" 
          className="input-minimal" 
          style={{ width: '100px', marginTop: 0 }} 
          value={selectedYear} 
          onChange={e => setSelectedYear(e.target.value)} 
        />
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Ingresos Totales</p>
          <h2 style={{ color: 'var(--color-income)' }}>{totals.income.toFixed(2)}€</h2>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Gastos Totales</p>
          <h2 style={{ color: 'var(--color-expense)' }}>{totals.expense.toFixed(2)}€</h2>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Ahorro Neto</p>
          <h2 style={{ color: 'var(--text-main)' }}>{(totals.income - totals.expense).toFixed(2)}€</h2>
        </div>
      </div>

      {/* Gráfico de Barras Comparativo */}
      <div className="card" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="ingresos" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="gastos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}