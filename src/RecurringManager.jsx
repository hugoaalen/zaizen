import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'

export default function RecurringManager({ user }) {
  const [subs, setSubs] = useState([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  const [targetMonth, setTargetMonth] = useState('all')
  const [category, setCategory] = useState('Varios')
  const [customCategories, setCustomCategories] = useState([])

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ]

  const fetchSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
    if (data) setSubs(data)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('custom_categories').select('name, type')
    if (data) setCustomCategories(data)
  }

  useEffect(() => { 
    fetchSubs()
    fetchCategories()
  }, [])

  const getAvailableCategories = () => {
    // 1. Filtramos las personalizadas del usuario por tipo
    const userCats = customCategories
      .filter(c => c.type === type)
      .map(c => c.name)

    // 2. Usamos nuestras variables globales combinadas con las del usuario
    return type === 'expense' 
      ? [...new Set([...BASE_EXPENSE_CATEGORIES, ...userCats])]
      : [...new Set([...BASE_INCOME_CATEGORIES, ...userCats])]
  }

  const addSub = async (e) => {
    e.preventDefault()
    await supabase.from('subscriptions').insert([{ 
      user_id: user.id, 
      amount: parseFloat(amount), 
      description, 
      type,
      category,
      month: targetMonth === 'all' ? null : parseInt(targetMonth) 
    }])
    setAmount(''); setDescription(''); setCategory('Varios'); fetchSubs()
  }

  const deleteSub = async (id) => {
    await supabase.from('subscriptions').delete().eq('id', id)
    fetchSubs()
  }

  return (
    <div className="card" style={{ marginTop: '20px', borderStyle: 'dashed' }}>
      <h4 style={{ marginBottom: '15px' }}>Tus Gastos/Ingresos Fijos</h4>
      
      <form onSubmit={addSub} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="input-minimal" style={{ flex: '2 1 180px' }} placeholder="Nombre (ej: Alquiler)" value={description} onChange={e => setDescription(e.target.value)} required />
        <input className="input-minimal" style={{ width: '90px' }} type="number" step="0.01" placeholder="€" value={amount} onChange={e => setAmount(e.target.value)} required />
        
        <select className="input-minimal" style={{ width: '110px' }} value={type} onChange={e => { setType(e.target.value); setCategory('Varios'); }}>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>

        <select className="input-minimal" style={{ width: '130px' }} value={category} onChange={e => setCategory(e.target.value)}>
          {getAvailableCategories().map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="input-minimal" style={{ width: '120px' }} value={targetMonth} onChange={e => setTargetMonth(e.target.value)}>
          <option value="all">🔄 Mensual</option>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <button type="submit" className="btn-minimal" style={{ width: 'auto' }}>+</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subs.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--input-bg)', borderRadius: '8px', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: '600' }}>{s.description}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {s.category} • {s.month ? `Solo en ${months.find(m => m.value === s.month)?.label}` : 'Todos los meses'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '700', color: s.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}>
                {s.type === 'income' ? '+' : '-'}{s.amount}€
              </span>
              <button onClick={() => deleteSub(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>❌</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}