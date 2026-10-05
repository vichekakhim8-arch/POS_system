import { daysAgo, randomInt, randomOf, round2 } from '@/utils/helpers'
import { products } from './products'

const seed = [
  ['Mekong Distributors', 'Mr. Sambath', 'Beverages, Snacks'],
  ['Golden Bakery Co.', 'Ms. Chhorvy', 'Bakery'],
  ['FreshFarm Produce', 'Mr. Piseth', 'Fruits, Dairy'],
  ['BrightHome Supplies', 'Ms. Sreyneang', 'Household, Personal Care'],
  ['TechLine Imports', 'Mr. Kosal', 'Electronics']
]

export const suppliers = seed.map(([name, contact, supplies], i) => ({
  id: i + 1,
  name,
  contact,
  phone: `+855 7${String(70000000 + i * 919191).slice(0, 8)}`,
  email: `sales@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
  address: 'Phnom Penh, Cambodia',
  supplies
}))

export const purchases = Array.from({ length: 12 }, (_, i) => {
  const supplier = suppliers[i % suppliers.length]
  const items = Array.from({ length: randomInt(2, 4) }, () => {
    const p = randomOf(products)
    return { id: p.id, name: p.name, qty: randomInt(10, 50), cost: p.cost }
  })
  return {
    id: `PO-${1201 + i}`,
    supplierId: supplier.id,
    supplier: supplier.name,
    date: daysAgo(randomInt(0, 60)),
    items,
    total: round2(items.reduce((s, it) => s + it.cost * it.qty, 0)),
    status: Math.random() < 0.8 ? 'Received' : 'Pending'
  }
}).sort((a, b) => b.date.localeCompare(a.date))
