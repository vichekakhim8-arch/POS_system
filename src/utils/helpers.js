/**
 * Generic helpers shared across the application.
 * Keep business logic free of UI concerns.
 */

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 8).toUpperCase()

export const today = () => new Date().toISOString().slice(0, 10)

export const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

export const addDays = (dateStr, n) =>
  new Date(new Date(dateStr).getTime() + n * 86400000).toISOString().slice(0, 10)

export const nowTime = () => new Date().toTimeString().slice(0, 5)

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const formatMoney = (value, currency = '$') =>
  `${currency}${Number(value || 0).toFixed(2)}`

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const shortDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

export const placeholderImage = (seed) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/320/320`

export const downloadFile = (filename, content, type = 'text/plain') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const toCsv = (rows) =>
  rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

/**
 * Chart palette driven by the global theme store (stores/theme.js writes
 * --chart-1 … --chart-8). Using CSS variables keeps charts in sync with the
 * customer's brand colours without any per-chart configuration.
 */
export const CHART_COLORS = [
  'var(--chart-1, #4f46e5)',
  'var(--chart-2, #0ea5e9)',
  'var(--chart-3, #f59e0b)',
  'var(--chart-4, #10b981)',
  'var(--chart-5, #ef4444)',
  'var(--chart-6, #818cf8)',
  'var(--chart-7, #0369a1)',
  'var(--chart-8, #14b8a6)'
]
