export const PAYMENT_METHODS = [
  ['cash', 'Efectivo'], ['card', 'Tarjeta'], ['bizum', 'Bizum'],
  ['transfer', 'Transferencia'], ['direct_debit', 'Domiciliación'], ['other', 'Otro']
]

export const paymentMethodLabel = value => PAYMENT_METHODS.find(([key]) => key === value)?.[1] || ''
