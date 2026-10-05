/** Quick date range presets used by dashboards, reports and filters. */

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

const startOfWeek = (date, offsetWeeks = 0) => {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day + offsetWeeks * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

const startOfMonth = (date, offsetMonths = 0) =>
  new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1)

const endOfMonth = (date, offsetMonths = 0) =>
  new Date(date.getFullYear(), date.getMonth() + offsetMonths + 1, 0)

const startOfQuarter = (date, offsetQuarters = 0) => {
  const q = Math.floor(date.getMonth() / 3) + offsetQuarters
  return new Date(date.getFullYear(), q * 3, 1)
}

const endOfQuarter = (date, offsetQuarters = 0) => {
  const q = Math.floor(date.getMonth() / 3) + offsetQuarters
  return new Date(date.getFullYear(), q * 3 + 3, 0)
}

const minus = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

/** Grouped preset definitions — `divider: true` renders a separator in the dropdown. */
export const rangeGroups = [
  [
    { key: 'today', labelKey: 'date.today' },
    { key: 'yesterday', labelKey: 'date.yesterday' }
  ],
  [
    { key: 'thisWeek', labelKey: 'date.thisWeek' },
    { key: 'lastWeek', labelKey: 'date.lastWeek' },
    { key: 'thisMonth', labelKey: 'date.thisMonth' },
    { key: 'lastMonth', labelKey: 'date.lastMonth' }
  ],
  [
    { key: 'thisQuarter', labelKey: 'date.thisQuarter' },
    { key: 'lastQuarter', labelKey: 'date.lastQuarter' }
  ],
  [
    { key: 'thisYear', labelKey: 'date.thisYear' },
    { key: 'lastYear', labelKey: 'date.lastYear' }
  ],
  [
    { key: 'wtd', labelKey: 'date.wtd' },
    { key: 'mtd', labelKey: 'date.mtd' },
    { key: 'ytd', labelKey: 'date.ytd' }
  ],
  [
    { key: 'last7', labelKey: 'date.last7' },
    { key: 'last14', labelKey: 'date.last14' },
    { key: 'last30', labelKey: 'date.last30' },
    { key: 'last60', labelKey: 'date.last60' },
    { key: 'last90', labelKey: 'date.last90' }
  ],
  [{ key: 'custom', labelKey: 'date.custom' }]
]

export const allRangeKeys = rangeGroups.flat().map((r) => r.key)

/**
 * Resolve a preset key into an ISO date range.
 * @returns {{from: string, to: string}}
 */
export function resolveRange(key, custom = {}) {
  const now = new Date()
  const todayIso = iso(now)

  switch (key) {
    case 'today':
      return { from: todayIso, to: todayIso }
    case 'yesterday':
      return { from: iso(minus(1)), to: iso(minus(1)) }
    case 'thisWeek':
    case 'wtd':
      return { from: iso(startOfWeek(now)), to: todayIso }
    case 'lastWeek': {
      const start = startOfWeek(now, -1)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return { from: iso(start), to: iso(end) }
    }
    case 'thisMonth':
    case 'mtd':
      return { from: iso(startOfMonth(now)), to: todayIso }
    case 'lastMonth':
      return { from: iso(startOfMonth(now, -1)), to: iso(endOfMonth(now, -1)) }
    case 'thisQuarter':
      return { from: iso(startOfQuarter(now)), to: todayIso }
    case 'lastQuarter':
      return { from: iso(startOfQuarter(now, -1)), to: iso(endOfQuarter(now, -1)) }
    case 'thisYear':
    case 'ytd':
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: todayIso }
    case 'lastYear':
      return {
        from: iso(new Date(now.getFullYear() - 1, 0, 1)),
        to: iso(new Date(now.getFullYear() - 1, 11, 31))
      }
    case 'last7':
      return { from: iso(minus(6)), to: todayIso }
    case 'last14':
      return { from: iso(minus(13)), to: todayIso }
    case 'last30':
      return { from: iso(minus(29)), to: todayIso }
    case 'last60':
      return { from: iso(minus(59)), to: todayIso }
    case 'last90':
      return { from: iso(minus(89)), to: todayIso }
    case 'custom':
      return { from: custom.from || iso(minus(29)), to: custom.to || todayIso }
    default:
      return { from: iso(minus(29)), to: todayIso }
  }
}

/** Inclusive list of ISO dates between two bounds (capped for chart safety). */
export function eachDay(from, to, cap = 92) {
  const out = []
  const start = new Date(from)
  const end = new Date(to)
  for (let i = 0; i < cap; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    if (d > end) break
    out.push(iso(d))
  }
  return out
}
