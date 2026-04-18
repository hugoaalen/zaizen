import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function RecurringManager({ user }) {
  const [subs, setSubs] = useState([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  
  // NUEVO: Estado para el mes (all = todos los meses)
  const [targetMonth, setTargetMonth] = useState('all')

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ]

  const fetchSubs = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setSubs(data)
  }

  useEffect(() => { fetchSubs() }, [])

  const addSub = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase.from('subscriptions').insert([{ 
      user_id: user.id, 
      amount: parseFloat(amount), 
      description, 
      type,
      // Si es 'all' enviamos null, si no, el número del mes
      month: targetMonth === 'all' ? null : parseInt(targetMonth) 
    }])

    if (error) {
      alert('Error al añadir: ' + error.message)
    } else {
      setAmount('')
      setDescription('')
      setTargetMonth('all')
      fetchSubs()
    }
  }

  const deleteSub = async (id) => {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (!error) fetchSubs()
  }

  return (
    <div className="card" style={{ marginTop: '20px', borderStyle: 'dashed', borderColor: 'var(--border-color)' }}>
      <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Configurar Movimientos Fijos</h4>
      
      <form onSubmit={addSub} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          className="input-minimal" 
          style={{ flex: '2 1 200px' }} 
          placeholder="Descripción (ej: Sueldo)" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          required 
        />
        <input 
          className="input-minimal" 
          style={{ flex: '1 1 80px' }} 
          type="number" 
          step="0.01" 
          placeholder="€" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          required 
        />
        
        <select className="input-minimal" style={{ flex: '1 1 100px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>

        {/* SELECTOR DE PERIODICIDAD */}
        <select className="input-minimal" style={{ flex: '1 1 120px' }} value={targetMonth} onChange={e => setTargetMonth(e.target.value)}>
          <option value="all">🔄 Mensual</option>
          <optgroup label="Mes específico">
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </optgroup>
        </select>

        <button type="submit" className="btn-minimal" style={{ width: '45px' }}>+</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subs.length === 0 && <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>No tienes movimientos fijos configurados.</p>}
        {subs.map(s => (
          <div key={s.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '13px', 
            padding: '10px 15px', 
            background: 'var(--input-bg)', 
            borderRadius: '10px' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: '600' }}>{s.description}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {s.month 
                  ? `📅 Solo en ${months.find(m => m.value === s.month)?.label}` 
                  : '🔄 Todos los meses'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ 
                fontWeight: '700', 
                color: s.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' 
              }}>
                {s.type === 'income' ? '+' : '-'}{Number(s.amount).toFixed(2)}€
              </span>
              <button 
                onClick={() => deleteSub(s.id)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '14px' }}
              >
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}