/**
 * Product catalogue (mock).
 *
 * Images are explicit per product so a thumbnail can never drift away from
 * its item. Previously these were generated from a random seed, which is why
 * "Red Apples" rendered a street scene. Each entry now points at a curated
 * Unsplash photo of the actual product.
 */

const IMG = (id, w = 320) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${w}&q=70`

/** [name, category, price, cost, stock, unsplashId] */
const seed = [
  // ── Beverages ────────────────────────────────────────────────────────────
  ['Espresso Blend 250g', 'Beverages', 12.5, 7.2, 48, '1559056199-641a0ac8b55e'],
  ['Cold Brew Can', 'Beverages', 3.25, 1.6, 120, '1517701550927-30cf4ba1dba5'],
  ['Green Tea Pack', 'Beverages', 6.8, 3.4, 64, '1627435601361-ec25f5b1d0e5'],
  ['Sparkling Water 1L', 'Beverages', 1.95, 0.85, 8, '1523371683702-af41ee3c58f5'],
  ['Orange Juice 1L', 'Beverages', 4.1, 2.05, 54, '1600271886742-f049cd451bba'],

  // ── Bakery ───────────────────────────────────────────────────────────────
  ['Sourdough Loaf', 'Bakery', 5.4, 2.5, 22, '1585478259715-1c093a7b70d3'],
  ['Butter Croissant', 'Bakery', 2.75, 1.1, 40, '1555507036-ab1f4038808a'],
  ['Blueberry Muffin', 'Bakery', 3.1, 1.3, 0, '1607958996333-41aef7caefaa'],
  ['Baguette', 'Bakery', 2.4, 0.95, 18, '1549931319-a545dcf3bc73'],

  // ── Fruits ───────────────────────────────────────────────────────────────
  ['Organic Bananas 1kg', 'Fruits', 2.2, 1.05, 75, '1571771894821-ce9b6c11b08e'],
  ['Red Apples 1kg', 'Fruits', 3.6, 1.8, 52, '1619546813926-a78fa6372cd2'],
  ['Avocado (each)', 'Fruits', 1.85, 0.9, 30, '1523049673857-eb18f1d7b578'],
  ['Strawberry Box', 'Fruits', 4.95, 2.6, 6, '1464965911861-746a04b4bca6'],

  // ── Dairy ────────────────────────────────────────────────────────────────
  ['Whole Milk 1L', 'Dairy', 1.7, 0.95, 96, '1550583724-b2692b85b150'],
  ['Greek Yogurt 500g', 'Dairy', 4.2, 2.1, 33, '1488477181946-6428a0291777'],
  ['Cheddar Block 400g', 'Dairy', 7.45, 4.0, 15, '1486297678162-eb2a19b0a32d'],
  ['Free Range Eggs x12', 'Dairy', 4.8, 2.7, 44, '1582722872445-44dc5f7e3c8f'],

  // ── Snacks ───────────────────────────────────────────────────────────────
  ['Sea Salt Chips', 'Snacks', 2.6, 1.1, 88, '1566478989037-eec170784d0b'],
  ['Dark Chocolate 70%', 'Snacks', 3.95, 1.75, 41, '1511381939415-e44015466834'],
  ['Mixed Nuts 300g', 'Snacks', 8.5, 4.6, 27, '1536816579748-4ecb3f03d72a'],
  ['Protein Bar', 'Snacks', 2.3, 1.0, 110, '1622484212850-eb596d769edc'],

  // ── Household ────────────────────────────────────────────────────────────
  ['Dish Soap 750ml', 'Household', 3.4, 1.6, 37, '1585421514738-01798e348b17'],
  ['Paper Towels x6', 'Household', 6.9, 3.5, 12, '1583947215259-38e31be8751f'],
  ['Trash Bags x40', 'Household', 5.25, 2.4, 4, '1610557892470-55d9e80c0bce'],
  ['Laundry Pods x30', 'Household', 12.95, 7.1, 21, '1626806787461-102c1bfaaea1'],

  // ── Electronics ──────────────────────────────────────────────────────────
  ['USB-C Cable 2m', 'Electronics', 9.99, 4.2, 58, '1606904825846-647eb07f5be2'],
  ['Wireless Mouse', 'Electronics', 24.5, 13.0, 14, '1527864550417-7fd91fc51a46'],
  ['Bluetooth Speaker', 'Electronics', 39.9, 22.0, 9, '1608043152269-423dbba4e7e1'],
  ['Power Bank 10000mAh', 'Electronics', 29.95, 16.5, 17, '1609592806596-b43bada2f4bf'],

  // ── Personal Care ────────────────────────────────────────────────────────
  ['Shampoo 400ml', 'Personal Care', 7.3, 3.6, 36, '1556228578-8c89e6adf883'],
  ['Toothpaste Fresh', 'Personal Care', 3.15, 1.4, 72, '1607613009820-a29f7bb81c04'],
  ['Hand Cream', 'Personal Care', 5.6, 2.5, 2, '1570194065650-d99fb4bedf0a'],
  ['Bar Soap x4', 'Personal Care', 4.1, 1.8, 49, '1600857544200-b2f666a9a2ec']
]

/** Products that ship with size variants (used by variant-level discounts). */
const VARIANT_TEMPLATES = {
  1: [
    ['small', 'Small', -3],
    ['medium', 'Medium', 0],
    ['large', 'Large', 4]
  ],
  2: [
    ['regular', 'Regular', 0],
    ['large', 'Large', 1.2]
  ],
  6: [
    ['small', 'Small', -1.2],
    ['medium', 'Medium', 0],
    ['large', 'Large', 1.8]
  ],
  7: [
    ['single', 'Single', 0],
    ['large', 'Large', 1.1]
  ],
  14: [
    ['500ml', '500 ml', -0.7],
    ['1l', '1 Litre', 0]
  ]
}

export const products = seed.map(([name, category, price, cost, stock, photo], i) => {
  const id = i + 1
  const template = VARIANT_TEMPLATES[id]
  return {
    id,
    name,
    sku: `SKU-${1000 + i}`,
    category,
    price,
    cost,
    stock,
    lowStock: 10,
    status: stock > 0 ? 'Active' : 'Inactive',
    image: IMG(photo),
    description: `Quality ${category.toLowerCase()} item — ${name}.`,
    variants: template
      ? template.map(([key, label, delta]) => ({
          id: `${id}-${key}`,
          name: label,
          price: Math.max(0.5, Math.round((price + delta) * 100) / 100)
        }))
      : []
  }
})
