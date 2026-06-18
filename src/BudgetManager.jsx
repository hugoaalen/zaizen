import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { BASE_EXPENSE_CATEGORIES } from './constants'
import { mergeCategoryNames, normalizeCategoryKey } from './categoryUtils'
import { MAX_FINANCIAL_AMOUNT } from './securityUtils'

export default function BudgetManager({
  user,
  transactions,
  customCategories,
  selectedMonth,
  selectedYear
}) {
  const [budgets, setBudgets] = useState([])
  const [category, setCategory] = useState('Comida')
  const [amount, setAmount] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const expenseCategories = useMemo(
    () => mergeCategoryNames(
      BASE_EXPENSE_CATEGORIES,
      (customCategories || []).filter(c => c.type === 'expense').map(c => c.name)
    ),
    [customCategories]
  )

  const spentByCategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((totals, transaction) => {
        const transactionCategory = normalizeCategoryKey(transaction.category || 'Varios')
        totals[transactionCategory] = (totals[transactionCategory] || 0) + Number(transaction.amount)
        return totals
      }, {})
  }, [transactions])

  const loadBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .order('category')

    if (error) {
      setErrorMessage('Presupuestos requieren aplicar la migración de Supabase incluida en el proyecto.')
      setBudgets([])
    } else {
      setErrorMessage('')
      setBudgets(data)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('category')
      if (!active) return
      if (error) {
        setErrorMessage('Presupuestos requieren aplicar la migración de Supabase incluida en el proyecto.')
        setBudgets([])
      } else {
        setErrorMessage('')
        setBudgets(data)
      }
    }
    load()
    return () => { active = false }
  }, [selectedMonth, selectedYear, user.id])

  const saveBudget = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('budgets')
      .upsert({
        user_id: user.id,
        category,
        amount: Number(amount),
        month: selectedMonth,
        year: selectedYear
      }, { onConflict: 'user_id,category,year,month' })

    if (error) setErrorMessage('No se pudo guardar el presupuesto.')
    else {
      setAmount('')
      await loadBudgets()
    }
    setLoading(false)
  }

  const deleteBudget = async (id) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo eliminar el presupuesto.')
    else loadBudgets()
  }

  return (
    <section className="card budget-card">
      <div className="section-heading">
        <div>
          <h3>Presupuestos del mes</h3>
          <p>Define límites y controla cuánto queda disponible.</p>
        </div>
      </div>

      <form className="budget-form" onSubmit={saveBudget}>
        <select className="input-minimal" value={category} onChange={e => setCategory(e.target.value)}>
          {expenseCategories.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <input
          className="input-minimal"
          type="number"
          min="0.01"
          max={MAX_FINANCIAL_AMOUNT}
          step="0.01"
          placeholder="Límite €"
          required
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button className="btn-minimal" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar límite'}
        </button>
      </form>

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

      <div className="budget-list">
        {budgets.map(budget => {
          const spent = spentByCategory[normalizeCategoryKey(budget.category)] || 0
          const limit = Number(budget.amount)
          const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0
          const barPercentage = Math.min(percentage, 100)
          const status = percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'ok'

          return (
            <article className="budget-item" key={budget.id}>
              <div className="budget-item-heading">
                <strong>{budget.category}</strong>
                <span>{spent.toFixed(2)} € / {limit.toFixed(2)} €</span>
                <button className="icon-button" onClick={() => deleteBudget(budget.id)} aria-label={`Eliminar presupuesto de ${budget.category}`}>×</button>
              </div>
              <div className="budget-track" aria-label={`${percentage}% consumido`}>
                <div className={`budget-progress ${status}`} style={{ width: `${barPercentage}%` }} />
              </div>
              <small>
                {spent > limit
                  ? `Superado por ${(spent - limit).toFixed(2)} €`
                  : `Quedan ${(limit - spent).toFixed(2)} €`}
              </small>
            </article>
          )
        })}
        {!errorMessage && budgets.length === 0 && (
          <p className="empty-state">Aún no hay límites para este mes.</p>
        )}
      </div>
    </section>
  )
}
