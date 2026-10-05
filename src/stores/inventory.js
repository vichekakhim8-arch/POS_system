import { defineStore } from 'pinia'
import { daysAgo, randomInt, randomOf, today, uid } from '@/utils/helpers'
import { products as seedProducts } from '@/data/products'
import { useProductsStore } from './products'
import { useAuthStore } from './auth'

const seedMovements = Array.from({ length: 18 }, () => {
  const p = randomOf(seedProducts)
  const type = Math.random() < 0.5 ? 'in' : 'out'
  return {
    id: uid('MV-'),
    date: daysAgo(randomInt(0, 20)),
    productId: p.id,
    product: p.name,
    type,
    qty: type === 'in' ? randomInt(10, 50) : randomInt(1, 8),
    reason: type === 'in' ? 'Purchase received' : 'Sale',
    by: 'Alex Morgan'
  }
}).sort((a, b) => b.date.localeCompare(a.date))

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    movements: seedMovements
  }),
  getters: {
    stockIn: (state) => state.movements.filter((m) => m.type === 'in'),
    stockOut: (state) => state.movements.filter((m) => m.type === 'out'),
    recent: (state) => state.movements.slice(0, 40),
    byProduct: (state) => (productId) => state.movements.filter((m) => m.productId === productId),
    totalIn: (state) =>
      state.movements.filter((m) => m.type === 'in').reduce((s, m) => s + m.qty, 0),
    totalOut: (state) =>
      state.movements.filter((m) => m.type === 'out').reduce((s, m) => s + m.qty, 0)
  },
  actions: {
    log({ productId, product, type, qty, reason }) {
      const auth = useAuthStore()
      this.movements.unshift({
        id: uid('MV-'),
        date: today(),
        productId,
        product,
        type,
        qty: Number(qty),
        reason,
        by: auth.user?.name || 'System'
      })
    },
    /** Receive stock into inventory. */
    receive(productId, qty, reason = 'Stock in') {
      const products = useProductsStore()
      const product = products.byId(productId)
      if (!product) return { ok: false, message: 'Product not found' }
      if (!(Number(qty) > 0)) return { ok: false, message: 'Quantity must be greater than zero' }
      products.increaseStock(product.id, qty)
      this.log({ productId: product.id, product: product.name, type: 'in', qty, reason })
      return { ok: true, message: `${qty} × ${product.name} added to stock` }
    },
    /** Issue stock out of inventory. */
    issue(productId, qty, reason = 'Stock out') {
      const products = useProductsStore()
      const product = products.byId(productId)
      if (!product) return { ok: false, message: 'Product not found' }
      if (!(Number(qty) > 0)) return { ok: false, message: 'Quantity must be greater than zero' }
      if (Number(qty) > product.stock)
        return { ok: false, message: `Only ${product.stock} units in stock` }
      products.decreaseStock(product.id, qty)
      this.log({ productId: product.id, product: product.name, type: 'out', qty, reason })
      return { ok: true, message: `${qty} × ${product.name} removed from stock` }
    }
  }
})
