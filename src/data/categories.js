import { CHART_COLORS } from '@/utils/helpers'

const names = [
  ['Beverages', 'Coffee, tea, water and soft drinks'],
  ['Bakery', 'Fresh bread and pastries'],
  ['Fruits', 'Seasonal fresh produce'],
  ['Dairy', 'Milk, cheese, yoghurt and eggs'],
  ['Snacks', 'Chips, chocolate and bars'],
  ['Household', 'Cleaning and home essentials'],
  ['Electronics', 'Accessories and small devices'],
  ['Personal Care', 'Hygiene and beauty products']
]

export const categories = names.map(([name, description], i) => ({
  id: i + 1,
  name,
  description,
  color: CHART_COLORS[i % CHART_COLORS.length]
}))

export const categoryNames = categories.map((c) => c.name)
