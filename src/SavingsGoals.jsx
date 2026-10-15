import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { getGoalProgress } from './savingsGoalUtils'
import DateField from './DateField'
import InterfaceIcon from './InterfaceIcon'
import { useFeedback } from './FeedbackProvider'
import { describeDataError } from './dataErrorUtils'
import {
  MAX_FINANCIAL_AMOUNT,
  MAX_GOAL_NAME_LENGTH
} from './securityUtils'

const GOALS_WITH_CONTRIBUTIONS = `
  *,
  savings_contributions!savings_contributions_goal_user_fkey(*)
`

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
  const { confirm, notify } = useFeedback()
  const [goals, setGoals] = useState([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [contributionAmounts, setContributionAmounts] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select(GOALS_WITH_CONTRIBUTIONS)
      .eq('user_id', user.id)
      .order('target_date')

    if (error) {
      setErrorMessage(describeDataError(error, 'cargar los objetivos'))
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
        .select(GOALS_WITH_CONTRIBUTIONS)
        .eq('user_id', user.id)
        .order('target_date')

      if (!active) return
      setFetching(false)
      if (error) {
        setErrorMessage(describeDataError(error, 'cargar los objetivos'))
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
    if (loading) return
    setLoading(true)
    setErrorMessage('')
    const formData = new FormData(event.currentTarget)

    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      name: String(formData.get('goalName') || '').trim(),
      target_amount: Number(formData.get('targetAmount')),
      target_date: String(formData.get('targetDate') || '')
    })

    if (error) setErrorMessage('No se pudo crear el objetivo. Revisa los datos.')
    else {
      notify('Objetivo creado.')
      setName('')
      setTargetAmount('')
      setTargetDate('')
      await loadGoals()
    }
    setLoading(false)
  }

  const addContribution = async goalId => {
    if (loading) return
    const amount = Number(contributionAmounts[goalId])
    if (!amount) return

    setLoading(true)
    setErrorMessage('')
    const { error } = await supabase.from('savings_contributions').insert({
      goal_id: goalId,
      user_id: user.id,
      amount
    })

    if (error) setErrorMessage('No se pudo registrar la aportación. Revisa el importe.')
    else {
      notify('Aportación registrada.')
      setContributionAmounts(current => ({ ...current, [goalId]: '' }))
      await loadGoals()
    }
    setLoading(false)
  }

  const deleteGoal = async goalId => {
    const goal = goals.find(item => item.id === goalId)
    if (!await confirm(`¿Eliminar «${goal?.name || 'este objetivo'}» y todas sus aportaciones? Esta acción no se puede deshacer.`)) return

    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo eliminar el objetivo.')
    else { notify('Objetivo eliminado.'); loadGoals() }
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
            maxLength={MAX_GOAL_NAME_LENGTH}
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
            max={MAX_FINANCIAL_AMOUNT}
            step="0.01"
            placeholder="3000 €"
            value={targetAmount}
            onChange={event => setTargetAmount(event.target.value)}
            required
          />
        </label>
        <DateField
          label="Fecha límite"
          name="targetDate"
          min={new Date().toISOString().slice(0, 10)}
          value={targetDate}
          onChange={setTargetDate}
          required
        />
        <button className="btn-minimal" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear objetivo'}
        </button>
      </form>

      {errorMessage && <p className="form-error savings-goal-error" role="alert">{errorMessage}</p>}
      {fetching && <p role="status">Cargando objetivos…</p>}

      <div className="savings-goal-list">
        {!fetching && !errorMessage && goals.length === 0 && (
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
                <button className="icon-button destructive" type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Eliminar objetivo ${goal.name}`}><InterfaceIcon name="delete" /></button>
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
