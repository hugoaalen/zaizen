import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [recurring, setRecurring] = useState(false)
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

  const loadBudgets = useCallback(async () => {
    const [budgetResult, recurringResult] = await Promise.all([
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('category'),
      supabase
        .from('recurring_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('category')
    ])

    if (budgetResult.error || recurringResult.error) {
      setErrorMessage('Presupuestos requieren aplicar la migración de Supabase incluida en el proyecto.')
      setBudgets([])
    } else {
      setErrorMessage('')
      const currentBudgets = budgetResult.data || []
      const recurring = recurringResult.data || []
      const recurringByCategory = new Map(
        recurring.map(item => [normalizeCategoryKey(item.category), item])
      )
      const currentByCategory = new Map(
        currentBudgets.map(item => [normalizeCategoryKey(item.category), item])
      )
      const mergedBudgets = currentBudgets.map(item => ({
        ...item,
        is_recurring: recurringByCategory.has(normalizeCategoryKey(item.category)),
        recurring_id: recurringByCategory.get(normalizeCategoryKey(item.category))?.id || null
      }))

      recurring.forEach(item => {
        if (!currentByCategory.has(normalizeCategoryKey(item.category))) {
          mergedBudgets.push({
            ...item,
            id: `recurring-${item.id}`,
            recurring_id: item.id,
            is_recurring: true,
            year: selectedYear,
            month: selectedMonth
          })
        }
      })

      mergedBudgets.sort((left, right) => left.category.localeCompare(right.category))
      setBudgets(mergedBudgets)
    }
  }, [selectedMonth, selectedYear, user.id])

  useEffect(() => {
    let active = true
    const load = async () => {
      await loadBudgets()
      if (!active) return
    }
    load()
    return () => { active = false }
  }, [loadBudgets])

  const saveBudget = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const budgetPayload = {
        user_id: user.id,
        category,
        amount: Number(amount),
        month: selectedMonth,
        year: selectedYear
    }

    if (recurring) {
      const { error: recurringError } = await supabase
        .from('recurring_budgets')
        .upsert({ user_id: user.id, category, amount: Number(amount), active: true }, { onConflict: 'user_id,category' })
      if (recurringError) {
        setErrorMessage('No se pudo guardar el límite recurrente.')
        setLoading(false)
        return
      }
    }

    const { error } = await supabase
      .from('budgets')
      .upsert(budgetPayload, { onConflict: 'user_id,category,year,month' })

    if (error) setErrorMessage('No se pudo guardar el presupuesto.')
    else {
      setAmount('')
      setRecurring(false)
      await loadBudgets()
    }
    setLoading(false)
  }

  const deleteBudget = async (id) => {
    const budget = budgets.find(item => item.id === id)
    const confirmationMessage = budget?.recurring_id
      ? `¿Eliminar el límite recurrente de ${budget.category}? Dejará de aparecer en futuros meses.`
      : `¿Eliminar el límite de ${budget?.category || 'esta categoría'} de este mes?`
    if (!window.confirm(confirmationMessage)) return

    const isGeneratedBudget = String(id).startsWith('recurring-')
    const { error } = isGeneratedBudget
      ? { error: null }
      : await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo eliminar el presupuesto.')
    else if (budget?.recurring_id) {
      const { error: recurringError } = await supabase
        .from('recurring_budgets')
        .delete()
        .eq('id', budget.recurring_id)
        .eq('user_id', user.id)
      if (recurringError) setErrorMessage('Se eliminó este mes, pero no el límite recurrente.')
      await loadBudgets()
    } else loadBudgets()
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
        <label className="budget-recurring-toggle">
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
          <span>Repetir este límite cada mes</span>
        </label>
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
                <strong>
                  {budget.category}
                  {budget.is_recurring && <em className="budget-recurring-badge">Recurrente</em>}
                </strong>
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
