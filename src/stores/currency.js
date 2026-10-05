import { defineStore } from 'pinia'

/**
 * Global display-currency store (UX prototype).
 *
 * All amounts in the app stay stored in the BASE currency (USD). This store
 * only changes how they are DISPLAYED — no business data is mutated.
 *
 * Rates are mock values. When a backend/FX API exists later, only
 * `rates` needs to be hydrated from the server; nothing else changes.
 */

const STORAGE_KEY = 'novapos-currency'

export const BASE_CURRENCY = 'USD'

/** Add new currencies here — the whole UI picks them up automatically. */
export const CURRENCIES = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    position: 'before', // $2.50
    decimals: 2,
    rate: 1, // base
    locale: 'en-US'
  },
  {
    code: 'KHR',
    name: 'Cambodian Riel',
    symbol: '៛',
    flag: '🇰🇭',
    position: 'after', // 10,000 ៛
    decimals: 0,
    rate: 4100, // mock: 1 USD = 4,100 KHR
    locale: 'km-KH'
  }
]

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    code: localStorage.getItem(STORAGE_KEY) || BASE_CURRENCY,
    list: CURRENCIES.map((c) => ({ ...c }))
  }),

  getters: {
    active: (state) => state.list.find((c) => c.code === state.code) || state.list[0],
    base: (state) => state.list.find((c) => c.code === BASE_CURRENCY) || state.list[0],
    symbol() {
      return this.active.symbol
    },
    isBase: (state) => state.code === BASE_CURRENCY,

    /** Convert a base-currency amount into the active display currency. */
    convert() {
      return (amount) => Number(amount || 0) * this.active.rate
    },

    /**
     * Format a base-currency amount for display.
     * format(2.5) → "$2.50"  |  "10,000 ៛"
     */
    format() {
      return (amount, options = {}) => {
        const currency = this.active
        const value = this.convert(amount)
        const decimals = options.decimals ?? currency.decimals

        const formatted = Math.abs(value).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })

        const sign = value < 0 ? '-' : ''
        const body =
          currency.position === 'before'
            ? `${currency.symbol}${formatted}`
            : `${formatted} ${currency.symbol}`

        return `${sign}${body}`
      }
    },

    /** Compact format for chart axes and tight spaces: $1.2k / 4.9m ៛ */
    formatCompact() {
      return (amount) => {
        const currency = this.active
        const value = this.convert(amount)
        const abs = Math.abs(value)
        let text

        if (abs >= 1_000_000) text = `${(value / 1_000_000).toFixed(1)}m`
        else if (abs >= 1_000) text = `${(value / 1_000).toFixed(1)}k`
        else text = value.toFixed(currency.decimals)

        return currency.position === 'before'
          ? `${currency.symbol}${text}`
          : `${text} ${currency.symbol}`
      }
    },

    /** Human-readable mock rate line shown in the dropdown footer. */
    rateLabel() {
      if (this.isBase) return 'Base currency'
      const target = this.active
      return `1 ${BASE_CURRENCY} ≈ ${target.rate.toLocaleString('en-US')} ${target.code}`
    }
  },

  actions: {
    setCurrency(code) {
      if (!this.list.some((c) => c.code === code)) return false
      this.code = code
      localStorage.setItem(STORAGE_KEY, code)
      return true
    },

    /** Reserved for a future FX endpoint — keeps components untouched. */
    hydrateRates(rates = {}) {
      this.list = this.list.map((c) => ({ ...c, rate: rates[c.code] ?? c.rate }))
    }
  }
})
