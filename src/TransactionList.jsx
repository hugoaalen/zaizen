import { useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import { formatTransactionDate } from './dateUtils'
import {
  getPreferredCategoryName,
  mergeCategoryNames,
  normalizeCategoryKey
} from './categoryUtils'
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_FINANCIAL_AMOUNT
} from './securityUtils'

const normalizeSearchText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

const formatMoney = value => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(value)

function ActionIcon({ type }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  }

  if (type === 'edit') {
    return <svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
  }

  if (type === 'duplicate') {
    return <svg {...props}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
  }

  return <svg {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></svg>
}

export default function TransactionList({ transactions, user, customCategories, onTransactionDeleted }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [expanded, setExpanded] = useState(false)

  const categories = useMemo(
    () => mergeCategoryNames(transactions.map(transaction =>
      getPreferredCategoryName(
        transaction.category,
        transaction.type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES
      )
    )).sort(),
    [transactions]
  )

  const filteredTransactions = useMemo(() => {
    const term = normalizeSearchText(search.trim())
    return transactions.filter(transaction => {
      const matchesSearch = !term || normalizeSearchText(transaction.description).includes(term)
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesCategory = categoryFilter === 'all'
        || normalizeCategoryKey(transaction.category || 'Varios') === normalizeCategoryKey(categoryFilter)
      return matchesSearch && matchesType && matchesCategory
    })
  }, [categoryFilter, search, transactions, typeFilter])

  const availableEditCategories = editing
    ? mergeCategoryNames(
        editing.type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES,
        (customCategories || []).filter(category => category.type === editing.type).map(category => category.name)
      )
    : []

  const visibleTransactions = expanded ? filteredTransactions : filteredTransactions.slice(0, 5)
  const activityTotals = useMemo(
    () => transactions.reduce((totals, transaction) => {
      totals[transaction.type] += Number(transaction.amount)
      return totals
    }, { income: 0, expense: 0 }),
    [transactions]
  )

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
    return (
      <div className="history-empty">
        <span>Sin actividad</span>
        <strong>No hay movimientos este mes</strong>
        <p>Añade un ingreso o un gasto para empezar a construir tu historial.</p>
      </div>
    )
  }

  return (
    <div className="compact-history">
      <div className="compact-history-heading">
        <div>
          <span className="section-kicker">Movimientos</span>
          <h3>Actividad reciente</h3>
          <p>{transactions.length} {transactions.length === 1 ? 'movimiento registrado' : 'movimientos registrados'} este mes</p>
        </div>
        <div className="activity-summary">
          <span><i className="income" />Ingresos <strong>{formatMoney(activityTotals.income)}</strong></span>
          <span><i className="expense" />Gastos <strong>{formatMoney(activityTotals.expense)}</strong></span>
        </div>
      </div>

      {expanded && (
        <div className="activity-filter-panel">
          <div className="transaction-filters">
            <input className="input-minimal" type="search" placeholder="Buscar por descripción..." value={search} onChange={event => setSearch(event.target.value)} />
            <select className="input-minimal" value={typeFilter} onChange={event => setTypeFilter(event.target.value)} aria-label="Filtrar por tipo">
              <option value="all">Todos los tipos</option>
              <option value="expense">Solo gastos</option>
              <option value="income">Solo ingresos</option>
            </select>
            <select className="input-minimal" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoría">
              <option value="all">Todas las categorías</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <small>{filteredTransactions.length} resultados</small>
        </div>
      )}

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

      <div className="compact-history-list">
        {visibleTransactions.map(transaction => (
          <article className="compact-transaction" key={transaction.id}>
            <span className={`transaction-symbol ${transaction.type}`} aria-hidden="true">
              {transaction.type === 'income' ? '↙' : '↗'}
            </span>
            <div className="transaction-copy">
              <strong>{transaction.description}</strong>
              <div>
                <span>{transaction.category || 'Varios'}</span>
                <small>{formatTransactionDate(transaction.date)}</small>
              </div>
            </div>
            <div className="transaction-side">
              <span className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
              </span>
              <div className="transaction-actions">
                <button
                  onClick={() => setEditing({
                    ...transaction,
                    category: getPreferredCategoryName(
                      transaction.category,
                      transaction.type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES
                    )
                  })}
                  className="icon-button"
                  title="Editar"
                  aria-label={`Editar ${transaction.description}`}
                >
                  <ActionIcon type="edit" />
                </button>
                <button onClick={() => handleDuplicate(transaction)} className="icon-button" title="Duplicar" aria-label={`Duplicar ${transaction.description}`}><ActionIcon type="duplicate" /></button>
                <button onClick={() => handleDelete(transaction.id)} className="icon-button delete" title="Borrar" aria-label={`Borrar ${transaction.description}`}><ActionIcon type="delete" /></button>
              </div>
            </div>
          </article>
        ))}

        {filteredTransactions.length === 0 && (
          <p className="empty-state">Ningún movimiento coincide con los filtros.</p>
        )}
      </div>

      {transactions.length > 5 && (
        <button className="activity-expand-button" onClick={() => setExpanded(value => !value)}>
          {expanded ? 'Mostrar menos movimientos' : `Ver todos los movimientos (${transactions.length})`}
          <span aria-hidden="true">{expanded ? '↑' : '↓'}</span>
        </button>
      )}

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditing(null)}>
          <form className="modal-card" onSubmit={handleSave} onMouseDown={event => event.stopPropagation()}>
            <h3>Editar movimiento</h3>
            <label>Descripción
              <input className="input-minimal" maxLength={MAX_DESCRIPTION_LENGTH} required value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} />
            </label>
            <div className="edit-grid">
              <label>Importe
                <input className="input-minimal" type="number" min="0.01" max={MAX_FINANCIAL_AMOUNT} step="0.01" required value={editing.amount} onChange={event => setEditing({ ...editing, amount: event.target.value })} />
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
