import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { getGoalProgress } from './savingsGoalUtils'

const formatMoney = value => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(value)

const formatDate = value => new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
}).format(new Date(`${value}T00:00:00`))

export default function SavingsGoals({ user }) {
  const [goals, setGoals] = useState([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [contributionAmounts, setContributionAmounts] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*, savings_contributions(*)')
      .eq('user_id', user.id)
      .order('target_date')

    if (error) {
      setErrorMessage('Los objetivos requieren aplicar la migración de Supabase incluida en el proyecto.')
      setGoals([])
    } else {
      setErrorMessage('')
      setGoals(data)
    }
  }

  useEffect(() => {
    let active = true

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*, savings_contributions(*)')
        .eq('user_id', user.id)
        .order('target_date')

      if (!active) return
      if (error) {
        setErrorMessage('Los objetivos requieren aplicar la migración de Supabase incluida en el proyecto.')
        setGoals([])
      } else {
        setErrorMessage('')
        setGoals(data)
      }
    }

    fetchGoals()
    return () => { active = false }
  }, [user.id])

  const createGoal = async event => {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')
    const formData = new FormData(event.currentTarget)

    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: String(formData.get('goalName') || '').trim(),
      target_amount: Number(formData.get('targetAmount')),
      target_date: String(formData.get('targetDate') || '')
    })

    if (error) setErrorMessage(`No se pudo crear el objetivo: ${error.message}`)
    else {
      setName('')
      setTargetAmount('')
      setTargetDate('')
      await loadGoals()
    }
    setLoading(false)
  }

  const addContribution = async goalId => {
    const amount = Number(contributionAmounts[goalId])
    if (!amount) return

    setLoading(true)
    setErrorMessage('')
    const { error } = await supabase.from('savings_contributions').insert({
      goal_id: goalId,
      user_id: user.id,
      amount
    })

    if (error) setErrorMessage(`No se pudo registrar la aportación: ${error.message}`)
    else {
      setContributionAmounts(current => ({ ...current, [goalId]: '' }))
      await loadGoals()
    }
    setLoading(false)
  }

  const deleteGoal = async goalId => {
    if (!window.confirm('¿Eliminar este objetivo y todas sus aportaciones?')) return

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo eliminar el objetivo.')
    else loadGoals()
  }

  return (
    <div className="savings-goals">
      <form className="savings-goal-form" onSubmit={createGoal}>
        <label>
          Objetivo
          <input
            className="input-minimal"
            name="goalName"
            placeholder="Ej: Viaje a Japón"
            value={name}
            onChange={event => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Meta
          <input
            className="input-minimal"
            name="targetAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="3000 €"
            value={targetAmount}
            onChange={event => setTargetAmount(event.target.value)}
            required
          />
        </label>
        <label>
          Fecha límite
          <input
            className="input-minimal"
            name="targetDate"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={targetDate}
            onChange={event => setTargetDate(event.target.value)}
            required
          />
        </label>
        <button className="btn-minimal" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear objetivo'}
        </button>
      </form>

      {errorMessage && <p className="form-error savings-goal-error" role="alert">{errorMessage}</p>}

      <div className="savings-goal-list">
        {!errorMessage && goals.length === 0 && (
          <div className="savings-goal-empty">
            <strong>Convierte tu ahorro en un plan</strong>
            <p>Crea una meta y registra aportaciones para seguir su progreso.</p>
          </div>
        )}

        {goals.map(goal => {
          const progress = getGoalProgress(goal)
          const status = progress.completed ? 'completed' : progress.overdue ? 'overdue' : 'active'

          return (
            <article className={`savings-goal-card ${status}`} key={goal.id}>
              <header>
                <div>
                  <span>{progress.completed ? 'Completado' : progress.overdue ? 'Fuera de plazo' : `Hasta ${formatDate(goal.target_date)}`}</span>
                  <h3>{goal.name}</h3>
                </div>
                <button className="icon-button" type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Eliminar objetivo ${goal.name}`}>×</button>
              </header>

              <div className="savings-goal-amounts">
                <strong>{formatMoney(progress.saved)}</strong>
                <span>de {formatMoney(progress.target)}</span>
              </div>
              <div className="savings-goal-track" aria-label={`${progress.percentage}% completado`}>
                <div style={{ width: `${progress.percentage}%` }} />
              </div>

              <div className="savings-goal-insights">
                <p><span>Progreso</span><strong>{progress.percentage}%</strong></p>
                <p><span>Falta</span><strong>{formatMoney(progress.remaining)}</strong></p>
                <p>
                  <span>Ritmo recomendado</span>
                  <strong>{progress.completed ? 'Meta alcanzada' : `${formatMoney(progress.monthlyRecommended)}/mes`}</strong>
                </p>
              </div>

              {!progress.completed && (
                <div className="savings-contribution-form">
                  <input
                    className="input-minimal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Nueva aportación €"
                    value={contributionAmounts[goal.id] || ''}
                    onChange={event => setContributionAmounts(current => ({
                      ...current,
                      [goal.id]: event.target.value
                    }))}
                  />
                  <button type="button" className="btn-outline" disabled={loading} onClick={() => addContribution(goal.id)}>
                    Añadir
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
