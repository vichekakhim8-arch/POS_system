import { defineStore } from 'pinia'
import { discounts as seedDiscounts } from '@/data/discounts'
import { round2, today } from '@/utils/helpers'
import { useProductsStore } from './products'

/* ------------------------------------------------------------------ rules */
/**
 * Specificity ranking — higher wins. Implements:
 *   product-specific > variant > category > all products
 * Stacking is intentionally disabled: one product = one applicable discount.
 */
export const PRIORITY = { products: 40, variants: 30, categories: 20, all: 10 }

const nowTime = () => new Date().toTimeString().slice(0, 5)

const withinTime = (discount, time = nowTime()) => {
  const start = discount.startTime || '00:00'
  const end = discount.endTime || '23:59'
  // Supports windows that wrap past midnight (e.g. 22:00 → 02:00)
  return start <= end ? time >= start && time <= end : time >= start || time <= end
}

const withinDate = (discount, date = today()) => {
  if (!discount.startDate || !discount.endDate) return false
  return date >= discount.startDate && date <= discount.endDate
}

/** Derived lifecycle status — never stored, always computed. */
export function resolveStatus(discount, date = today()) {
  if (!discount.startDate || !discount.endDate || !(Number(discount.value) > 0)) return 'Draft'
  if (!discount.active) return 'Disabled'
  if (date < discount.startDate) return 'Scheduled'
  if (date > discount.endDate) return 'Expired'
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) return 'Expired'
  return 'Active'
}

export const emptyDiscount = () => ({
  id: null,
  name: '',
  description: '',
  type: 'percentage',
  value: '',
  applyTo: 'all',
  categoryIds: [],
  productIds: [],
  variantIds: [],
  startDate: today(),
  endDate: '',
  startTime: '00:00',
  endTime: '23:59',
  minimumOrderAmount: 0,
  maximumDiscount: null,
  usageLimit: null,
  perCustomerLimit: null,
  usageCount: 0,
  code: '',
  requiresCode: false,
  customerEligibility: 'all',
  customerIds: [],
  active: true
})

/* ------------------------------------------------------------------ store */
export const useDiscountsStore = defineStore('discounts', {
  state: () => ({
    items: seedDiscounts.map((d) => ({ ...d })),
    search: '',
    statusFilter: 'All',
    typeFilter: 'All',
    appliesToFilter: 'All',
    dateFilter: 'All',
    /** Codes the cashier has entered for the current sale. */
    appliedCodes: []
  }),

  getters: {
    withStatus: (state) => state.items.map((d) => ({ ...d, status: resolveStatus(d) })),

    byId: (state) => (id) => state.items.find((d) => d.id === id),

    activeDiscounts() {
      return this.withStatus.filter((d) => d.status === 'Active')
    },

    stats() {
      const all = this.withStatus
      return {
        active: all.filter((d) => d.status === 'Active').length,
        scheduled: all.filter((d) => d.status === 'Scheduled').length,
        expired: all.filter((d) => d.status === 'Expired').length,
        disabled: all.filter((d) => d.status === 'Disabled').length,
        draft: all.filter((d) => d.status === 'Draft').length,
        total: all.length
      }
    },

    /** Search matches name, code, linked product names and category names. */
    filtered(state) {
      const products = useProductsStore()
      const term = state.search.trim().toLowerCase()

      return this.withStatus.filter((d) => {
        if (state.statusFilter !== 'All' && d.status !== state.statusFilter) return false
        if (state.typeFilter !== 'All' && d.type !== state.typeFilter) return false
        if (state.appliesToFilter !== 'All' && d.applyTo !== state.appliesToFilter) return false

        if (state.dateFilter !== 'All') {
          const t = today()
          if (state.dateFilter === 'Running' && !(d.startDate <= t && d.endDate >= t)) return false
          if (state.dateFilter === 'Upcoming' && !(d.startDate > t)) return false
          if (state.dateFilter === 'Past' && !(d.endDate && d.endDate < t)) return false
        }

        if (!term) return true

        const haystack = [
          d.name,
          d.code,
          d.description,
          ...d.productIds.map((id) => products.byId(id)?.name || ''),
          ...d.categoryIds.map((id) => products.categories.find((c) => c.id === id)?.name || ''),
          ...d.variantIds
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(term)
      })
    },

    /**
     * Does this campaign match the given product / variant?
     * (Scope only — conditions are checked separately.)
     */
    matchesScope() {
      return (discount, product, variantId = null) => {
        const category = useProductsStore().categories.find((c) => c.name === product.category)
        switch (discount.applyTo) {
          case 'all':
            return true
          case 'categories':
            return !!category && discount.categoryIds.includes(category.id)
          case 'products':
            return discount.productIds.includes(product.id)
          case 'variants':
            return variantId
              ? discount.variantIds.includes(variantId)
              : (product.variants || []).some((v) => discount.variantIds.includes(v.id))
          default:
            return false
        }
      }
    },

    /**
     * Campaigns that match the product but are BLOCKED by an unmet condition.
     * Powers the "spend $X more to unlock…" hint — and guarantees the hint and
     * the actual price can never disagree, because both read this same source.
     */
    lockedForProduct() {
      return (product, variantId = null, context = {}) => {
        if (!product) return []
        const orderTotal = Number(context.orderTotal) || 0
        return this.activeDiscounts
          .filter((d) => d.minimumOrderAmount > 0 && orderTotal < d.minimumOrderAmount)
          .filter((d) => !d.requiresCode || this.appliedCodes.includes(d.code))
          .filter((d) => withinTime(d))
          .filter((d) => this.matchesScope(d, product, variantId))
          .map((d) => ({ ...d, remaining: round2(d.minimumOrderAmount - orderTotal) }))
      }
    },

    /**
     * Returns the single winning discount for a product (+ optional variant),
     * or null. This is THE shared entry point used by POS, cart and receipts.
     *
     * @param {object} context { orderTotal } — gross order value used to test
     *        `minimumOrderAmount`. Omit it for catalogue previews.
     */
    discountForProduct() {
      return (product, variantId = null, context = {}) => {
        if (!product) return null
        const orderTotal = Number(context.orderTotal) || 0

        const candidates = this.activeDiscounts.filter((d) => {
          if (d.requiresCode && !this.appliedCodes.includes(d.code)) return false
          if (!withinTime(d)) return false
          // ── minimum spend gate ───────────────────────────────────────────
          // Previously missing: a campaign with minimumOrderAmount was applied
          // even when the cart was below the threshold.
          if (d.minimumOrderAmount > 0 && orderTotal < d.minimumOrderAmount) return false
          return this.matchesScope(d, product, variantId)
        })

        if (!candidates.length) return null

        // No stacking — pick by specificity, then by greatest customer benefit.
        const benefit = (d) =>
          d.type === 'percentage' ? (product.price * d.value) / 100 : Number(d.value)

        return candidates.sort((a, b) => {
          const p = PRIORITY[b.applyTo] - PRIORITY[a.applyTo]
          return p !== 0 ? p : benefit(b) - benefit(a)
        })[0]
      }
    },

    /**
     * Price breakdown for one unit of a product.
     * { discount, unitPrice, unitDiscount, finalPrice, percentOff }
     */
    priceFor() {
      return (product, variantId = null, context = {}) => {
        const variant = variantId
          ? (product.variants || []).find((v) => v.id === variantId)
          : null
        const unitPrice = variant ? variant.price : product.price
        const discount = this.discountForProduct(product, variantId, context)

        if (!discount) {
          const locked = this.lockedForProduct(product, variantId, context)
          return {
            discount: null,
            locked: locked[0] || null,
            unitPrice,
            unitDiscount: 0,
            finalPrice: unitPrice,
            percentOff: 0
          }
        }

        let unitDiscount =
          discount.type === 'percentage'
            ? (unitPrice * Number(discount.value)) / 100
            : Number(discount.value)

        if (discount.maximumDiscount) unitDiscount = Math.min(unitDiscount, discount.maximumDiscount)
        unitDiscount = round2(Math.min(Math.max(unitDiscount, 0), unitPrice))

        return {
          discount,
          locked: null,
          unitPrice,
          unitDiscount,
          finalPrice: round2(unitPrice - unitDiscount),
          percentOff: unitPrice > 0 ? Math.round((unitDiscount / unitPrice) * 100) : 0
        }
      }
    },

    /** Conflict detector surfaced in the UI so owners avoid overlapping rules. */
    conflictsFor() {
      return (discount) =>
        this.activeDiscounts.filter(
          (d) =>
            d.id !== discount.id &&
            d.applyTo === discount.applyTo &&
            PRIORITY[d.applyTo] === PRIORITY[discount.applyTo] &&
            (discount.applyTo === 'all' ||
              (discount.applyTo === 'categories' &&
                d.categoryIds.some((id) => discount.categoryIds.includes(id))) ||
              (discount.applyTo === 'products' &&
                d.productIds.some((id) => discount.productIds.includes(id))) ||
              (discount.applyTo === 'variants' &&
                d.variantIds.some((id) => discount.variantIds.includes(id))))
        )
    }
  },

  actions: {
    setSearch(value) {
      this.search = value
    },
    setFilter(key, value) {
      this[key] = value
    },
    resetFilters() {
      this.search = ''
      this.statusFilter = 'All'
      this.typeFilter = 'All'
      this.appliesToFilter = 'All'
      this.dateFilter = 'All'
    },

    nextId() {
      const numbers = this.items
        .map((d) => parseInt(String(d.id).replace('DSC-', ''), 10))
        .filter((n) => !Number.isNaN(n))
      return `DSC-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`
    },

    normalize(payload) {
      return {
        ...payload,
        value: Number(payload.value) || 0,
        minimumOrderAmount: Number(payload.minimumOrderAmount) || 0,
        maximumDiscount: payload.maximumDiscount ? Number(payload.maximumDiscount) : null,
        usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
        perCustomerLimit: payload.perCustomerLimit ? Number(payload.perCustomerLimit) : null,
        code: (payload.code || '').trim().toUpperCase(),
        categoryIds: [...(payload.categoryIds || [])],
        productIds: [...(payload.productIds || [])],
        variantIds: [...(payload.variantIds || [])],
        customerIds: [...(payload.customerIds || [])]
      }
    },

    create(payload) {
      const discount = {
        ...this.normalize(payload),
        id: this.nextId(),
        usageCount: 0,
        createdAt: today(),
        updatedAt: today()
      }
      this.items.unshift(discount)
      return discount
    },

    update(id, payload) {
      const index = this.items.findIndex((d) => d.id === id)
      if (index === -1) return null
      this.items[index] = {
        ...this.items[index],
        ...this.normalize(payload),
        id,
        updatedAt: today()
      }
      return this.items[index]
    },

    duplicate(id) {
      const source = this.byId(id)
      if (!source) return null
      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: this.nextId(),
        name: `${source.name} (Copy)`,
        code: source.code ? `${source.code}-COPY` : '',
        usageCount: 0,
        active: false,
        createdAt: today(),
        updatedAt: today()
      }
      this.items.unshift(copy)
      return copy
    },

    setActive(id, active) {
      const discount = this.byId(id)
      if (discount) {
        discount.active = active
        discount.updatedAt = today()
      }
    },

    remove(id) {
      this.items = this.items.filter((d) => d.id !== id)
    },

    /* --------------------------------------------------------- code entry */
    applyCode(code) {
      const clean = String(code || '').trim().toUpperCase()
      if (!clean) return { ok: false, message: 'Enter a discount code' }
      const match = this.withStatus.find((d) => d.code === clean)
      if (!match) return { ok: false, message: 'That code does not exist' }
      if (match.status !== 'Active') return { ok: false, message: `Code is ${match.status.toLowerCase()}` }
      if (this.appliedCodes.includes(clean)) return { ok: false, message: 'Code already applied' }
      this.appliedCodes.push(clean)
      return { ok: true, message: `${match.name} applied`, discount: match }
    },

    removeCode(code) {
      this.appliedCodes = this.appliedCodes.filter((c) => c !== code)
    },

    clearCodes() {
      this.appliedCodes = []
    },

    /** Called by the orders store when a sale completes. */
    registerUsage(discountIds = []) {
      discountIds.forEach((id) => {
        const discount = this.byId(id)
        if (discount) discount.usageCount += 1
      })
    }
  }
})
