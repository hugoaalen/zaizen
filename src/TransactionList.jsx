import { supabase } from './supabaseClient'

export default function TransactionList({ transactions, onTransactionDeleted }) {
  
  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres borrar este movimiento?')) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) alert('Error al borrar')
      else onTransactionDeleted() // Refresca la lista en el Dashboard
    }
  }

  if (transactions.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
        No hay movimientos este mes.
      </p>
    )
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Historial de este mes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transactions.map((t) => (
          <div 
            key={t.id} 
            className="card" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderLeft: `4px solid ${t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'}` 
            }}
          >
            <div>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>{t.description}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ 
                fontWeight: '700', 
                color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' 
              }}>
                {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)} €
              </span>
              
              <button 
                onClick={() => handleDelete(t.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '18px',
                  opacity: 0.3
                }}
                title="Borrar"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}