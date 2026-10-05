import { defineStore } from 'pinia'
import { suppliers as seedSuppliers, purchases as seedPurchases } from '@/data/suppliers'
import { round2, today } from '@/utils/helpers'
import { useInventoryStore } from './inventory'
import { useProductsStore } from './products'

export const useSuppliersStore = defineStore('suppliers', {
  state: () => ({
    items: seedSuppliers.map((s) => ({ ...s })),
    purchases: seedPurchases.map((p) => ({ ...p }))
  }),
  getters: {
    byId: (state) => (id) => state.items.find((s) => s.id === Number(id)),
    purchasesBySupplier: (state) => (id) => state.purchases.filter((p) => p.supplierId === id),
    purchaseTotal: (state) => round2(state.purchases.reduce((s, p) => s + p.total, 0)),
    pendingPurchases: (state) => state.purchases.filter((p) => p.status === 'Pending')
  },
  actions: {
    add(payload) {
      const id = this.items.length ? Math.max(...this.items.map((s) => s.id)) + 1 : 1
      this.items.push({ id, ...payload })
    },
    update(id, payload) {
      const supplier = this.byId(id)
      if (supplier) Object.assign(supplier, payload)
    },
    remove(id) {
      this.items = this.items.filter((s) => s.id !== Number(id))
    },
    nextPurchaseId() {
      const numbers = this.purchases
        .map((p) => parseInt(String(p.id).replace('PO-', ''), 10))
        .filter((n) => !Number.isNaN(n))
      return `PO-${(numbers.length ? Math.max(...numbers) : 1200) + 1}`
    },
    /** Confirm a purchase: creates the PO and increases inventory. */
    createPurchase({ supplierId, items }) {
      const supplier = this.byId(supplierId)
      const products = useProductsStore()
      const inventory = useInventoryStore()
      if (!supplier) return { ok: false, message: 'Select a supplier' }
      if (!items.length) return { ok: false, message: 'Add at least one product' }

      const purchase = {
        id: this.nextPurchaseId(),
        supplierId: supplier.id,
        supplier: supplier.name,
        date: today(),
        items: items.map((i) => ({ ...i })),
        total: round2(items.reduce((s, i) => s + i.cost * i.qty, 0)),
        status: 'Received'
      }

      purchase.items.forEach((item) => {
        const product = products.byId(item.id)
        if (product) product.cost = Number(item.cost)
        inventory.receive(item.id, item.qty, `Purchase ${purchase.id}`)
      })

      this.purchases.unshift(purchase)
      return { ok: true, purchase, message: `Purchase ${purchase.id} received` }
    },
    updatePurchaseStatus(id, status) {
      const purchase = this.purchases.find((p) => p.id === id)
      if (purchase) purchase.status = status
    }
  }
})
