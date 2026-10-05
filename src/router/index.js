import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, layout: 'blank', title: 'Sign in' }
  },
  {
    path: '/menu',
    name: 'public-menu',
    component: () => import('@/views/PublicMenu.vue'),
    meta: { public: true, layout: 'blank', title: 'Customer Menu' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: 'Dashboard', ability: 'viewDashboard' }
  },
  {
    path: '/pos',
    name: 'pos',
    component: () => import('@/views/POS.vue'),
    // `kiosk` → full-screen cashier mode (no sidebar / navbar / tab bar)
    meta: { title: 'POS Terminal', dense: true, layout: 'kiosk', ability: 'usePos' }
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/Products.vue'),
    meta: { title: 'Products', ability: 'viewProducts' }
  },
  {
    path: '/products/new',
    name: 'product-create',
    component: () => import('@/views/ProductCreate.vue'),
    meta: { title: 'Add Product', parent: '/products', ability: 'manageProducts' }
  },
  {
    path: '/products/:id/edit',
    name: 'product-edit',
    component: () => import('@/views/ProductEdit.vue'),
    meta: { title: 'Edit Product', parent: '/products', ability: 'manageProducts' }
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/Categories.vue'),
    meta: { title: 'Categories', ability: 'viewProducts' }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { title: 'Inventory', ability: 'viewInventory' }
  },
  {
    path: '/inventory/stock-in',
    name: 'stock-in',
    component: () => import('@/views/StockIn.vue'),
    meta: { title: 'Stock In', parent: '/inventory', ability: 'manageInventory' }
  },
  {
    path: '/inventory/stock-out',
    name: 'stock-out',
    component: () => import('@/views/StockOut.vue'),
    meta: { title: 'Stock Out', parent: '/inventory', ability: 'manageInventory' }
  },
  {
    path: '/customers',
    name: 'customers',
    component: () => import('@/views/Customers.vue'),
    meta: { title: 'Customers', ability: 'viewCustomers' }
  },
  {
    path: '/suppliers',
    name: 'suppliers',
    component: () => import('@/views/Suppliers.vue'),
    meta: { title: 'Suppliers', ability: 'viewSuppliers' }
  },
  {
    path: '/purchases',
    name: 'purchases',
    component: () => import('@/views/Purchases.vue'),
    meta: { title: 'Purchases', ability: 'managePurchases' }
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: 'Orders', ability: 'viewOrders' }
  },
  {
    path: '/discounts',
    name: 'discounts',
    component: () => import('@/views/Discounts.vue'),
    meta: { title: 'Discounts', ability: 'viewDiscounts' }
  },
  {
    path: '/discounts/new',
    name: 'discount-create',
    component: () => import('@/views/DiscountForm.vue'),
    meta: { title: 'Create Discount', parent: '/discounts', ability: 'createDiscounts' }
  },
  {
    path: '/discounts/:id/edit',
    name: 'discount-edit',
    component: () => import('@/views/DiscountForm.vue'),
    meta: { title: 'Edit Discount', parent: '/discounts', ability: 'editDiscounts' }
  },
  {
    path: '/promotions',
    name: 'promotions',
    component: () => import('@/views/Promotions.vue'),
    meta: { title: 'Promotions', ability: 'viewDiscounts' }
  },
  {
    path: '/coupons',
    name: 'coupons',
    component: () => import('@/views/Coupons.vue'),
    meta: { title: 'Coupons', ability: 'viewDiscounts' }
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/views/Expenses.vue'),
    meta: { title: 'Expenses', ability: 'viewExpenses' }
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/Reports.vue'),
    meta: { title: 'Reports', ability: 'viewReports' }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/Users.vue'),
    meta: { title: 'Users & Staff', ability: 'viewStaff' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: 'Settings', ability: 'viewSettings' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

/** First page the signed-in role is actually allowed to open. */
export function landingRouteFor(auth) {
  const order = [
    ['viewDashboard', '/dashboard'],
    ['usePos', '/pos'],
    ['viewOrders', '/orders'],
    ['viewInventory', '/inventory'],
    ['viewProducts', '/products'],
    ['viewCustomers', '/customers']
  ]
  const match = order.find(([ability]) => auth.can(ability))
  return match ? match[1] : '/orders'
}

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return landingRouteFor(auth)

  // Role guard — send users to a page they can actually use, not a dead end.
  if (to.meta.ability && auth.isAuthenticated && !auth.can(to.meta.ability)) {
    const fallback = landingRouteFor(auth)
    return to.path === fallback ? true : fallback
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'NovaPOS'} · NovaPOS`
})

export default router
