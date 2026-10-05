import { defineStore } from 'pinia'
import { useCurrencyStore } from './currency'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    store: 'NovaPOS Retail',
    logo: '',
    phone: '+855 92 884 112',
    email: 'hello@novapos.io',
    address: 'No. 212, St. 271, Phnom Penh, Cambodia',
    taxRate: 8.5,
    receiptFooter: 'Thank you for shopping with us!',
    language: 'English',
    lowStockDefault: 10,
    paymentMethods: { Cash: true, KHQR: true, Card: true, 'Bank Transfer': true }
  }),

  getters: {
    /**
     * Display symbol of the active currency.
     * Kept as `settings.currency` so every existing component keeps working.
     */
    currency: () => useCurrencyStore().active.symbol,

    /**
     * Single money formatter used across the whole app.
     * Delegates to the global currency store, so switching currency instantly
     * reformats Dashboard, POS, Products, Orders, Reports, receipts, etc.
     */
    money: () => (value) => useCurrencyStore().format(value),

    /** Compact variant for chart axes / tight spaces. */
    moneyCompact: () => (value) => useCurrencyStore().formatCompact(value),

    enabledPaymentMethods: (state) =>
      Object.keys(state.paymentMethods).filter((k) => state.paymentMethods[k])
  },

  actions: {
    update(payload) {
      Object.assign(this, payload)
    },
    togglePaymentMethod(name) {
      this.paymentMethods[name] = !this.paymentMethods[name]
    }
  }
})
