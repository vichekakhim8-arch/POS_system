import { defineStore } from 'pinia'
import { products as seedProducts } from '@/data/products'
import { categories as seedCategories } from '@/data/categories'
import { placeholderImage, round2 } from '@/utils/helpers'

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: seedProducts.map((p) => ({ ...p })),
    categories: seedCategories.map((c) => ({ ...c })),
    search: '',
    category: 'All',
    status: 'All'
  }),
  getters: {
    categoryNames: (state) => state.categories.map((c) => c.name),
    categoryTabs: (state) => ['All', ...state.categories.map((c) => c.name)],

    /** Products filtered by the active search / category / status filters. */
    filtered: (state) => {
      const term = state.search.trim().toLowerCase()
      return state.items.filter((p) => {
        const matchTerm =
          !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
        const matchCat = state.category === 'All' || p.category === state.category
        const matchStatus = state.status === 'All' || p.status === state.status
        return matchTerm && matchCat && matchStatus
      })
    },

    byId: (state) => (id) => state.items.find((p) => p.id === Number(id)),
    total: (state) => state.items.length,
    lowStock: (state) => state.items.filter((p) => p.stock > 0 && p.stock <= p.lowStock),
    outOfStock: (state) => state.items.filter((p) => p.stock <= 0),
    stockValue: (state) => round2(state.items.reduce((s, p) => s + p.cost * p.stock, 0)),
    retailValue: (state) => round2(state.items.reduce((s, p) => s + p.price * p.stock, 0)),
    countByCategory: (state) => (name) => state.items.filter((p) => p.category === name).length
  },
  actions: {
    setSearch(value) {
      this.search = value
    },
    setCategory(value) {
      this.category = value
    },
    setStatus(value) {
      this.status = value
    },
    resetFilters() {
      this.search = ''
      this.category = 'All'
      this.status = 'All'
    },
    nextId() {
      return this.items.length ? Math.max(...this.items.map((p) => p.id)) + 1 : 1
    },
    addProduct(payload) {
      const product = {
        ...payload,
        id: this.nextId(),
        price: Number(payload.price) || 0,
        cost: Number(payload.cost) || 0,
        stock: Number(payload.stock) || 0,
        lowStock: Number(payload.lowStock) || 10,
        image: payload.image || placeholderImage(payload.name)
      }
      this.items.push(product)
      return product
    },
    updateProduct(id, payload) {
      const product = this.byId(id)
      if (!product) return null
      Object.assign(product, {
        ...payload,
        price: Number(payload.price) || 0,
        cost: Number(payload.cost) || 0,
        stock: Number(payload.stock) || 0,
        lowStock: Number(payload.lowStock) || 10,
        image: payload.image || product.image
      })
      return product
    },
    removeProduct(id) {
      this.items = this.items.filter((p) => p.id !== Number(id))
    },
    /** Stock mutations used by the inventory / orders stores. */
    decreaseStock(id, qty) {
      const product = this.byId(id)
      if (!product) return
      product.stock = Math.max(0, product.stock - Number(qty))
      if (product.stock === 0) product.status = 'Inactive'
    },
    increaseStock(id, qty) {
      const product = this.byId(id)
      if (!product) return
      product.stock += Number(qty)
      if (product.stock > 0) product.status = 'Active'
    },
    addCategory(payload) {
      const id = this.categories.length ? Math.max(...this.categories.map((c) => c.id)) + 1 : 1
      this.categories.push({ id, ...payload })
    },
    updateCategory(id, payload) {
      const category = this.categories.find((c) => c.id === id)
      if (!category) return
      const previous = category.name
      Object.assign(category, payload)
      this.items.forEach((p) => {
        if (p.category === previous) p.category = payload.name
      })
    },
    removeCategory(id) {
      const category = this.categories.find((c) => c.id === id)
      if (!category) return false
      if (this.items.some((p) => p.category === category.name)) return false
      this.categories = this.categories.filter((c) => c.id !== id)
      return true
    }
  }
})
