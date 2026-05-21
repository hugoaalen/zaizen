import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ExpenseForm from './ExpenseForm'
import ExpenseChart from './ExpenseChart'
import TransactionList from './TransactionList'
import RecurringManager from './RecurringManager'
import YearlyView from './YearlyView'
import CategorySettings from './CategorySettings'
import MonthlySummary from './MonthlySummary'
import SettingsPanel from './SettingsPanel'

export default function Dashboard({ session, theme, setTheme }) {
  const [view, setView] = useState('monthly')
  const [transactions, setTransactions] = useState([])
  const [customCategories, setCustomCategories] = useState([])

  const [chartTypeMonthly, setChartTypeMonthly] = useState(() => localStorage.getItem('chartTypeMonthly') || 'circular')
  const [chartTypeYearly, setChartTypeYearly] = useState(() => localStorage.getItem('chartTypeYearly') || 'barras')
  const [chartPalette, setChartPalette] = useState(() => localStorage.getItem('chartPalette') || 'normal')

  const [showSettings, setShowSettings] = useState(false)

  const persistMonthlyType = (v) => { setChartTypeMonthly(v); localStorage.setItem('chartTypeMonthly', v) }
  const persistYearlyType = (v) => { setChartTypeYearly(v); localStorage.setItem('chartTypeYearly', v) }
  const persistPalette = (v) => { setChartPalette(v); localStorage.setItem('chartPalette', v) }

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

  const fetchCustomCategories = async () => {
    const { data } = await supabase.from('custom_categories').select('*').eq('user_id', session.user.id).order('name')
    if (data) setCustomCategories(data)
  }

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

  useEffect(() => { fetchCustomCategories() }, [])
  useEffect(() => {
    if (view === 'monthly') fetchTransactions()
  }, [selectedMonth, selectedYear, view])

  const handleLogout = async () => await supabase.auth.signOut()
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const applyRecurring = async () => {
    const { data: subs } = await supabase
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
          <button onClick={() => setShowSettings(true)} className="btn-outline" style={{ fontSize: '20px', padding: '8px 12px', lineHeight: 1 }}>⚙️</button>
          <button onClick={toggleTheme} className="btn-outline">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="btn-outline">Cerrar sesión</button>
        </div>
      </header>

      {/* SETTINGS PANEL (slide-in drawer) */}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)}>
        <CategorySettings
          user={session.user}
          onCategoryChanged={fetchCustomCategories}
        />

        <RecurringManager
          user={session.user}
          customCategories={customCategories}
        />

        <div className="card">
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Estilo de Gráficos</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Gráfico mensual</label>
              <select
                className="input-minimal"
                value={chartTypeMonthly}
                onChange={e => persistMonthlyType(e.target.value)}
                style={{ marginTop: 0 }}
              >
                <option value="circular">Circular (donut)</option>
                <option value="barras">Barras</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Gráfico anual</label>
              <select
                className="input-minimal"
                value={chartTypeYearly}
                onChange={e => persistYearlyType(e.target.value)}
                style={{ marginTop: 0 }}
              >
                <option value="barras">Barras</option>
                <option value="lineas">Líneas</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Paleta de colores</label>
              <select
                className="input-minimal"
                value={chartPalette}
                onChange={e => persistPalette(e.target.value)}
                style={{ marginTop: 0 }}
              >
                <option value="normal">Normal</option>
                <option value="pastel">Pastel</option>
                <option value="vibrante">Vibrante</option>
              </select>
            </div>
          </div>
        </div>
      </SettingsPanel>

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

              <div style={{ 
                display: 'flex', alignItems: 'center',
                background: 'var(--input-bg)', borderRadius: '12px',
                border: '1px solid var(--border-color)',
                flex: '0 1 140px', justifyContent: 'space-between'
              }}>
                <button type="button"
                  onClick={() => setSelectedYear(y => y - 1)}
                  style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)' }}
                >◀</button>
                <span style={{ fontWeight: '700' }}>{selectedYear}</span>
                <button type="button"
                  onClick={() => setSelectedYear(y => y + 1)}
                  style={{ background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--text-main)' }}
                >▶</button>
              </div>
            </div>

            <button onClick={applyRecurring} className="btn-minimal" style={{ backgroundColor: 'var(--color-income)', color: 'white' }}>
              ⚡ Aplicar fijos
            </button>
          </div>

          <MonthlySummary transactions={transactions} />

          <div className="card">
            <ExpenseForm 
              user={session.user} 
              onTransactionAdded={fetchTransactions} 
              customCategories={customCategories} 
            />
            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <ExpenseChart transactions={transactions} chartStyle={{ type: chartTypeMonthly, palette: chartPalette }} />
            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <TransactionList transactions={transactions} onTransactionDeleted={fetchTransactions} />
          </div>
        </>
      ) : (
        <YearlyView session={session} chartType={chartTypeYearly} palette={chartPalette} />
      )}
    </div>
  )
}
