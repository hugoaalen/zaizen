import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function CategorySettings({ user }) {
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
    
    await supabase.from('custom_categories').insert([
      { user_id: user.id, name: newCat, type: type }
    ])
    
    setNewCat('')
    fetchCategories()
  }

  const deleteCategory = async (id) => {
    await supabase.from('custom_categories').delete().eq('id', id)
    fetchCategories()
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
        {categories.map(c => (
          <div key={c.id} style={{ 
            background: 'var(--input-bg)', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <span>{c.type === 'income' ? '💰' : '💸'} {c.name}</span>
            <button 
              onClick={() => deleteCategory(c.id)} 
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}