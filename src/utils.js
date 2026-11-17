export const AR_MONTHS = [
  'يناير', 'فبراير', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
]
export const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatNumber(value, maxFrac = 0) {
  const n = Number(value) || 0
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(n)
}

export function currencySymbol(currency, lang) {
  if (currency === 'USD') return '$'
  return lang === 'ar' ? 'ل.س' : 'SYP'
}

export function formatMoney(amount, currency, lang, maxFrac = 0) {
  const num = formatNumber(amount, maxFrac)
  const sym = currencySymbol(currency, lang)
  if (currency === 'USD') return `${sym}${num}`
  return lang === 'ar' ? `${num} ${sym}` : `${num} ${sym}`
}

export function convert(amount, from, to, rate) {
  if (from === to) return Number(amount) || 0
  if (from === 'USD' && to === 'SYP') return (Number(amount) || 0) * rate
  if (from === 'SYP' && to === 'USD') return (Number(amount) || 0) / rate
  return Number(amount) || 0
}

export function formatDate(dateStr, lang, withYear = false) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const month = lang === 'ar' ? AR_MONTHS[(m || 1) - 1] : EN_MONTHS[(m || 1) - 1]
  return withYear ? `${d} ${month} ${y}` : `${d} ${month}`
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function daysBetween(dateStr, fromStr) {
  const a = parseDate(dateStr)
  const b = parseDate(fromStr)
  return Math.round((a - b) / 86400000)
}

export function addMonths(dateStr, count) {
  const d = parseDate(dateStr)
  const targetMonth = d.getMonth() + count
  const year = d.getFullYear()
  const lastDay = new Date(year, targetMonth + 1, 0).getDate()
  const day = Math.min(d.getDate(), lastDay)
  const next = new Date(year, targetMonth, day)
  const mm = String(next.getMonth() + 1).padStart(2, '0')
  const dd = String(next.getDate()).padStart(2, '0')
  return `${next.getFullYear()}-${mm}-${dd}`
}

export function cycleFor(todayStr, salaryDay = 25) {
  const today = parseDate(todayStr)
  let startYear = today.getFullYear()
  let startMonth = today.getMonth()
  if (today.getDate() < salaryDay) startMonth -= 1
  if (startMonth < 0) { startMonth = 11; startYear -= 1 }
  const start = new Date(startYear, startMonth, salaryDay)
  const end = new Date(startYear, startMonth + 1, salaryDay - 1)
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(start), end: fmt(end), label: `${salaryDay}` }
}

export function isInCycle(dateStr, cycle) {
  return dateStr >= cycle.start && dateStr <= cycle.end
}

export function uid(prefix = 'x') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

export function groupByDate(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})
}

export function colorForLabel(label = '') {
  const palette = ['#1f6b57', '#c08a2e', '#b45f45', '#4a7c94', '#7a6a9c', '#5f7a4b', '#a8623c', '#4f6f78']
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % 997
  return palette[hash % palette.length]
}

export function initials(label = '', lang = 'ar') {
  const words = label.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] || '') + (words[1][0] || '')
  return (label[0] || '•')
}

export function sumValues(arr, getter) {
  return arr.reduce((s, x) => s + (getter(x) || 0), 0)
}
