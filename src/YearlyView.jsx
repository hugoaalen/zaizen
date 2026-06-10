import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getMonthIndex } from './dateUtils'

export default function YearlyView({ chartType = 'barras', palette = 'normal' }) {
  const [yearData, setYearData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [totals, setTotals] = useState({ income: 0, expense: 0 })

  const colorIncome = palette === 'pastel' ? '#4ade80' : palette === 'vibrante' ? '#00c853' : 'var(--color-income)'
  const colorExpense = palette === 'pastel' ? '#f87171' : palette === 'vibrante' ? '#ff1744' : 'var(--color-expense)'

  useEffect(() => {
    let active = true

    const loadYearlyData = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount,type,date')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)

      if (error || !active) return

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const chartData = months.map(name => ({ name, ingresos: 0, gastos: 0 }))
      let totalI = 0
      let totalE = 0

      data.forEach(t => {
        const monthIndex = getMonthIndex(t.date)
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

    loadYearlyData()
    return () => { active = false }
  }, [selectedYear])

  const activeExpenseMonths = yearData.filter(m => m.gastos > 0).length || 1
  const averageMonthlyExpense = totals.expense / activeExpenseMonths

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ fontSize: '18px', margin: 0 }}>Balance Anual</h3>
        
        <div style={{ 
          display: 'flex', alignItems: 'center',
          background: 'var(--input-bg)', borderRadius: '12px',
          border: '1px solid var(--border-color)',
          minWidth: '130px', justifyContent: 'space-between'
        }}>
          <button type="button"
            onClick={() => setSelectedYear(y => Number(y) - 1)}
            style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px' }}
          >◀</button>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{selectedYear}</span>
          <button type="button"
            onClick={() => setSelectedYear(y => Number(y) + 1)}
            style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '14px' }}
          >▶</button>
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '15px', marginBottom: '10px'
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Ingresos Totales</p>
          <h2 style={{ color: 'var(--color-income)', margin: 0, fontSize: '22px' }}>{totals.income.toFixed(2)}€</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Gastos Totales</p>
          <h2 style={{ color: 'var(--color-expense)', margin: 0, fontSize: '22px' }}>{totals.expense.toFixed(2)}€</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Ahorro Neto</p>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '22px' }}>{(totals.income - totals.expense).toFixed(2)}€</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Gasto Promedio Mensual</p>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '22px', opacity: 0.8 }}>{averageMonthlyExpense.toFixed(2)}€</h2>
        </div>
      </div>

      <div className="card" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'lineas' ? (
            <LineChart data={yearData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value) => `${value.toFixed(2)}€`}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '14px' }}/>
              <Line type="monotone" dataKey="ingresos" stroke={colorIncome} strokeWidth={3} dot={{fill: colorIncome}} name="Ingresos" />
              <Line type="monotone" dataKey="gastos" stroke={colorExpense} strokeWidth={3} dot={{fill: colorExpense}} name="Gastos" />
            </LineChart>
          ) : (
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
              <Bar dataKey="ingresos" fill={colorIncome} radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="gastos" fill={colorExpense} radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
    </div>
  )
}
