/**
 * Navigation tree. Every link declares the ability required to see it, so the
 * sidebar, mobile tab bar and "More" sheet all derive from this one source.
 */
export const navigation = [
  {
    id: 'main',
    labelKey: 'nav.main',
    icon: 'dashboard',
    links: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', ability: 'viewDashboard' },
      { to: '/pos', labelKey: 'nav.pos', icon: 'pos', badge: 'cart', ability: 'usePos' }
    ]
  },
  {
    id: 'catalogue',
    labelKey: 'nav.catalogue',
    icon: 'box',
    links: [
      { to: '/products', labelKey: 'nav.products', icon: 'box', ability: 'viewProducts' },
      { to: '/categories', labelKey: 'nav.categories', icon: 'tag', ability: 'viewProducts' },
      { to: '/inventory', labelKey: 'nav.inventory', icon: 'layers', ability: 'viewInventory' },
      { to: '/inventory/stock-in', labelKey: 'nav.stockIn', icon: 'arrowDown', ability: 'manageInventory' },
      { to: '/inventory/stock-out', labelKey: 'nav.stockOut', icon: 'arrowUp', ability: 'manageInventory' }
    ]
  },
  {
    id: 'sales',
    labelKey: 'nav.sales',
    icon: 'clipboard',
    links: [
      { to: '/orders', labelKey: 'nav.orders', icon: 'clipboard', ability: 'viewOrders' },
      { to: '/customers', labelKey: 'nav.customers', icon: 'users', ability: 'viewCustomers' }
    ]
  },
  {
    id: 'purchasing',
    labelKey: 'nav.purchasing',
    icon: 'truck',
    links: [
      { to: '/suppliers', labelKey: 'nav.suppliers', icon: 'truck', ability: 'viewSuppliers' },
      { to: '/purchases', labelKey: 'nav.purchases', icon: 'cart', ability: 'managePurchases' }
    ]
  },
  {
    id: 'marketing',
    labelKey: 'nav.marketing',
    icon: 'sparkles',
    links: [
      { to: '/discounts', labelKey: 'nav.discounts', icon: 'sparkles', ability: 'viewDiscounts' },
      { to: '/promotions', labelKey: 'nav.promotions', icon: 'tag', ability: 'viewDiscounts' },
      { to: '/coupons', labelKey: 'nav.coupons', icon: 'qr', ability: 'viewDiscounts' }
    ]
  },
  {
    id: 'finance',
    labelKey: 'nav.finance',
    icon: 'wallet',
    links: [
      { to: '/expenses', labelKey: 'nav.expenses', icon: 'wallet', ability: 'viewExpenses' },
      { to: '/reports', labelKey: 'nav.reports', icon: 'chart', ability: 'viewReports' }
    ]
  },
  {
    id: 'admin',
    labelKey: 'nav.administration',
    icon: 'shield',
    links: [
      { to: '/users', labelKey: 'nav.users', icon: 'shield', ability: 'viewStaff' },
      { to: '/settings', labelKey: 'nav.settings', icon: 'gear', ability: 'viewSettings' }
    ]
  }
]

export const flatNavigation = navigation.flatMap((group) => group.links)

export const findLink = (path) =>
  flatNavigation
    .filter((l) => path === l.to || path.startsWith(`${l.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]

/**
 * Bottom tab bar destinations, resolved per role at runtime.
 * Kitchen never sees POS; Cashier never sees Reports — each role still gets
 * four meaningful tabs plus "More".
 */
export const mobileTabsFor = (can) =>
  [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', ability: 'viewDashboard' },
    { to: '/pos', labelKey: 'nav.pos', icon: 'pos', badge: true, ability: 'usePos' },
    { to: '/orders', labelKey: 'nav.orders', icon: 'clipboard', ability: 'viewOrders' },
    { to: '/products', labelKey: 'nav.products', icon: 'box', ability: 'viewProducts' },
    { to: '/inventory', labelKey: 'nav.inventory', icon: 'layers', ability: 'viewInventory' },
    { to: '/customers', labelKey: 'nav.customers', icon: 'users', ability: 'viewCustomers' }
  ]
    .filter((tab) => can(tab.ability))
    .slice(0, 4)
