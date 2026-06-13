import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import {
  describeRecurringSchedule,
  getFrequencyLabel,
  RECURRING_FREQUENCIES
} from './recurringUtils'

const createInitialForm = () => ({
  amount: '',
  description: '',
  type: 'expense',
  category: 'Varios',
  frequency: 'monthly',
  chargeDay: '1',
  alwaysActive: true,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: ''
})

export default function RecurringManager({ user, customCategories }) {
  const [subs, setSubs] = useState([])
  const [form, setForm] = useState(createInitialForm)
  const [editingId, setEditingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

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
    const userCats = (customCategories || [])
      .filter(c => c.type === form.type)
      .map(c => c.name)

    return form.type === 'expense'
      ? [...new Set([...BASE_EXPENSE_CATEGORIES, ...userCats])]
      : [...new Set([...BASE_INCOME_CATEGORIES, ...userCats])]
  }

  const updateForm = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(createInitialForm())
    setEditingId(null)
  }

  const addSub = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    const formData = new FormData(e.currentTarget)
    const payload = {
      user_id: user.id,
      amount: Number(formData.get('amount')),
      description: String(formData.get('description')).trim(),
      type: String(formData.get('type')),
      category: String(formData.get('category')),
      month: null,
      frequency: String(formData.get('frequency')),
      charge_day: Number(formData.get('chargeDay')),
      start_date: form.alwaysActive ? '2000-01-01' : String(formData.get('startDate')),
      end_date: form.alwaysActive ? null : String(formData.get('endDate')) || null
    }
    const query = editingId
      ? supabase.from('subscriptions').update(payload).eq('id', editingId).eq('user_id', user.id)
      : supabase.from('subscriptions').insert([payload])
    const { error } = await query
    if (error) {
      setErrorMessage(`No se pudo guardar el movimiento recurrente: ${error.message}`)
      return
    }
    resetForm()
    fetchSubs()
  }

  const editSub = subscription => {
    setEditingId(subscription.id)
    setForm({
      amount: String(subscription.amount),
      description: subscription.description,
      type: subscription.type,
      category: subscription.category || 'Varios',
      frequency: subscription.frequency || (subscription.month ? 'yearly' : 'monthly'),
      chargeDay: String(subscription.charge_day || 1),
      alwaysActive: subscription.start_date === '2000-01-01' && !subscription.end_date,
      startDate: subscription.start_date || new Date().toISOString().slice(0, 10),
      endDate: subscription.end_date || ''
    })
  }

  const toggleSub = async subscription => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ active: subscription.active === false })
      .eq('id', subscription.id)
      .eq('user_id', user.id)
    if (error) {
      setErrorMessage('No se pudo cambiar el estado del movimiento recurrente.')
      return
    }
    fetchSubs()
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
          <p>Define cuándo empiezan, cuándo terminan y cada cuánto se repiten.</p>
        </div>
        <span className="settings-count">{subs.filter(subscription => subscription.active !== false).length}</span>
      </div>

      <form onSubmit={addSub} className="settings-form recurring-form">
        <label className="wide-field">
          Nombre
          <input className="input-minimal" name="description" placeholder="Ej: Alquiler" value={form.description} onChange={e => updateForm('description', e.target.value)} required />
        </label>
        <label>
          Importe
          <input className="input-minimal" name="amount" type="number" min="0.01" step="0.01" placeholder="0,00 €" value={form.amount} onChange={e => updateForm('amount', e.target.value)} required />
        </label>
        <label>
          Tipo
          <select className="input-minimal" name="type" value={form.type} onChange={e => setForm(current => ({ ...current, type: e.target.value, category: 'Varios' }))}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </label>
        <label>
          Categoría
          <select className="input-minimal" name="category" value={form.category} onChange={e => updateForm('category', e.target.value)}>
            {getAvailableCategories().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Frecuencia
          <select className="input-minimal" name="frequency" value={form.frequency} onChange={e => updateForm('frequency', e.target.value)}>
            {RECURRING_FREQUENCIES.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Día de cargo
          <input className="input-minimal" name="chargeDay" type="number" min="1" max="31" value={form.chargeDay} onChange={e => updateForm('chargeDay', e.target.value)} required />
        </label>
        <label className="recurring-always-active">
          <input
            type="checkbox"
            checked={form.alwaysActive}
            onChange={e => updateForm('alwaysActive', e.target.checked)}
          />
          <span>
            <strong>Siempre activo</strong>
            <small>Sin fecha de inicio ni de fin, como los recurrentes anteriores.</small>
          </span>
        </label>
        {!form.alwaysActive && (
          <>
            <label>
              Fecha de inicio
              <input className="input-minimal" name="startDate" type="date" value={form.startDate} onChange={e => updateForm('startDate', e.target.value)} required />
            </label>
            <label>
              Fecha de fin
              <input className="input-minimal" name="endDate" type="date" min={form.startDate} value={form.endDate} onChange={e => updateForm('endDate', e.target.value)} />
            </label>
          </>
        )}
        <div className="recurring-form-actions">
          {editingId && <button type="button" className="btn-outline" onClick={resetForm}>Cancelar</button>}
          <button type="submit" className="btn-minimal settings-add-button">
            {editingId ? 'Guardar cambios' : 'Añadir recurrente'}
          </button>
        </div>
      </form>

      <div className="recurring-list">
        {subs.length === 0 && <p className="settings-empty">No hay movimientos recurrentes configurados.</p>}
        {subs.map(s => (
          <div key={s.id} className={`recurring-row ${s.active === false ? 'paused' : ''}`}>
            <span className={`category-type-dot ${s.type === 'income' ? 'income' : 'expense'}`} />
            <div className="recurring-row-content">
              <strong>{s.description}</strong>
              <small>{s.category} · {describeRecurringSchedule(s)}</small>
              <small>
                {s.start_date === '2000-01-01' && !s.end_date
                  ? 'Siempre activo'
                  : `Desde ${s.start_date}${s.end_date ? ` hasta ${s.end_date}` : ' · sin fecha de fin'}`}
              </small>
            </div>
            <span className={s.type === 'income' ? 'amount-income' : 'amount-expense'}>
              {s.type === 'income' ? '+' : '-'}{Number(s.amount).toFixed(2)} €
            </span>
            <span className={`recurring-status ${s.active === false ? 'paused' : 'active'}`}>
              {s.active === false ? 'Pausado' : getFrequencyLabel(s.frequency || (s.month ? 'yearly' : 'monthly'))}
            </span>
            <div className="recurring-row-actions">
              <button className="icon-button" onClick={() => editSub(s)} aria-label={`Editar recurrente ${s.description}`} title="Editar">✎</button>
              <button className="icon-button" onClick={() => toggleSub(s)} aria-label={`${s.active === false ? 'Reactivar' : 'Pausar'} recurrente ${s.description}`} title={s.active === false ? 'Reactivar' : 'Pausar'}>
                {s.active === false ? '▶' : 'Ⅱ'}
              </button>
              <button className="icon-button" onClick={() => deleteSub(s.id)} aria-label={`Eliminar recurrente ${s.description}`} title="Eliminar">×</button>
            </div>
          </div>
        ))}
      </div>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </section>
  )
}
