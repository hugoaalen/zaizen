import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ExpenseForm from './ExpenseForm'
import ExpenseChart from './ExpenseChart'
import TransactionList from './TransactionList'
import RecurringManager from './RecurringManager'
import YearlyView from './YearlyView'
import CategorySettings from './CategorySettings'
import MonthlySummary from './MonthlySummary'

export default function Dashboard({ session, theme, setTheme }) {
  const [view, setView] = useState('monthly')
  const [transactions, setTransactions] = useState([])
  const [showSettings, setShowSettings] = useState(false) 
  
  const hoy = new Date()
  const [selectedMonth, setSelectedMonth] = useState(hoy.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(hoy.getFullYear())

  const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ]

  const fetchTransactions = async () => {
    const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const lastDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDayOfMonth}`

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false })

    if (error) console.error('Error:', error)
    else setTransactions(data)
  }

  useEffect(() => {
    if (view === 'monthly') fetchTransactions()
  }, [selectedMonth, selectedYear, view])

  const handleLogout = async () => await supabase.auth.signOut()
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const applyRecurring = async () => {
    const { data: subs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`month.is.null,month.eq.${selectedMonth}`);

    if (!subs || subs.length === 0) {
      alert("No hay gastos fijos configurados para este mes.");
      return;
    }

    const subsToInsert = subs.filter(sub => {
      const fixedDescription = `[Fijo] ${sub.description}`;
      return !transactions.some(t => t.description === fixedDescription);
    });

    if (subsToInsert.length === 0) {
      alert("Ya has aplicado los movimientos fijos de este mes.");
      return;
    }

    const fechaToInsert = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const finalData = subsToInsert.map(s => ({
      user_id: session.user.id,
      amount: s.amount,
      description: `[Fijo] ${s.description}`,
      type: s.type,
      date: fechaToInsert,
      category: s.category || 'Varios'
    }));

    const { error } = await supabase.from('transactions').insert(finalData);
    
    if (!error) {
      alert(`Se han añadido ${subsToInsert.length} movimientos.`);
      fetchTransactions();
    }
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>
          {session.user.user_metadata?.full_name 
            ? `Panel de ${session.user.user_metadata.full_name}` 
            : `Panel de ${session.user.email.split('@')[0]}`}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleTheme} className="btn-outline">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="btn-outline">Cerrar sesión</button>
        </div>
      </header>

      {/* SELECTOR DE VISTA (TABS) */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--input-bg)', 
        padding: '6px', 
        borderRadius: '14px', 
        marginBottom: '25px', 
        gap: '6px' 
      }}>
        <button 
          onClick={() => setView('monthly')} 
          className="btn-minimal" 
          style={{ 
            flex: 1, 
            background: view === 'monthly' ? 'var(--bg-card)' : 'transparent', 
            color: 'var(--text-main)', 
            boxShadow: view === 'monthly' ? 'var(--shadow-card)' : 'none',
            fontSize: '14px'
          }}
        >
          Vista Mensual
        </button>
        <button 
          onClick={() => setView('yearly')} 
          className="btn-minimal" 
          style={{ 
            flex: 1, 
            background: view === 'yearly' ? 'var(--bg-card)' : 'transparent', 
            color: 'var(--text-main)', 
            boxShadow: view === 'yearly' ? 'var(--shadow-card)' : 'none',
            fontSize: '14px'
          }}
        >
          Vista Anual
        </button>
      </div>

      {view === 'monthly' ? (
        <>
          {/* FILTROS Y ACCIONES RÁPIDAS */}
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Filtrar por:</span>
              
              <select className="input-minimal" style={{ flex: '1 1 120px', marginTop: '0' }} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>

              {/* SELECTOR DE AÑO CON FLECHAS */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--input-bg)', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                flex: '0 1 140px',
                justifyContent: 'space-between'
              }}>
                <button 
                  type="button"
                  onClick={() => setSelectedYear(y => y - 1)} 
                  style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)' }}
                >◀</button>
                <span style={{ fontWeight: '700' }}>{selectedYear}</span>
                <button 
                  type="button"
                  onClick={() => setSelectedYear(y => y + 1)} 
                  style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)' }}
                >▶</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={applyRecurring} className="btn-minimal" style={{ flex: 1, backgroundColor: 'var(--color-income)', color: 'white' }}>
                ⚡ Aplicar fijos
              </button>
              
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className="btn-outline" 
                style={{ 
                  flex: 1, 
                  backgroundColor: showSettings ? 'var(--text-main)' : 'transparent', 
                  // AQUÍ ESTÁ LA MAGIA: Cambiamos bg-main por bg-card
                  color: showSettings ? 'var(--bg-card)' : 'var(--text-main)',
                  fontWeight: '700',
                  transition: 'all 0.3s ease'
                }}
              >
                {showSettings ? '✕ Cerrar Ajustes' : '⚙️ Ajustes y Categorías'}
              </button>
            </div>
          </div>

          {showSettings && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }} className="animate-fade-in">
              <CategorySettings user={session.user} />
              <RecurringManager user={session.user} />
            </div>
          )}

          <MonthlySummary transactions={transactions} />

          <div className="card">
            <ExpenseForm user={session.user} onTransactionAdded={fetchTransactions} />
            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <ExpenseChart transactions={transactions} />
            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <TransactionList transactions={transactions} onTransactionDeleted={fetchTransactions} />
          </div>
        </>
      ) : (
        <YearlyView session={session} />
      )}
    </div>
  )
}