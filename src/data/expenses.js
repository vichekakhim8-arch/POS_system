import { daysAgo, randomInt, round2 } from '@/utils/helpers'

export const expenseCategories = ['Rent', 'Electricity', 'Salary', 'Transportation', 'Other']

const base = {
  Rent: ['Monthly store rent', 1200],
  Electricity: ['Electricity bill', 260],
  Salary: ['Staff salary', 2400],
  Transportation: ['Delivery fuel', 95],
  Other: ['Office supplies', 140]
}

export const expenses = Array.from({ length: 15 }, (_, i) => {
  const category = expenseCategories[i % expenseCategories.length]
  const [name, amount] = base[category]
  return {
    id: `EXP-${301 + i}`,
    name,
    category,
    amount: round2(amount * (0.8 + Math.random() * 0.5)),
    date: daysAgo(randomInt(0, 40)),
    note: 'Recorded by finance team'
  }
}).sort((a, b) => b.date.localeCompare(a.date))
