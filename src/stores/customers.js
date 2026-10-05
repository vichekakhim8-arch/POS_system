import { defineStore } from 'pinia'
import { customers as seedCustomers } from '@/data/customers'
import { today } from '@/utils/helpers'

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    items: seedCustomers.map((c) => ({ ...c })),
    search: ''
  }),
  getters: {
    byId: (state) => (id) => state.items.find((c) => c.id === Number(id)),
    filtered: (state) => {
      const term = state.search.trim().toLowerCase()
      if (!term) return state.items
      return state.items.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.email.toLowerCase().includes(term)
      )
    }
  },
  actions: {
    setSearch(value) {
      this.search = value
    },
    add(payload) {
      const id = this.items.length ? Math.max(...this.items.map((c) => c.id)) + 1 : 1
      this.items.push({ id, joined: today(), ...payload })
    },
    update(id, payload) {
      const customer = this.byId(id)
      if (customer) Object.assign(customer, payload)
    },
    remove(id) {
      this.items = this.items.filter((c) => c.id !== Number(id))
    }
  }
})
