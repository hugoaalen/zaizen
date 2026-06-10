import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'

export default function RecurringManager({ user, customCategories }) {
  const [subs, setSubs] = useState([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  const [targetMonth, setTargetMonth] = useState('all')
  const [category, setCategory] = useState('Varios')
  const [errorMessage, setErrorMessage] = useState('')

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ]

  const fetchSubs = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setErrorMessage('No se pudieron cargar los movimientos fijos.')
    else setSubs(data)
  }

  useEffect(() => {
    let active = true
    const loadSubscriptions = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) setErrorMessage('No se pudieron cargar los movimientos fijos.')
      else setSubs(data)
    }
    loadSubscriptions()
    return () => { active = false }
  }, [user.id])

  const getAvailableCategories = () => {
    // 1. Filtramos las personalizadas del usuario por tipo
    // Añadimos || [] por si en el primer milisegundo customCategories viene vacío
    const userCats = (customCategories || [])
      .filter(c => c.type === type)
      .map(c => c.name)

    // 2. Usamos nuestras variables globales combinadas con las del usuario
    return type === 'expense' 
      ? [...new Set([...BASE_EXPENSE_CATEGORIES, ...userCats])]
      : [...new Set([...BASE_INCOME_CATEGORIES, ...userCats])]
  }

  const addSub = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    const { error } = await supabase.from('subscriptions').insert([{
      user_id: user.id, 
      amount: parseFloat(amount), 
      description, 
      type,
      category,
      month: targetMonth === 'all' ? null : parseInt(targetMonth) 
    }])
    if (error) {
      setErrorMessage('No se pudo guardar el movimiento fijo.')
      return
    }
    setAmount(''); setDescription(''); setCategory('Varios'); fetchSubs()
  }

  const deleteSub = async (id) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      setErrorMessage('No se pudo eliminar el movimiento fijo.')
      return
    }
    fetchSubs()
  }

  return (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <h3>Movimientos recurrentes</h3>
          <p>Configura pagos e ingresos que se repiten.</p>
        </div>
        <span className="settings-count">{subs.length}</span>
      </div>

      <form onSubmit={addSub} className="settings-form recurring-form">
        <label className="wide-field">
          Nombre
          <input className="input-minimal" placeholder="Ej: Alquiler" value={description} onChange={e => setDescription(e.target.value)} required />
        </label>
        <label>
          Importe
          <input className="input-minimal" type="number" min="0.01" step="0.01" placeholder="0,00 €" value={amount} onChange={e => setAmount(e.target.value)} required />
        </label>
        <label>
          Tipo
          <select className="input-minimal" value={type} onChange={e => { setType(e.target.value); setCategory('Varios'); }}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </label>
        <label>
          Categoría
          <select className="input-minimal" value={category} onChange={e => setCategory(e.target.value)}>
            {getAvailableCategories().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Frecuencia
          <select className="input-minimal" value={targetMonth} onChange={e => setTargetMonth(e.target.value)}>
            <option value="all">Todos los meses</option>
            {months.map(m => <option key={m.value} value={m.value}>Solo {m.label}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-minimal settings-add-button">Añadir recurrente</button>
      </form>

      <div className="recurring-list">
        {subs.length === 0 && <p className="settings-empty">No hay movimientos recurrentes configurados.</p>}
        {subs.map(s => (
          <div key={s.id} className="recurring-row">
            <span className={`category-type-dot ${s.type === 'income' ? 'income' : 'expense'}`} />
            <div>
              <strong>{s.description}</strong>
              <small>{s.category} · {s.month ? `Solo ${months.find(m => m.value === s.month)?.label}` : 'Mensual'}</small>
            </div>
            <span className={s.type === 'income' ? 'amount-income' : 'amount-expense'}>
              {s.type === 'income' ? '+' : '-'}{Number(s.amount).toFixed(2)} €
            </span>
            <button className="icon-button" onClick={() => deleteSub(s.id)} aria-label={`Eliminar recurrente ${s.description}`}>×</button>
          </div>
        ))}
      </div>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </section>
  )
}
