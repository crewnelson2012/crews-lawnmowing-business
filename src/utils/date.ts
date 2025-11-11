import { format, isSaturday as dfIsSaturday, parseISO, formatISO, isSameDay } from 'date-fns'

export const isSaturday = (d: Date | string) => {
  const date = typeof d === 'string' ? parseISO(d) : d
  return dfIsSaturday(date)
}

export const toISODate = (d: Date) => formatISO(d, { representation: 'date' })

export const formatDate = (d: Date | string, f = 'MMM d, yyyy') => {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, f)
}

export const sameDay = (a: string, b: string) => {
  const ap = parseISO(a)
  const bp = parseISO(b)
  return isSameDay(ap, bp)
}
