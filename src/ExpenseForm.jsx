import { useState } from 'react'
import { supabase } from './supabaseClient'
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import es from 'date-fns/locale/es'

registerLocale('es', es) // Para que los días y meses salgan en español

export default function ExpenseForm({ user, onTransactionAdded }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('expense')
  const [startDate, setStartDate] = useState(new Date()) // Ahora es un objeto Date
  const [loading, setLoading] = useState(false)

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
        date: startDate.toISOString().split('T')[0] // Formateamos a YYYY-MM-DD
      }])

    if (!error) {
      setAmount(''); setDescription('')
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
            <select className="input-minimal" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </label>

          <label style={{ flex: '1 1 120px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Importe (€)
            <input className="input-minimal" type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </label>

          {/* EL NUEVO SELECTOR BONITO */}
          <div style={{ flex: '1 1 150px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Fecha
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="input-minimal" // Reutilizamos nuestra clase
              wrapperClassName="datepicker-full-width"
            />
          </div>
        </div>

        <label style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Descripción
          <input className="input-minimal" type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cena con amigos" />
        </label>

        <button type="submit" disabled={loading} className="btn-minimal">
          {loading ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </form>
    </div>
  )
}