import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function CategorySettings({ user, onCategoryChanged }) {
  const [newCat, setNewCat] = useState('')
  const [type, setType] = useState('expense')
  const [categories, setCategories] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (error) setErrorMessage('No se pudieron cargar las categorías.')
    else setCategories(data)
  }

  useEffect(() => {
    let active = true
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      if (!active) return
      if (error) setErrorMessage('No se pudieron cargar las categorías.')
      else setCategories(data)
    }
    loadCategories()
    return () => { active = false }
  }, [user.id])

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCat) return
    setErrorMessage('')
    
    const { error } = await supabase.from('custom_categories').insert([
      { user_id: user.id, name: newCat, type: type }
    ])
    
    if (error) {
      console.error("Error detallado:", error)
      setErrorMessage(`No se pudo guardar: ${error.message}`)
    } else {
      setNewCat('')
      fetchCategories()
      // NUEVO: Avisamos al Dashboard de que hay categorías nuevas
      if (onCategoryChanged) onCategoryChanged() 
    }
  }

  const deleteCategory = async (id) => {
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      setErrorMessage('No se pudo eliminar la categoría.')
      return
    }
    fetchCategories()
    // NUEVO: Avisamos al Dashboard de que hemos borrado una
    if (onCategoryChanged) onCategoryChanged() 
  }

  return (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <h3>Categorías personalizadas</h3>
          <p>Adapta ingresos y gastos a tu forma de organizarte.</p>
        </div>
        <span className="settings-count">{categories.length}</span>
      </div>

      <form onSubmit={addCategory} className="settings-form category-form">
        <label>
          Nombre
          <input
            className="input-minimal"
            placeholder="Ej: Gimnasio"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            required
          />
        </label>
        <label>
          Tipo
          <select className="input-minimal" value={type} onChange={e => setType(e.target.value)}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </label>
        <button type="submit" className="btn-minimal settings-add-button">Añadir</button>
      </form>

      <div className="category-list">
        {categories.length === 0 && <p className="settings-empty">No tienes categorías personalizadas.</p>}
        {categories.map(c => {
          const isIncome = c.type === 'income'
          return (
            <div key={c.id} className="category-row">
              <span className={`category-type-dot ${isIncome ? 'income' : 'expense'}`} />
              <div>
                <strong>{c.name}</strong>
                <small>{isIncome ? 'Ingreso' : 'Gasto'}</small>
              </div>
              <button className="icon-button" onClick={() => deleteCategory(c.id)} aria-label={`Eliminar categoría ${c.name}`}>×</button>
            </div>
          )
        })}
      </div>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </section>
  )
}
