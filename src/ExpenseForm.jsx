import { useState } from 'react'
import { supabase } from './supabaseClient'
import { CATEGORY_MAP, BASE_EXPENSE_CATEGORIES, BASE_INCOME_CATEGORIES } from './constants'
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import es from 'date-fns/locale/es'

registerLocale('es', es)

export default function ExpenseForm({ user, onTransactionAdded, customCategories }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  const [startDate, setStartDate] = useState(new Date()) 
  const [category, setCategory] = useState('Varios')
  const [loading, setLoading] = useState(false)
  
  const getAvailableCategories = () => {
    // 1. Filtramos las personalizadas del usuario por tipo (gasto/ingreso)
    // Añadimos (customCategories || []) como red de seguridad
    const userCats = (customCategories || [])
      .filter(c => c.type === type)
      .map(c => c.name)

    // 2. Mezclamos nuestras constantes con las del usuario (evitando duplicados con Set)
    return type === 'expense' 
      ? [...new Set([...BASE_EXPENSE_CATEGORIES, ...userCats])] 
      : [...new Set([...BASE_INCOME_CATEGORIES, ...userCats])]
  }

  const handleDescriptionChange = (e) => {
    const val = e.target.value
    setDescription(val)

    if (type === 'expense') {
      const valLower = val.toLowerCase()
      for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(keyword => valLower.includes(keyword))) {
          setCategory(cat.charAt(0).toUpperCase() + cat.slice(1))
          break
        }
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        amount: parseFloat(amount),
        description: description,
        type: type,
        category: category,
        date: startDate.toISOString().split('T')[0]
      }])

    if (!error) {
      setAmount(''); setDescription(''); setCategory('Varios')
      if (onTransactionAdded) onTransactionAdded()
    }
    setLoading(false)
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>Añadir nuevo movimiento</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ flex: '1 1 120px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Tipo
            <select 
              className="input-minimal" 
              value={type} 
              onChange={(e) => {
                setType(e.target.value)
                setCategory('Varios') // Resetear categoría al cambiar tipo
              }}
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </label>

          <label style={{ flex: '1 1 120px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Importe (€)
            <input className="input-minimal" type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </label>

          <div style={{ flex: '1 1 150px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Fecha
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="input-minimal"
              wrapperClassName="datepicker-full-width"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ flex: '2 1 200px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Descripción
            <input 
              className="input-minimal" 
              type="text" 
              required 
              value={description} 
              onChange={handleDescriptionChange} 
              placeholder="Ej: Cena con amigos" 
            />
          </label>

          <label style={{ flex: '1 1 150px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Categoría
            <select className="input-minimal" value={category} onChange={(e) => setCategory(e.target.value)}>
              {getAvailableCategories().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn-minimal">
          {loading ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </form>
    </div>
  )
}