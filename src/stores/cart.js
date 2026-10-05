import { defineStore } from 'pinia'
import { round2 } from '@/utils/helpers'
import { useSettingsStore } from './settings'
import { useProductsStore } from './products'
import { useDiscountsStore } from './discounts'

/**
 * Cart state. All automatic product discounts come from the single shared
 * discount engine (stores/discounts.js) — no pricing logic is duplicated here
 * or in any component.
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    customerId: null,
    orderDiscount: 0,
    discountType: 'amount' // 'amount' | 'percent'
  }),

  getters: {
    count: (state) => state.items.reduce((s, i) => s + i.qty, 0),
    isEmpty: (state) => state.items.length === 0,

    /**
     * Undiscounted order value. Deliberately independent of the discount
     * engine so it can be fed back in as the `minimumOrderAmount` yardstick
     * without creating a circular computed.
     */
    grossSubtotal: (state) => round2(state.items.reduce((s, i) => s + i.price * i.qty, 0)),

    /** Lines enriched with the winning automatic discount for each product. */
    lines(state) {
      const products = useProductsStore()
      const discounts = useDiscountsStore()
      const context = { orderTotal: this.grossSubtotal }

      return state.items.map((item) => {
        const product = products.byId(item.id)
        const pricing = product
          ? discounts.priceFor(product, item.variantId, context)
          : {
              discount: null,
              locked: null,
              unitPrice: item.price,
              unitDiscount: 0,
              finalPrice: item.price,
              percentOff: 0
            }

        const manual = Number(item.discount) || 0
        // Manual line discount and an automatic rule never stack.
        const unitDiscount = manual > 0 ? Math.min(manual, item.price) : pricing.unitDiscount
        const appliedDiscount = manual > 0 ? null : pricing.discount
        const finalPrice = round2(Math.max(0, item.price - unitDiscount))

        return {
          ...item,
          unitPrice: item.price,
          unitDiscount,
          finalPrice,
          percentOff: item.price > 0 ? Math.round((unitDiscount / item.price) * 100) : 0,
          lineOriginal: round2(item.price * item.qty),
          lineDiscount: round2(unitDiscount * item.qty),
          lineTotal: round2(finalPrice * item.qty),
          appliedDiscount,
          lockedDiscount: manual > 0 ? null : pricing.locked,
          discountName: manual > 0 ? 'Manual discount' : appliedDiscount?.name || ''
        }
      })
    },

    subtotal() {
      return round2(this.lines.reduce((s, l) => s + l.lineOriginal, 0))
    },

    /** Sum of every automatic + manual line discount. */
    itemDiscount() {
      return round2(this.lines.reduce((s, l) => s + l.lineDiscount, 0))
    },

    /** Distinct discount campaigns currently applied to the cart. */
    appliedDiscounts() {
      const map = new Map()
      this.lines.forEach((line) => {
        if (!line.appliedDiscount) return
        const current = map.get(line.appliedDiscount.id)
        map.set(line.appliedDiscount.id, {
          id: line.appliedDiscount.id,
          name: line.appliedDiscount.name,
          type: line.appliedDiscount.type,
          value: line.appliedDiscount.value,
          code: line.appliedDiscount.code,
          amount: round2((current?.amount || 0) + line.lineDiscount)
        })
      })
      return [...map.values()]
    },

    /**
     * Campaigns that WOULD apply to something in the cart but are blocked by
     * an unmet minimum. Derived from the same engine call that prices the
     * lines, so the banner and the totals can never contradict each other.
     */
    unmetMinimums() {
      const map = new Map()
      this.lines.forEach((line) => {
        const locked = line.lockedDiscount
        if (locked && !map.has(locked.id)) map.set(locked.id, locked)
      })
      return [...map.values()].sort((a, b) => a.remaining - b.remaining)
    },

    orderDiscountValue(state) {
      const base = this.subtotal - this.itemDiscount
      const value =
        state.discountType === 'percent'
          ? (base * (Number(state.orderDiscount) || 0)) / 100
          : Number(state.orderDiscount) || 0
      return round2(Math.min(Math.max(value, 0), base))
    },

    discount() {
      return round2(this.itemDiscount + this.orderDiscountValue)
    },

    tax() {
      const settings = useSettingsStore()
      return round2(((this.subtotal - this.discount) * settings.taxRate) / 100)
    },

    total() {
      return round2(Math.max(0, this.subtotal - this.discount + this.tax))
    }
  },

  actions: {
    addProduct(product, variantId = null) {
      if (product.stock <= 0) return { ok: false, message: `${product.name} is out of stock` }

      const variant = variantId ? (product.variants || []).find((v) => v.id === variantId) : null
      const key = variantId || `p-${product.id}`
      const existing = this.items.find((i) => i.key === key)

      if (existing) {
        if (existing.qty >= product.stock)
          return { ok: false, message: `Only ${product.stock} units available` }
        existing.qty += 1
      } else {
        this.items.push({
          key,
          id: product.id,
          variantId,
          variantName: variant?.name || '',
          name: variant ? `${product.name} · ${variant.name}` : product.name,
          sku: product.sku,
          category: product.category,
          image: product.image,
          price: variant ? variant.price : product.price,
          cost: product.cost,
          qty: 1,
          discount: 0
        })
      }
      return { ok: true, message: `${product.name} added to cart` }
    },

    find(key) {
      return this.items.find((i) => i.key === key || i.id === key)
    },

    increase(key) {
      const products = useProductsStore()
      const item = this.find(key)
      if (!item) return { ok: false, message: 'Item not found' }
      const product = products.byId(item.id)
      if (product && item.qty >= product.stock) return { ok: false, message: 'Stock limit reached' }
      item.qty += 1
      return { ok: true }
    },

    decrease(key) {
      const item = this.find(key)
      if (!item) return
      if (item.qty > 1) item.qty -= 1
      else this.remove(key)
    },

    setItemDiscount(key, value) {
      const item = this.find(key)
      if (!item) return
      item.discount = Math.min(Math.max(Number(value) || 0, 0), item.price)
    },

    setOrderDiscount(value, type) {
      this.orderDiscount = Math.max(Number(value) || 0, 0)
      if (type) this.discountType = type
    },

    setCustomer(id) {
      this.customerId = id
    },

    remove(key) {
      this.items = this.items.filter((i) => i.key !== key && i.id !== key)
    },

    clear() {
      this.items = []
      this.customerId = null
      this.orderDiscount = 0
      this.discountType = 'amount'
      useDiscountsStore().clearCodes()
    },

    /** Immutable snapshot handed to the orders store at checkout. */
    snapshot() {
      return {
        items: this.lines.map((line) => ({
          key: line.key,
          id: line.id,
          variantId: line.variantId,
          variantName: line.variantName,
          name: line.name,
          image: line.image,
          price: line.unitPrice,
          cost: line.cost,
          qty: line.qty,
          discount: line.unitDiscount,
          lineDiscount: line.lineDiscount,
          lineTotal: line.lineTotal,
          discountName: line.discountName,
          discountId: line.appliedDiscount?.id || null
        })),
        subtotal: this.subtotal,
        itemDiscount: this.itemDiscount,
        orderDiscount: this.orderDiscountValue,
        discount: this.discount,
        tax: this.tax,
        total: this.total,
        customerId: this.customerId,
        appliedDiscounts: this.appliedDiscounts
      }
    }
  }
})
