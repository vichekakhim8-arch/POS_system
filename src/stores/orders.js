import { defineStore } from 'pinia'
import { orders as seedOrders } from '@/data/orders'
import { nowTime, round2, today } from '@/utils/helpers'
import { useProductsStore } from './products'
import { useInventoryStore } from './inventory'
import { useAuthStore } from './auth'
import { useCustomersStore } from './customers'
import { useDiscountsStore } from './discounts'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    items: seedOrders.map((o) => ({ ...o })),
    lastOrder: null
  }),
  getters: {
    paid: (state) => state.items.filter((o) => o.status === 'Paid'),
    byId: (state) => (id) => state.items.find((o) => o.id === id),
    byCustomer: (state) => (customerId) => state.items.filter((o) => o.customerId === customerId),
    todayOrders() {
      return this.paid.filter((o) => o.date === today())
    },
    todaySales() {
      return round2(this.todayOrders.reduce((s, o) => s + o.total, 0))
    },
    revenue() {
      return round2(this.paid.reduce((s, o) => s + o.total, 0))
    },
    profit() {
      return round2(this.paid.reduce((s, o) => s + (o.profit || 0), 0))
    },
    inRange() {
      return (from, to) => this.paid.filter((o) => o.date >= from && o.date <= to)
    },

    /** Discount analytics used by the Reports page. */
    discountStats() {
      return (from, to) => {
        const scope = from && to ? this.inRange(from, to) : this.paid
        const discounted = scope.filter((o) => o.discount > 0)
        const byCampaign = new Map()
        const byProduct = new Map()

        scope.forEach((order) => {
          ;(order.appliedDiscounts || []).forEach((d) => {
            const current = byCampaign.get(d.id) || { id: d.id, name: d.name, amount: 0, orders: 0 }
            current.amount = round2(current.amount + d.amount)
            current.orders += 1
            byCampaign.set(d.id, current)
          })
          order.items.forEach((item) => {
            const amount = item.lineDiscount ?? (item.discount || 0) * item.qty
            if (!amount) return
            const current = byProduct.get(item.name) || { name: item.name, amount: 0, qty: 0 }
            current.amount = round2(current.amount + amount)
            current.qty += item.qty
            byProduct.set(item.name, current)
          })
        })

        const campaigns = [...byCampaign.values()].sort((a, b) => b.amount - a.amount)
        return {
          totalDiscount: round2(scope.reduce((s, o) => s + (o.discount || 0), 0)),
          discountedOrders: discounted.length,
          totalOrders: scope.length,
          averageDiscount: discounted.length
            ? round2(discounted.reduce((s, o) => s + o.discount, 0) / discounted.length)
            : 0,
          topCampaign: campaigns[0] || null,
          campaigns,
          products: [...byProduct.values()].sort((a, b) => b.amount - a.amount)
        }
      }
    },
    /** Aggregated product performance across paid orders. */
    productPerformance() {
      const map = {}
      this.paid.forEach((order) =>
        order.items.forEach((item) => {
          if (!map[item.name])
            map[item.name] = { name: item.name, image: item.image, qty: 0, revenue: 0, profit: 0 }
          map[item.name].qty += item.qty
          map[item.name].revenue += item.price * item.qty
          map[item.name].profit += (item.price - item.cost) * item.qty
        })
      )
      return Object.values(map).sort((a, b) => b.revenue - a.revenue)
    }
  },
  actions: {
    nextId() {
      const numbers = this.items
        .map((o) => parseInt(String(o.id).replace('ORD-', ''), 10))
        .filter((n) => !Number.isNaN(n))
      return `ORD-${(numbers.length ? Math.max(...numbers) : 2400) + 1}`
    },
    /**
     * Create a paid order from a cart snapshot, decrease stock and log movements.
     * @returns {object} the created order
     */
    createOrder({ snapshot, method, paid, change }) {
      const products = useProductsStore()
      const inventory = useInventoryStore()
      const auth = useAuthStore()
      const customers = useCustomersStore()

      const customer = snapshot.customerId ? customers.byId(snapshot.customerId) : null
      const order = {
        id: this.nextId(),
        date: today(),
        time: nowTime(),
        customerId: snapshot.customerId,
        customer: customer ? customer.name : 'Walk-in Customer',
        items: snapshot.items,
        subtotal: snapshot.subtotal,
        itemDiscount: snapshot.itemDiscount ?? 0,
        orderDiscount: snapshot.orderDiscount ?? 0,
        appliedDiscounts: snapshot.appliedDiscounts || [],
        discount: snapshot.discount,
        tax: snapshot.tax,
        total: snapshot.total,
        method,
        paid: round2(paid ?? snapshot.total),
        change: round2(change ?? 0),
        status: 'Paid',
        cashier: auth.user?.name || 'Cashier',
        profit: round2(
          snapshot.items.reduce(
            (s, i) => s + (i.price - i.cost - (Number(i.discount) || 0)) * i.qty,
            0
          )
        )
      }

      order.items.forEach((item) => {
        products.decreaseStock(item.id, item.qty)
        inventory.log({
          productId: item.id,
          product: item.name,
          type: 'out',
          qty: item.qty,
          reason: `Sale ${order.id}`
        })
      })

      // Record campaign usage so limits and reports stay accurate.
      useDiscountsStore().registerUsage((order.appliedDiscounts || []).map((d) => d.id))

      this.items.unshift(order)
      this.lastOrder = order
      return order
    },
    updateStatus(id, status) {
      const order = this.byId(id)
      if (order) order.status = status
    },
    removeOrder(id) {
      this.items = this.items.filter((o) => o.id !== id)
    },
    clearLastOrder() {
      this.lastOrder = null
    }
  }
})
