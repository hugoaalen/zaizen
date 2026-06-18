import { lazy, Suspense, useCallback, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import TransactionList from './TransactionList'
import RecurringManager from './RecurringManager'
import CategorySettings from './CategorySettings'
import MonthlySummary from './MonthlySummary'
import SettingsPanel from './SettingsPanel'
import BudgetManager from './BudgetManager'
import TransactionModal from './TransactionModal'
import CollapsibleSection from './CollapsibleSection'
import BankCsvImporter from './BankCsvImporter'
import CategorizationRulesManager from './CategorizationRulesManager'
import SavingsGoals from './SavingsGoals'
import { LogoutIcon, MoonIcon, SettingsIcon, SunIcon } from './TopbarIcons'
import { getRecurringOccurrenceDate } from './recurringUtils'
import PrivacySettings from './PrivacySettings'
import {
  AppearanceIcon,
  CategoriesIcon,
  ImportIcon,
  PrivacyIcon,
  RecurringIcon
} from './SettingsIcons'
import {
  clearOfflineData,
  getMonthlyCachePeriod,
  loadOfflineData,
  saveOfflineData
} from './offlineCache'
import { useOnlineStatus } from './useOnlineStatus'
import BrandIcon from './BrandIcon'

const ExpenseChart = lazy(() => import('./ExpenseChart'))
const YearlyView = lazy(() => import('./YearlyView'))

const getMonthRange = (year, month) => ({
  firstDay: `${year}-${String(month).padStart(2, '0')}-01`,
  lastDay: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
})

const loadMonthlyTransactions = async (userId, year, month) => {
  const currentRange = getMonthRange(year, month)
  const previousDate = new Date(year, month - 2, 1)
  const previousRange = getMonthRange(previousDate.getFullYear(), previousDate.getMonth() + 1)

  return Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', currentRange.firstDay)
      .lte('date', currentRange.lastDay)
      .order('date', { ascending: false }),
    supabase
      .from('transactions')
      .select('amount,type,category,date')
      .eq('user_id', userId)
      .gte('date', previousRange.firstDay)
      .lte('date', previousRange.lastDay)
  ])
}

export default function Dashboard({ session, theme, setTheme }) {
  const online = useOnlineStatus()
  const [view, setView] = useState('monthly')
  const [transactions, setTransactions] = useState([])
  const [previousTransactions, setPreviousTransactions] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [rulesRefreshKey, setRulesRefreshKey] = useState(0)

  const [chartTypeMonthly, setChartTypeMonthly] = useState(() => localStorage.getItem('chartTypeMonthly') || 'circular')
  const [chartTypeYearly, setChartTypeYearly] = useState(() => localStorage.getItem('chartTypeYearly') || 'barras')
  const [chartPalette, setChartPalette] = useState(() => localStorage.getItem('chartPalette') || 'normal')

  const [showSettings, setShowSettings] = useState(false)
  const [newTransactionType, setNewTransactionType] = useState(null)
  const closeSettings = useCallback(() => setShowSettings(false), [])
  const closeTransactionModal = useCallback(() => setNewTransactionType(null), [])

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

  const fetchTransactions = async () => {
    const cachePeriod = getMonthlyCachePeriod(selectedYear, selectedMonth)
    const [currentResult, previousResult] = await loadMonthlyTransactions(
      session.user.id,
      selectedYear,
      selectedMonth
    )

    if (currentResult.error || previousResult.error) {
      const cached = loadOfflineData(session.user.id, 'monthly-transactions', cachePeriod)
      if (cached) {
        setTransactions(cached.data.current)
        setPreviousTransactions(cached.data.previous)
        setErrorMessage('Sin conexión: mostrando la última copia guardada de este mes.')
      } else {
        setErrorMessage('No hay datos guardados para consultar este mes sin conexión.')
      }
    }
    else {
      setErrorMessage('')
      setTransactions(currentResult.data)
      setPreviousTransactions(previousResult.data)
      saveOfflineData(session.user.id, 'monthly-transactions', cachePeriod, {
        current: currentResult.data,
        previous: previousResult.data
      })
    }
  }

  useEffect(() => {
    let active = true
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')
      if (!active) return
      if (error) {
        const cached = loadOfflineData(session.user.id, 'custom-categories', 'all')
        if (cached) setCustomCategories(cached.data)
      } else {
        setCustomCategories(data)
        saveOfflineData(session.user.id, 'custom-categories', 'all', data)
      }
    }
    loadCategories()
    return () => { active = false }
  }, [session.user.id])

  useEffect(() => {
    if (view !== 'monthly') return
    let active = true
    const loadTransactions = async () => {
      const cachePeriod = getMonthlyCachePeriod(selectedYear, selectedMonth)
      const [currentResult, previousResult] = await loadMonthlyTransactions(
        session.user.id,
        selectedYear,
        selectedMonth
      )

      if (!active) return
      if (currentResult.error || previousResult.error) {
        const cached = loadOfflineData(session.user.id, 'monthly-transactions', cachePeriod)
        if (cached) {
          setTransactions(cached.data.current)
          setPreviousTransactions(cached.data.previous)
          setErrorMessage('Sin conexión: mostrando la última copia guardada de este mes.')
        } else {
          setTransactions([])
          setPreviousTransactions([])
          setErrorMessage('No hay datos guardados para consultar este mes sin conexión.')
        }
      }
      else {
        setErrorMessage('')
        setTransactions(currentResult.data)
        setPreviousTransactions(previousResult.data)
        saveOfflineData(session.user.id, 'monthly-transactions', cachePeriod, {
          current: currentResult.data,
          previous: previousResult.data
        })
      }
    }
    loadTransactions()
    return () => { active = false }
  }, [selectedMonth, selectedYear, session.user.id, view])

  const fetchCustomCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name')
    if (error) setErrorMessage('No se pudieron cargar las categorías.')
    else {
      setCustomCategories(data)
      saveOfflineData(session.user.id, 'custom-categories', 'all', data)
    }
  }

  const handleLogout = async () => {
    clearOfflineData(session.user.id)
    const { error } = await supabase.auth.signOut()
    if (error) setErrorMessage('No se pudo cerrar la sesión correctamente.')
  }
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  const goToCurrentMonth = () => {
    const today = new Date()
    setSelectedMonth(today.getMonth() + 1)
    setSelectedYear(today.getFullYear())
  }

  const settingsSections = [
    {
      id: 'categories',
      label: 'Categorías',
      icon: <CategoriesIcon />,
      content: (
        <CategorySettings
          user={session.user}
          onCategoryChanged={fetchCustomCategories}
        />
      )
    },
    {
      id: 'recurring',
      label: 'Recurrentes',
      icon: <RecurringIcon />,
      content: (
        <RecurringManager
          user={session.user}
          customCategories={customCategories}
        />
      )
    },
    {
      id: 'import',
      label: 'Importar',
      icon: <ImportIcon />,
      content: (
        <div className="settings-stack">
          <BankCsvImporter
            user={session.user}
            customCategories={customCategories}
            onImported={fetchTransactions}
            onRulesChanged={() => setRulesRefreshKey(key => key + 1)}
          />
          <CategorizationRulesManager user={session.user} refreshKey={rulesRefreshKey} />
        </div>
      )
    },
    {
      id: 'appearance',
      label: 'Apariencia',
      icon: <AppearanceIcon />,
      content: (
        <section className="settings-section">
          <div className="settings-section-heading">
            <div>
              <h3>Visualización</h3>
              <p>Elige cómo quieres leer tus datos.</p>
            </div>
          </div>

          <div className="appearance-group">
            <span>Gráfico mensual</span>
            <div className="segmented-control">
              <button className={chartTypeMonthly === 'circular' ? 'active' : ''} onClick={() => persistMonthlyType('circular')}>Circular</button>
              <button className={chartTypeMonthly === 'barras' ? 'active' : ''} onClick={() => persistMonthlyType('barras')}>Barras</button>
            </div>
          </div>

          <div className="appearance-group">
            <span>Gráfico anual</span>
            <div className="segmented-control">
              <button className={chartTypeYearly === 'barras' ? 'active' : ''} onClick={() => persistYearlyType('barras')}>Barras</button>
              <button className={chartTypeYearly === 'lineas' ? 'active' : ''} onClick={() => persistYearlyType('lineas')}>Líneas</button>
            </div>
          </div>

          <div className="appearance-group">
            <span>Paleta de colores</span>
            <div className="palette-options">
              {[
                { id: 'normal', label: 'Normal', colors: ['#6366f1', '#10b981', '#ef4444'] },
                { id: 'pastel', label: 'Pastel', colors: ['#ddd6fe', '#86efac', '#fca5a5'] },
                { id: 'vibrante', label: 'Vibrante', colors: ['#7c3aed', '#00c853', '#ff1744'] }
              ].map(option => (
                <button
                  key={option.id}
                  className={chartPalette === option.id ? 'active' : ''}
                  onClick={() => persistPalette(option.id)}
                >
                  <span className="palette-preview">
                    {option.colors.map(color => <i key={color} style={{ background: color }} />)}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )
    },
    {
      id: 'privacy',
      label: 'Privacidad',
      icon: <PrivacyIcon />,
      content: <PrivacySettings user={session.user} />
    }
  ]

  const applyRecurring = async () => {
    const { data: subs, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id);

    if (subscriptionsError) {
      setErrorMessage('No se pudieron cargar los movimientos recurrentes.')
      return
    }

    const scheduledSubscriptions = (subs || [])
      .map(subscription => ({
        subscription,
        occurrenceDate: getRecurringOccurrenceDate(subscription, selectedYear, selectedMonth)
      }))
      .filter(item => item.occurrenceDate)

    if (scheduledSubscriptions.length === 0) {
      alert("No hay movimientos recurrentes programados para este mes.");
      return;
    }

    const subsToInsert = scheduledSubscriptions.filter(({ subscription, occurrenceDate }) =>
      !transactions.some(t =>
        String(t.recurring_source_id) === String(subscription.id) &&
        t.recurring_period === occurrenceDate
      )
    )

    if (subsToInsert.length === 0) {
      alert("Ya has aplicado los movimientos fijos de este mes.");
      return;
    }

    const finalData = subsToInsert.map(({ subscription, occurrenceDate }) => ({
      user_id: session.user.id,
      amount: subscription.amount,
      description: `[Recurrente] ${subscription.description}`,
      type: subscription.type,
      date: occurrenceDate,
      category: subscription.category || 'Varios',
      recurring_source_id: String(subscription.id),
      recurring_period: occurrenceDate
    }));

    const { error } = await supabase
      .from('transactions')
      .upsert(finalData, {
        onConflict: 'user_id,recurring_source_id,recurring_period',
        ignoreDuplicates: true
      })
    
    if (error) {
      setErrorMessage('No se pudieron aplicar los movimientos fijos.')
    } else {
      alert(`Se han añadido ${subsToInsert.length} movimientos.`);
      fetchTransactions();
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-brand">
          <BrandIcon />
          <div>
            <strong>ZaiZen</strong>
            <small>
              {session.user.user_metadata?.full_name || session.user.email.split('@')[0]}
            </small>
          </div>
        </div>
        <div className="dashboard-topbar-actions">
          <button onClick={toggleTheme} className="topbar-icon" aria-label="Cambiar tema" title="Cambiar tema">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button onClick={() => setShowSettings(true)} className="topbar-icon" aria-label="Abrir ajustes" title="Ajustes">
            <SettingsIcon />
          </button>
          <button onClick={handleLogout} className="topbar-icon dashboard-logout" aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <SettingsPanel open={showSettings} onClose={closeSettings} sections={settingsSections} />
      <TransactionModal
        open={Boolean(newTransactionType)}
        type={newTransactionType || 'expense'}
        user={session.user}
        customCategories={customCategories}
        onClose={closeTransactionModal}
        onTransactionAdded={fetchTransactions}
      />

      <div className="dashboard-view-tabs">
        <button onClick={() => setView('monthly')} className={view === 'monthly' ? 'active' : ''}>Mes</button>
        <button onClick={() => setView('yearly')} className={view === 'yearly' ? 'active' : ''}>Año</button>
      </div>

      {view === 'monthly' ? (
        <main className="dashboard-main">
          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

          <section className="dashboard-toolbar">
            <div className="period-selector">
              <select className="input-minimal" value={selectedMonth} onChange={event => setSelectedMonth(Number(event.target.value))} aria-label="Mes">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="year-stepper">
                <button type="button" onClick={() => setSelectedYear(year => year - 1)} aria-label="Año anterior">‹</button>
                <span style={{ fontWeight: '700' }}>{selectedYear}</span>
                <button type="button" onClick={() => setSelectedYear(year => year + 1)} aria-label="Año siguiente">›</button>
              </div>
              <button className="btn-outline current-month-button" onClick={goToCurrentMonth}>Hoy</button>
            </div>

            <div className="quick-actions">
              <button className="quick-action expense" onClick={() => setNewTransactionType('expense')} disabled={!online} title={!online ? 'Disponible cuando recuperes la conexión' : undefined}>
                <span>−</span> Añadir gasto
              </button>
              <button className="quick-action income" onClick={() => setNewTransactionType('income')} disabled={!online} title={!online ? 'Disponible cuando recuperes la conexión' : undefined}>
                <span>+</span> Añadir ingreso
              </button>
              <button className="quick-action recurring" onClick={applyRecurring} disabled={!online} title={!online ? 'Disponible cuando recuperes la conexión' : undefined}>
                <span>↻</span> Aplicar recurrentes
              </button>
            </div>
          </section>

          <MonthlySummary
            transactions={transactions}
            previousTransactions={previousTransactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />

          <CollapsibleSection
            title="Objetivos de ahorro"
            description="Metas, aportaciones y progreso"
            storageKey="dashboardSavingsGoalsOpen"
          >
            <SavingsGoals user={session.user} />
          </CollapsibleSection>

          <div className="dashboard-content-grid">
            <CollapsibleSection
              title="Presupuestos"
              description="Límites y consumo por categoría"
              storageKey="dashboardBudgetsOpen"
              className="dashboard-grid-budget"
            >
              <BudgetManager
                user={session.user}
                transactions={transactions}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Análisis"
              description="Distribución de ingresos y gastos"
              storageKey="dashboardChartOpen"
              className="dashboard-grid-analysis"
            >
              <Suspense fallback={<p className="loading-state">Cargando gráfico...</p>}>
                <ExpenseChart transactions={transactions} chartStyle={{ type: chartTypeMonthly, palette: chartPalette }} />
              </Suspense>
            </CollapsibleSection>

            <CollapsibleSection
              title="Actividad"
              description="Movimientos recientes del periodo"
              storageKey="dashboardHistoryOpen"
              className="dashboard-grid-activity"
            >
              <TransactionList
                transactions={transactions}
                user={session.user}
                customCategories={customCategories}
                onTransactionDeleted={fetchTransactions}
              />
            </CollapsibleSection>
          </div>
        </main>
      ) : (
        <main className="dashboard-main">
          <Suspense fallback={<p className="loading-state">Cargando vista anual...</p>}>
            <YearlyView user={session.user} chartType={chartTypeYearly} palette={chartPalette} />
          </Suspense>
        </main>
      )}
    </div>
  )
}
