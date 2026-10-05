import { daysAgo, randomInt, randomOf, round2 } from '@/utils/helpers'
import { products } from './products'
import { customers } from './customers'

const methods = ['Cash', 'KHQR', 'Card', 'Bank Transfer']
const statuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Cancelled', 'Refunded']
const cashiers = ['Alex Morgan', 'Sophea Chan', 'Dara Kim']

const TAX_RATE = 8.5

function buildOrder(index) {
  const items = []
  const lines = randomInt(1, 4)
  for (let i = 0; i < lines; i++) {
    const p = randomOf(products)
    if (items.some((it) => it.id === p.id)) continue
    items.push({
      id: p.id,
      name: p.name,
      price: p.price,
      cost: p.cost,
      qty: randomInt(1, 3),
      discount: 0,
      image: p.image
    })
  }
  const subtotal = round2(items.reduce((s, it) => s + it.price * it.qty, 0))
  const discount = Math.random() < 0.3 ? round2(subtotal * 0.05) : 0
  const tax = round2(((subtotal - discount) * TAX_RATE) / 100)
  const total = round2(subtotal - discount + tax)
  const customer = Math.random() < 0.75 ? randomOf(customers) : null
  const date = daysAgo(randomInt(0, 29))

  return {
    id: `ORD-${2401 + index}`,
    date,
    time: `${String(randomInt(8, 20)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`,
    customer: customer ? customer.name : 'Walk-in Customer',
    customerId: customer ? customer.id : null,
    items,
    subtotal,
    discount,
    tax,
    total,
    paid: total,
    change: 0,
    method: randomOf(methods),
    status: randomOf(statuses),
    cashier: randomOf(cashiers),
    profit: round2(items.reduce((s, it) => s + (it.price - it.cost) * it.qty, 0))
  }
}

export const orders = Array.from({ length: 48 }, (_, i) => buildOrder(i)).sort((a, b) =>
  (b.date + b.time).localeCompare(a.date + a.time)
)
