import { useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
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
  const [expanded, setExpanded] = useState(false)

  const categories = useMemo(
    () => [...new Set(transactions.map(transaction => transaction.category || 'Varios'))].sort(),
    [transactions]
  )

  const filteredTransactions = useMemo(() => {
    const term = normalizeSearchText(search.trim())
    return transactions.filter(transaction => {
      const matchesSearch = !term || normalizeSearchText(transaction.description).includes(term)
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || (transaction.category || 'Varios') === categoryFilter
      return matchesSearch && matchesType && matchesCategory
    })
  }, [categoryFilter, search, transactions, typeFilter])

  const availableEditCategories = editing
    ? [...new Set([
        ...(editing.type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES),
        ...(customCategories || []).filter(category => category.type === editing.type).map(category => category.name)
      ])]
    : []

  const visibleTransactions = expanded ? filteredTransactions : filteredTransactions.slice(0, 5)

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que quieres borrar este movimiento?')) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo borrar el movimiento.')
    else onTransactionDeleted()
  }

  const handleSave = async (event) => {
    event.preventDefault()
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
    return <p className="empty-state history-empty">No hay movimientos este mes.</p>
  }

  return (
    <div className="compact-history">
      <div className="compact-history-heading">
        <div>
          <h3>Últimos movimientos</h3>
          <p>{transactions.length} movimientos este mes</p>
        </div>
        {transactions.length > 5 && (
          <button className="btn-outline" onClick={() => setExpanded(value => !value)}>
            {expanded ? 'Mostrar menos' : 'Ver todos'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="transaction-filters">
          <input className="input-minimal" type="search" placeholder="Buscar movimiento..." value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input-minimal" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </select>
          <select className="input-minimal" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
      )}

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

      <div className="compact-history-list">
        {visibleTransactions.map(transaction => (
          <article className="compact-transaction" key={transaction.id}>
            <span className={`transaction-mark ${transaction.type}`} />
            <div className="transaction-copy">
              <strong>{transaction.description}</strong>
              <small>{formatTransactionDate(transaction.date)} · {transaction.category || 'Varios'}</small>
            </div>
            <div className="transaction-side">
              <span className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                {transaction.type === 'income' ? '+' : '-'}{Number(transaction.amount).toFixed(2)} €
              </span>
              <div className="transaction-actions">
                <button onClick={() => setEditing({ ...transaction })} className="icon-button" title="Editar" aria-label={`Editar ${transaction.description}`}>✎</button>
                <button onClick={() => handleDuplicate(transaction)} className="icon-button" title="Duplicar" aria-label={`Duplicar ${transaction.description}`}>⧉</button>
                <button onClick={() => handleDelete(transaction.id)} className="icon-button" title="Borrar" aria-label={`Borrar ${transaction.description}`}>×</button>
              </div>
            </div>
          </article>
        ))}

        {filteredTransactions.length === 0 && (
          <p className="empty-state">Ningún movimiento coincide con los filtros.</p>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}>
          <form className="modal-card" onSubmit={handleSave} onMouseDown={event => event.stopPropagation()}>
            <h3>Editar movimiento</h3>
            <label>Descripción
              <input className="input-minimal" required value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} />
            </label>
            <div className="edit-grid">
              <label>Importe
                <input className="input-minimal" type="number" min="0.01" step="0.01" required value={editing.amount} onChange={event => setEditing({ ...editing, amount: event.target.value })} />
              </label>
              <label>Fecha
                <input className="input-minimal" type="date" required value={editing.date} onChange={event => setEditing({ ...editing, date: event.target.value })} />
              </label>
              <label>Tipo
                <select className="input-minimal" value={editing.type} onChange={event => setEditing({ ...editing, type: event.target.value, category: 'Varios' })}>
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </label>
              <label>Categoría
                <select className="input-minimal" value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })}>
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
