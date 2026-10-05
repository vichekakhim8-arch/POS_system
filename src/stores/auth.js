import { defineStore } from 'pinia'
import { users as seedUsers, rolePermissions, roleAbilities } from '@/data/users'

const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms))

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    pendingOtp: null // { email, code }
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    role: (state) => state.user?.role || 'Guest',
    permissions: (state) => rolePermissions[state.user?.role] || [],
    abilities: (state) => roleAbilities[state.user?.role] || roleAbilities.Kitchen,
    /** can('createDiscounts') — hides unauthorised UI entirely. */
    can() {
      return (ability) => !!this.abilities[ability]
    }
  },
  actions: {
    async login(email, password) {
      this.loading = true
      await delay()
      this.loading = false

      const account = seedUsers.find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
      )
      if (!account) throw new Error('No account found with that email address.')
      if (!password || password.length < 4) throw new Error('Password must be at least 4 characters.')
      if (account.status !== 'Active') throw new Error('This account has been deactivated.')

      this.user = { ...account }
      return this.user
    },

    async register({ name, email, password, store }) {
      this.loading = true
      await delay()
      this.loading = false

      if (!name?.trim()) throw new Error('Please enter your full name.')
      if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error('Please enter a valid email address.')
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.')

      this.user = {
        id: Date.now(),
        name,
        email,
        phone: '',
        role: 'Admin',
        status: 'Active',
        store,
        joined: new Date().toISOString().slice(0, 10)
      }
      return this.user
    },

    /** Mock OTP: generates a 6-digit code (surfaced in the UI for the demo). */
    async requestOtp(email) {
      this.loading = true
      await delay(450)
      this.loading = false
      if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error('Please enter a valid email address.')
      const code = String(Math.floor(100000 + Math.random() * 900000))
      this.pendingOtp = { email, code }
      return code
    },

    async verifyOtp(code) {
      this.loading = true
      await delay(400)
      this.loading = false
      if (!this.pendingOtp) throw new Error('Request a verification code first.')
      if (String(code) !== this.pendingOtp.code) throw new Error('That code is incorrect.')
      return true
    },

    async resetPassword(password) {
      this.loading = true
      await delay(400)
      this.loading = false
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.')
      this.pendingOtp = null
      return true
    },

    logout() {
      this.user = null
      this.pendingOtp = null
    }
  }
})
