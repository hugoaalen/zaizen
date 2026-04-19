import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function CategorySettings({ user, onCategoryChanged }) {
  const [newCat, setNewCat] = useState('')
  const [type, setType] = useState('expense')
  const [categories, setCategories] = useState([])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('custom_categories')
      .select('*')
      .order('name')
    if (data) setCategories(data)
  }

  useEffect(() => { fetchCategories() }, [])

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCat) return
    
    const { error } = await supabase.from('custom_categories').insert([
      { user_id: user.id, name: newCat, type: type }
    ])
    
    if (error) {
      console.error("Error detallado:", error)
      alert("Error al guardar: " + error.message)
    } else {
      setNewCat('')
      fetchCategories()
      // NUEVO: Avisamos al Dashboard de que hay categorías nuevas
      if (onCategoryChanged) onCategoryChanged() 
    }
  }

  const deleteCategory = async (id) => {
    await supabase.from('custom_categories').delete().eq('id', id)
    fetchCategories()
    // NUEVO: Avisamos al Dashboard de que hemos borrado una
    if (onCategoryChanged) onCategoryChanged() 
  }

  return (
    <div className="card" style={{ marginTop: '20px', borderStyle: 'dashed', borderColor: 'var(--border-color)' }}>
      <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Mis Categorías</h4>
      
      <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          className="input-minimal" 
          placeholder="Ej: Gimnasio o Nómina" 
          value={newCat} 
          onChange={e => setNewCat(e.target.value)} 
          style={{ flex: 1 }}
        />
        <select 
          className="input-minimal" 
          value={type} 
          onChange={e => setType(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
        <button type="submit" className="btn-minimal" style={{ width: '45px' }}>+</button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {categories.length === 0 && <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>No tienes categorías personalizadas.</p>}
        {categories.map(c => {
          const isIncome = c.type === 'income'
          
          return (
            <div key={c.id} style={{ 
              background: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
              color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
              padding: '6px 12px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: '500',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: isIncome ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <span>{isIncome ? '💰' : '💸'} {c.name}</span>
              <button 
                onClick={() => deleteCategory(c.id)} 
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  padding: 0, 
                  fontSize: '14px',
                  color: isIncome ? 'var(--color-income)' : 'var(--color-expense)'
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}