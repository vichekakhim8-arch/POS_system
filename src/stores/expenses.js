import { defineStore } from 'pinia'
import { expenses as seedExpenses, expenseCategories } from '@/data/expenses'
import { round2 } from '@/utils/helpers'

export const useExpensesStore = defineStore('expenses', {
  state: () => ({
    items: seedExpenses.map((e) => ({ ...e })),
    category: 'All'
  }),
  getters: {
    categories: () => expenseCategories,
    filtered: (state) =>
      state.category === 'All'
        ? state.items
        : state.items.filter((e) => e.category === state.category),
    total: (state) => round2(state.items.reduce((s, e) => s + e.amount, 0)),
    inRange: (state) => (from, to) => state.items.filter((e) => e.date >= from && e.date <= to),
    byCategory: (state) => (name) =>
      round2(state.items.filter((e) => e.category === name).reduce((s, e) => s + e.amount, 0))
  },
  actions: {
    setCategory(value) {
      this.category = value
    },
    nextId() {
      const numbers = this.items
        .map((e) => parseInt(String(e.id).replace('EXP-', ''), 10))
        .filter((n) => !Number.isNaN(n))
      return `EXP-${(numbers.length ? Math.max(...numbers) : 300) + 1}`
    },
    add(payload) {
      this.items.unshift({ id: this.nextId(), ...payload, amount: round2(payload.amount) })
    },
    update(id, payload) {
      const expense = this.items.find((e) => e.id === id)
      if (expense) Object.assign(expense, payload, { amount: round2(payload.amount) })
    },
    remove(id) {
      this.items = this.items.filter((e) => e.id !== id)
    }
  }
})
