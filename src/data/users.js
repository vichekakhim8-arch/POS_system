import { daysAgo } from '@/utils/helpers'

export const users = [
  {
    id: 1,
    name: 'Alex Morgan',
    email: 'admin@novapos.io',
    phone: '+855 92 884 112',
    role: 'Admin',
    status: 'Active',
    joined: daysAgo(420)
  },
  {
    id: 2,
    name: 'Sophea Chan',
    email: 'manager@novapos.io',
    phone: '+855 96 441 221',
    role: 'Manager',
    status: 'Active',
    joined: daysAgo(260)
  },
  {
    id: 3,
    name: 'Dara Kim',
    email: 'cashier@novapos.io',
    phone: '+855 70 118 335',
    role: 'Cashier',
    status: 'Active',
    joined: daysAgo(120)
  },
  {
    id: 4,
    name: 'Nita Sok',
    email: 'nita@novapos.io',
    phone: '+855 89 663 004',
    role: 'Cashier',
    status: 'Inactive',
    joined: daysAgo(60)
  },
  {
    id: 5,
    name: 'Vuthy Long',
    email: 'kitchen@novapos.io',
    phone: '+855 93 220 887',
    role: 'Kitchen',
    status: 'Active',
    joined: daysAgo(45)
  }
]

export const rolePermissions = {
  Owner: ['Full access to every module', 'Manage staff, roles and settings', 'Delete any record'],
  Admin: ['Full access to every module', 'Manage staff and settings', 'Create and edit discounts'],
  Manager: ['POS and orders', 'Products and inventory', 'Purchasing and expenses', 'Reports and marketing'],
  Cashier: ['POS and checkout', 'View orders and products', 'Manage customers'],
  Kitchen: ['View order queue', 'View stock levels']
}

/**
 * Capability matrix — the single source of truth for what each role can do.
 * UI hides unauthorised actions; the router guards unauthorised pages.
 */
const ALL = [
  'viewDashboard',
  'usePos',
  'viewProducts', 'manageProducts',
  'viewInventory', 'manageInventory',
  'viewOrders', 'refundOrders',
  'viewCustomers', 'manageCustomers',
  'viewSuppliers', 'managePurchases',
  'viewDiscounts', 'createDiscounts', 'editDiscounts', 'deleteDiscounts', 'toggleDiscounts',
  'viewExpenses', 'manageExpenses',
  'viewReports',
  'viewStaff', 'manageStaff',
  'viewSettings', 'manageSettings'
]

const grant = (keys) => Object.fromEntries(ALL.map((k) => [k, keys.includes(k)]))

export const roleAbilities = {
  /** Full access. */
  Owner: Object.fromEntries(ALL.map((k) => [k, true])),

  /** Everything except deleting discounts and billing-level settings. */
  Admin: grant(ALL.filter((k) => k !== 'deleteDiscounts')),

  /** Runs the floor: products, stock, orders, promos, reports — no staff/settings. */
  Manager: grant([
    'viewDashboard', 'usePos',
    'viewProducts', 'manageProducts',
    'viewInventory', 'manageInventory',
    'viewOrders', 'refundOrders',
    'viewCustomers', 'manageCustomers',
    'viewSuppliers', 'managePurchases',
    'viewDiscounts', 'createDiscounts', 'editDiscounts', 'toggleDiscounts',
    'viewExpenses', 'manageExpenses',
    'viewReports',
    'viewStaff'
  ]),

  /** Sells and serves customers. Read-only elsewhere. */
  Cashier: grant([
    'viewDashboard', 'usePos',
    'viewProducts',
    'viewInventory',
    'viewOrders',
    'viewCustomers', 'manageCustomers',
    'viewDiscounts'
  ]),

  /** Prep station: order queue only, no money and no catalogue edits. */
  Kitchen: grant(['viewOrders', 'viewInventory'])
}
