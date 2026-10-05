import { defineStore } from 'pinia'
import { users as seedUsers, rolePermissions } from '@/data/users'
import { today } from '@/utils/helpers'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: seedUsers.map((u) => ({ ...u }))
  }),
  getters: {
    roles: () => Object.keys(rolePermissions),
    permissions: () => rolePermissions,
    byRole: (state) => (role) => state.items.filter((u) => u.role === role),
    byId: (state) => (id) => state.items.find((u) => u.id === Number(id))
  },
  actions: {
    add(payload) {
      const id = this.items.length ? Math.max(...this.items.map((u) => u.id)) + 1 : 1
      this.items.push({ id, joined: today(), ...payload })
    },
    update(id, payload) {
      const user = this.byId(id)
      if (user) Object.assign(user, payload)
    },
    remove(id) {
      this.items = this.items.filter((u) => u.id !== Number(id))
    }
  }
})
