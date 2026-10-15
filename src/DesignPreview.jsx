import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design-system.css'
import MonthlySummary from './MonthlySummary'
import ExpenseChart from './ExpenseChart'
import CollapsibleSection from './CollapsibleSection'
import BrandIcon from './BrandIcon'
import InterfaceIcon from './InterfaceIcon'
import ChevronIcon from './ChevronIcon'
import SettingsPanel from './SettingsPanel'
import { FeedbackProvider, useFeedback } from './FeedbackProvider'
import { CategoriesIcon, RecurringIcon, AppearanceIcon } from './SettingsIcons'

// Isolated, development-only visual fixture. No authentication or database requests.
const transactions = [
  { type: 'income', category: 'Nómina', amount: 2400 },
  { type: 'expense', category: 'Casa', amount: 750 },
  { type: 'expense', category: 'Comida', amount: 245 },
  { type: 'expense', category: 'Transporte', amount: 85 },
  { type: 'expense', category: 'Ocio', amount: 120 },
  { type: 'expense', category: 'Suscripciones', amount: 32 }
]

export default function Preview() {
  const { confirm, notify } = useFeedback()
  const [settings, setSettings] = useState(false)
  const [chart, setChart] = useState('ranking')
  const [month, setMonth] = useState(9)
  const [year, setYear] = useState(2026)
  const [dark, setDark] = useState(true)
  const recurring = (
    <section className="settings-section">
      <div className="settings-section-heading"><div><h3>Movimientos recurrentes</h3><p>Datos ficticios para revisar el diseño.</p></div></div>
      <div className="recurring-list">
        {['Alquiler', 'Suscripción de música', 'Curso de fotografía con un nombre especialmente largo'].map((name, index) => (
          <article className="recurring-row" key={name}>
            <span className="category-type-dot expense" />
            <div className="recurring-row-content"><strong>{name}</strong><small>Casa · Mensual · día 1</small><small>Siempre activo</small></div>
            <span className="amount-expense">−{index ? '12,99' : '750,00'} €</span>
            <span className="recurring-status">Mensual</span>
            <div className="recurring-row-actions">
              {['edit', 'pause', 'delete'].map(icon => <button key={icon} className="icon-button" aria-label={`${icon} ${name}`} onClick={async () => { if (icon === 'delete' && await confirm(`¿Eliminar «${name}»? Esta es una prueba con datos ficticios.`)) notify('Confirmación comprobada. No se han eliminado datos.')}}><InterfaceIcon name={icon} /></button>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-brand"><BrandIcon /><div><strong>ZaiZen</strong><small>Vista de diseño · Datos ficticios</small></div></div>
        <div className="dashboard-topbar-actions">
          <button className="topbar-icon" aria-label="Cambiar tema" onClick={() => { setDark(!dark); document.documentElement.dataset.theme = dark ? 'light' : 'dark' }}><InterfaceIcon name="plus" /></button>
          <button className="topbar-icon" onClick={() => setSettings(true)} aria-label="Abrir ajustes"><AppearanceIcon /></button>
        </div>
      </header>
      <div className="dashboard-view-tabs"><button className="active">Mes</button><button>Año</button></div>
      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <div className="period-selector">
            <div className="month-stepper">
              <button aria-label="Mes anterior" onClick={() => setMonth((month + 11) % 12)}><ChevronIcon /></button>
              <select className="input-minimal" aria-label="Mes" value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(2026, i, 1))}</option>)}</select>
              <button aria-label="Mes siguiente" onClick={() => setMonth((month + 1) % 12)}><ChevronIcon direction="right" /></button>
            </div>
            <div className="year-stepper"><button aria-label="Año anterior" onClick={() => setYear(year - 1)}><ChevronIcon /></button><strong>{year}</strong><button aria-label="Año siguiente" onClick={() => setYear(year + 1)}><ChevronIcon direction="right" /></button></div>
            <button className="btn-outline current-month-button" onClick={() => { setMonth(9); setYear(2026) }}>Hoy</button>
          </div>
          <div className="quick-actions">{['expense', 'income', 'recurring'].map((type, i) => <button key={type} className={`quick-action ${type}`}><span><InterfaceIcon name={['minus', 'plus', 'repeat'][i]} /></span>{['Añadir gasto', 'Añadir ingreso', 'Aplicar recurrentes'][i]}</button>)}</div>
        </div>
        <MonthlySummary transactions={transactions} previousTransactions={[]} selectedMonth={month + 1} selectedYear={year} />
        <CollapsibleSection title="Análisis" description="Distribución de ingresos y gastos" storageKey="design-preview-chart">
          <div style={{ padding: '16px 20px 0' }} className="segmented-control">{['circular', 'barras', 'mosaico'].map(type => <button key={type} aria-pressed={chart === type} className={chart === type ? 'active' : ''} onClick={() => setChart(type)}>{type}</button>)}</div>
          <ExpenseChart transactions={transactions} chartStyle={{ type: chart, palette: 'normal' }} onChartTypeChange={setChart} />
        </CollapsibleSection>
      </main>
      <SettingsPanel open={settings} onClose={() => setSettings(false)} sections={[
        { id: 'categories', label: 'Categorías', icon: <CategoriesIcon />, content: recurring },
        { id: 'recurring', label: 'Recurrentes', icon: <RecurringIcon />, content: recurring },
        { id: 'appearance', label: 'Apariencia', icon: <AppearanceIcon />, content: recurring }
      ]} />
    </div>
  )
}

if (import.meta.env.DEV) createRoot(document.getElementById('root')).render(<FeedbackProvider><Preview /></FeedbackProvider>)
