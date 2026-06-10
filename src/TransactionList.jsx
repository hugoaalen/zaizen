import { supabase } from './supabaseClient'
import { useMemo, useState } from 'react'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import { formatTransactionDate } from './dateUtils'

const normalizeSearchText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

export default function TransactionList({ transactions, user, customCategories, onTransactionDeleted }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const categories = useMemo(
    () => [...new Set(transactions.map(t => t.category || 'Varios'))].sort(),
    [transactions]
  )

  const filteredTransactions = useMemo(() => {
    const term = normalizeSearchText(search.trim())
    return transactions.filter(t => {
      const matchesSearch = !term || normalizeSearchText(t.description).includes(term)
      const matchesType = typeFilter === 'all' || t.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || (t.category || 'Varios') === categoryFilter
      return matchesSearch && matchesType && matchesCategory
    })
  }, [categoryFilter, search, transactions, typeFilter])

  const availableEditCategories = editing
    ? [...new Set([
        ...(editing.type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES),
        ...(customCategories || []).filter(c => c.type === editing.type).map(c => c.name)
      ])]
    : []
  
  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres borrar este movimiento?')) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) setErrorMessage('No se pudo borrar el movimiento.')
      else onTransactionDeleted() // Refresca la lista en el Dashboard
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    const { error } = await supabase
      .from('transactions')
      .update({
        description: editing.description.trim(),
        amount: Number(editing.amount),
        type: editing.type,
        category: editing.category,
        date: editing.date
      })
      .eq('id', editing.id)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo actualizar el movimiento.')
    else {
      setEditing(null)
      onTransactionDeleted()
    }
  }

  const handleDuplicate = async (transaction) => {
    setErrorMessage('')
    const { error } = await supabase.from('transactions').insert([{
      user_id: user.id,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      category: transaction.category || 'Varios',
      date: transaction.date
    }])
    if (error) setErrorMessage('No se pudo duplicar el movimiento.')
    else onTransactionDeleted()
  }

  if (transactions.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
        No hay movimientos este mes.
      </p>
    )
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Historial de este mes</h3>
      <div className="transaction-filters">
        <input
          className="input-minimal"
          type="search"
          placeholder="Buscar movimiento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input-minimal" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </select>
        <select className="input-minimal" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTransactions.map((t) => (
          <div 
            key={t.id} 
            className="card" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderLeft: `4px solid ${t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'}` 
            }}
          >
            <div>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>{t.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatTransactionDate(t.date)}
                </p>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
                  border: t.type === 'income' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                  {t.category}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ 
                fontWeight: '700', 
                color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' 
              }}>
                {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)} €
              </span>
              
              <div className="transaction-actions">
                <button onClick={() => setEditing({ ...t })} className="icon-button" title="Editar" aria-label={`Editar ${t.description}`}>✎</button>
                <button onClick={() => handleDuplicate(t)} className="icon-button" title="Duplicar" aria-label={`Duplicar ${t.description}`}>⧉</button>
                <button onClick={() => handleDelete(t.id)} className="icon-button" title="Borrar" aria-label={`Borrar ${t.description}`}>×</button>
              </div>
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            Ningún movimiento coincide con los filtros.
          </p>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}>
          <form className="modal-card" onSubmit={handleSave} onMouseDown={e => e.stopPropagation()}>
            <h3>Editar movimiento</h3>
            <label>Descripción
              <input className="input-minimal" required value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            </label>
            <div className="edit-grid">
              <label>Importe
                <input className="input-minimal" type="number" min="0.01" step="0.01" required value={editing.amount} onChange={e => setEditing({ ...editing, amount: e.target.value })} />
              </label>
              <label>Fecha
                <input className="input-minimal" type="date" required value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
              </label>
              <label>Tipo
                <select className="input-minimal" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value, category: 'Varios' })}>
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </label>
              <label>Categoría
                <select className="input-minimal" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                  {availableEditCategories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-minimal">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
