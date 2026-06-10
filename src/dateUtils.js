import { format, parseISO } from 'date-fns'

export const toDatabaseDate = (date) => format(date, 'yyyy-MM-dd')

export const getMonthIndex = (date) => parseISO(date).getMonth()

export const formatTransactionDate = (date) =>
  format(parseISO(date), 'dd MMM')
