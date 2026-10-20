import { PAYMENT_METHODS } from './paymentMethods'

export default function PaymentMethodField({ value, onChange, type = 'expense' }) {
  return <label>Método de {type === 'income' ? 'cobro' : 'pago'} (opcional)
    <select className="input-minimal" value={value || ''} onChange={event => onChange(event.target.value)}>
      <option value="">Sin especificar</option>
      {PAYMENT_METHODS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  </label>
}
