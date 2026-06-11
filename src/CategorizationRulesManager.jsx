import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function CategorizationRulesManager({ user, refreshKey = 0 }) {
  const [rules, setRules] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const loadRules = async () => {
    const { data, error } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('pattern')

    if (error) setErrorMessage('No se pudieron cargar las reglas aprendidas.')
    else {
      setErrorMessage('')
      setRules(data)
    }
  }

  useEffect(() => {
    let active = true

    const fetchRules = async () => {
      const { data, error } = await supabase
        .from('categorization_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('pattern')

      if (!active) return
      if (error) setErrorMessage('No se pudieron cargar las reglas aprendidas.')
      else {
        setErrorMessage('')
        setRules(data)
      }
    }

    fetchRules()
    return () => { active = false }
  }, [refreshKey, user.id])

  const deleteRule = async (id) => {
    const { error } = await supabase
      .from('categorization_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) setErrorMessage('No se pudo eliminar la regla.')
    else loadRules()
  }

  return (
    <section className="settings-section learned-rules">
      <div className="settings-section-heading">
        <div>
          <h3>Reglas aprendidas</h3>
          <p>Se aplican antes que la categorización general.</p>
        </div>
        <span className="settings-count">{rules.length}</span>
      </div>

      <div className="learned-rules-list">
        {rules.length === 0 && (
          <p className="settings-empty">
            Corrige una categoría durante una importación para crear tu primera regla.
          </p>
        )}
        {rules.map(rule => (
          <div className="learned-rule-row" key={rule.id}>
            <span className={`category-type-dot ${rule.transaction_type}`} />
            <div>
              <strong>{rule.pattern}</strong>
              <small>Se categoriza como {rule.category}</small>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => deleteRule(rule.id)}
              aria-label={`Eliminar regla ${rule.pattern}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {errorMessage && <p className="form-error import-status" role="alert">{errorMessage}</p>}
    </section>
  )
}
