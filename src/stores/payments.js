import { defineStore } from 'pinia'

/**
 * Payment gateway configuration (Bakong / KHQR).
 *
 * SECURITY NOTE
 * ─────────────
 * No credential is ever hard-coded. In production the token must live on the
 * server and be exchanged through your own backend — the frontend should only
 * ever hold a short-lived, scoped value. `maskedToken` is used everywhere in
 * the UI so the raw value is never rendered back to the screen.
 */

const STORAGE_KEY = 'novapos-payments'

const DEFAULTS = {
  bakong: {
    enabled: true,
    environment: 'sandbox', // sandbox | production
    merchantName: 'NovaPOS Retail',
    merchantId: '',
    accountId: '', // e.g. your_name@bank
    bankAccount: '',
    city: 'Phnom Penh',
    apiBaseUrl: 'https://api-bakong.nbc.gov.kh/v1',
    token: '',
    callbackUrl: '',
    autoVerify: true,
    timeoutSeconds: 120
  },
  card: { enabled: true, provider: 'Stripe Terminal', terminalId: '' },
  bankTransfer: { enabled: true, bankName: 'ABA Bank', accountName: '', accountNumber: '' }
}

const clone = (value) => JSON.parse(JSON.stringify(value))

export const usePaymentsStore = defineStore('payments', {
  state: () => {
    let saved = {}
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      saved = {}
    }
    return {
      bakong: { ...DEFAULTS.bakong, ...(saved.bakong || {}) },
      card: { ...DEFAULTS.card, ...(saved.card || {}) },
      bankTransfer: { ...DEFAULTS.bankTransfer, ...(saved.bankTransfer || {}) },
      testing: false,
      lastTest: null // { ok, message, at }
    }
  },

  getters: {
    /** Never expose the raw token in the UI. */
    maskedToken: (state) => {
      const token = state.bakong.token || ''
      if (!token) return ''
      if (token.length <= 12) return '•'.repeat(token.length)
      return `${token.slice(0, 6)}${'•'.repeat(14)}${token.slice(-4)}`
    },

    isProduction: (state) => state.bakong.environment === 'production',

    /** Everything required before KHQR can be used at the counter. */
    bakongReady: (state) =>
      !!(state.bakong.enabled && state.bakong.accountId && state.bakong.merchantName && state.bakong.token),

    missingFields: (state) => {
      const missing = []
      if (!state.bakong.merchantName) missing.push('Merchant name')
      if (!state.bakong.accountId) missing.push('Bakong account ID')
      if (!state.bakong.token) missing.push('API token')
      return missing
    },

    /**
     * EMVCo-style KHQR payload built from the live configuration.
     * Replaced by a server-generated payload once the backend exists.
     */
    buildQrPayload: (state) => (amount, reference) =>
      [
        '00020101021229',
        `29${(state.bakong.accountId || 'merchant@bank').slice(0, 32)}`,
        '5204599953038405802KH',
        `59${(state.bakong.merchantName || 'Merchant').slice(0, 25)}`,
        `60${(state.bakong.city || 'Phnom Penh').slice(0, 15)}`,
        `54${Number(amount || 0).toFixed(2)}`,
        `62${reference || ''}`,
        state.bakong.environment === 'sandbox' ? 'SANDBOX' : ''
      ]
        .filter(Boolean)
        .join('|')
  },

  actions: {
    persist() {
      // Token is stored locally only for this prototype.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ bakong: this.bakong, card: this.card, bankTransfer: this.bankTransfer })
      )
    },

    update(section, payload) {
      this[section] = { ...this[section], ...payload }
      this.persist()
    },

    rotateToken(token) {
      this.bakong.token = String(token || '').trim()
      this.lastTest = null
      this.persist()
    },

    clearToken() {
      this.bakong.token = ''
      this.lastTest = null
      this.persist()
    },

    /**
     * Mock connection check. Swap the body for a real request to YOUR backend
     * (never call the gateway directly from the browser with a secret).
     */
    async testConnection() {
      this.testing = true
      await new Promise((resolve) => setTimeout(resolve, 900))
      this.testing = false

      const missing = this.missingFields
      const ok = missing.length === 0
      this.lastTest = {
        ok,
        message: ok
          ? `Connected to Bakong ${this.bakong.environment} as ${this.bakong.accountId}`
          : `Missing: ${missing.join(', ')}`,
        at: new Date().toLocaleString()
      }
      return this.lastTest
    },

    reset(section) {
      this[section] = clone(DEFAULTS[section])
      this.persist()
    }
  }
})
