import { daysAgo } from '@/utils/helpers'

const names = [
  'Sophea Chan',
  'Dara Kim',
  'Nita Sok',
  'Vuthy Long',
  'Lina Pich',
  'Rath Meas',
  'Chenda Yim',
  'Bopha Neang'
]

const cities = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampot']

export const customers = names.map((name, i) => ({
  id: i + 1,
  name,
  phone: `+855 9${String(10000000 + i * 732190).slice(0, 8)}`,
  email: `${name.toLowerCase().replace(/ /g, '.')}@mail.com`,
  address: `${cities[i % cities.length]}, Cambodia`,
  joined: daysAgo(300 - i * 20)
}))
