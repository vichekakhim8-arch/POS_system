<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SearchProduct from '@/components/pos/SearchProduct.vue'
import CategoryTabs from '@/components/pos/CategoryTabs.vue'
import ProductGrid from '@/components/pos/ProductGrid.vue'
import Cart from '@/components/pos/Cart.vue'
import CheckoutModal from '@/components/pos/CheckoutModal.vue'
import PaymentModal from '@/components/pos/PaymentModal.vue'
import PaymentSuccessModal from '@/components/pos/PaymentSuccessModal.vue'
import ReceiptModal from '@/components/pos/ReceiptModal.vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Icon from '@/components/ui/Icon.vue'
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import { useOrdersStore } from '@/stores/orders'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher.vue'
import { downloadFile } from '@/utils/helpers'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const router = useRouter()
const { t } = useI18n()
const cart = useCartStore()
const products = useProductsStore()
const orders = useOrdersStore()
const settings = useSettingsStore()
const ui = useUiStore()
const auth = useAuthStore()
const theme = useThemeStore()
const { run } = useAction()

const search = ref('')
const activeCategory = ref('All')
const mobileCartOpen = ref(false)

/** Short skeleton pass so the terminal never flashes an empty grid. */
const { loading } = useAsyncView('pos', null, { minMs: 200 })

const checkoutOpen = ref(false)
const paymentOpen = ref(false)
const successOpen = ref(false)
const receiptOpen = ref(false)
const processing = ref(false)
const discountItem = ref(null)
const discountValue = ref(0)

const lastOrder = computed(() => orders.lastOrder)

/** Leave kiosk mode. An open sale asks for confirmation in-app (no native alert). */
const exitConfirm = ref(false)

const exitPos = () => {
  if (cart.isEmpty) return router.push('/dashboard')
  exitConfirm.value = true
}

const leaveAndKeep = () => {
  exitConfirm.value = false
  router.push('/dashboard')
}

const leaveAndClear = () => {
  cart.clear()
  exitConfirm.value = false
  ui.notify('Sale discarded')
  router.push('/dashboard')
}

const visibleProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.items.filter((p) => {
    const matchCategory = activeCategory.value === 'All' || p.category === activeCategory.value
    const matchTerm =
      !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    return matchCategory && matchTerm
  })
})

const addToCart = (product) => {
  const result = cart.addProduct(product)
  ui.notify(result.message, result.ok ? 'success' : 'error')
}

const quickAddFirstMatch = () => {
  const [first] = visibleProducts.value
  if (first) {
    addToCart(first)
    search.value = ''
  }
}

const openCheckout = () => {
  if (cart.isEmpty) return ui.notify(t('pos.emptyCart'), 'error')
  mobileCartOpen.value = false
  checkoutOpen.value = true
}

const proceedToPayment = () => {
  checkoutOpen.value = false
  paymentOpen.value = true
}

const openItemDiscount = (line) => {
  discountItem.value = line
  discountValue.value = line.discount || 0
}

const applyItemDiscount = () => {
  cart.setItemDiscount(discountItem.value.key, discountValue.value)
  ui.notify(t('pos.itemDiscount'))
  discountItem.value = null
}

const confirmPayment = async ({ method, paid, change }) => {
  processing.value = true
  const snapshot = cart.snapshot()
  await run(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          const order = orders.createOrder({ snapshot, method, paid, change })
          processing.value = false
          paymentOpen.value = false
          successOpen.value = true
          ui.notify(`${t('pos.success')} - ${order.id}`)
          resolve(order)
        }, 650)
      }),
    { message: t('pos.processingPayment', 'Processing payment…'), minMs: 650 }
  )
}

const printReceipt = () => {
  successOpen.value = false
  receiptOpen.value = true
  nextTick(() => setTimeout(() => window.print(), 350))
}

const downloadReceipt = () => {
  const order = lastOrder.value
  if (!order) return
  const pad = (l, r) => `${String(l).padEnd(28)}${String(r).padStart(12)}`
  const lines = [
    settings.store,
    settings.address,
    `Tel: ${settings.phone}`,
    '',
    `Receipt : ${order.id}`,
    `Date    : ${order.date} ${order.time}`,
    `Cashier : ${order.cashier}`,
    `Customer: ${order.customer}`,
    '-'.repeat(40),
    ...order.items.map((i) =>
      pad(`${i.qty} x ${i.name}`, settings.money((i.price - (i.discount || 0)) * i.qty))
    ),
    '-'.repeat(40),
    pad('Subtotal', settings.money(order.subtotal)),
    pad('Discount', `-${settings.money(order.discount)}`),
    pad(`Tax (${settings.taxRate}%)`, settings.money(order.tax)),
    pad('TOTAL', settings.money(order.total)),
    pad(`Paid (${order.method})`, settings.money(order.paid)),
    pad('Change', settings.money(order.change)),
    '',
    settings.receiptFooter
  ]
  downloadFile(`${order.id}.txt`, lines.join('\n'))
  ui.notify(t('common.download'))
}

const newSale = () => {
  cart.clear()
  orders.clearLastOrder()
  successOpen.value = false
  receiptOpen.value = false
  search.value = ''
  activeCategory.value = 'All'
  ui.notify(t('pos.newSale'))
}
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden" @keydown.esc.window="mobileCartOpen = false">
    <!-- ══════════ Kiosk header: back + store + controls ══════════ -->
    <header
      class="h-14 shrink-0 flex items-center gap-2 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800"
      :style="{ background: 'var(--c-navbar)' }"
    >
      <button
        type="button"
        class="inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-xl border-0 text-[13px] font-semibold
               text-slate-600 dark:text-slate-300 transition hover:text-brand-600 active:scale-[.98]
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :style="{ background: 'var(--c-field-fill)' }"
        @click="exitPos"
      >
        <Icon name="chevronRight" size="w-4 h-4" class="rotate-180" />
        <span class="hidden sm:inline">{{ t('nav.dashboard') }}</span>
        <span class="sm:hidden">Back</span>
      </button>

      <div class="flex items-center gap-2 min-w-0 ml-1">
        <span
          class="w-8 h-8 rounded-xl grid place-items-center text-white shrink-0"
          :style="{ background: 'var(--c-primary)' }"
        >
          <Icon name="pos" size="w-4 h-4" />
        </span>
        <div class="min-w-0 hidden sm:block">
          <p class="text-[13.5px] font-semibold text-slate-900 dark:text-white leading-none truncate">
            {{ t('pos.title') }}
          </p>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ settings.store }}</p>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-1.5">
        <span
          class="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-medium text-slate-500"
          :style="{ background: 'var(--c-field-fill)' }"
        >
          <Icon name="user" size="w-3.5 h-3.5" />
          {{ auth.user?.name }}
        </span>
        <CurrencySwitcher />
        <button
          type="button"
          class="w-9 h-9 grid place-items-center rounded-xl text-slate-500 transition hover:text-brand-600"
          :style="{ background: 'var(--c-field-fill)' }"
          :aria-label="theme.isDark ? 'Light mode' : 'Dark mode'"
          @click="theme.toggleMode()"
        >
          <Icon :name="theme.isDark ? 'sun' : 'moon'" size="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="grow min-h-0 flex flex-col xl:flex-row gap-3 p-3">
    <!-- Browser -->
    <section class="grow flex flex-col min-w-0">
      <div class="card p-3 sm:p-4 shrink-0">
        <SearchProduct v-model="search" :placeholder="t('pos.searchPlaceholder')" @submit="quickAddFirstMatch" />
        <CategoryTabs v-model="activeCategory" :categories="products.categoryTabs" class="mt-3" />
      </div>

      <div class="flex items-center justify-between gap-3 px-1 mt-4 mb-2.5 shrink-0">
        <p class="text-xs font-medium text-slate-400 tabular-nums truncate">
          {{ t('pos.productsCount', { count: visibleProducts.length }) }}
          <span v-if="activeCategory !== 'All'" class="text-slate-500"> · {{ activeCategory }}</span>
        </p>
        <button
          v-if="search || activeCategory !== 'All'"
          class="text-xs font-semibold text-brand-600 hover:underline shrink-0"
          @click="search = ''; activeCategory = 'All'"
        >
          {{ t('pos.clearFilters') }}
        </button>
      </div>

      <div class="grow overflow-y-auto overflow-x-hidden pb-24 xl:pb-2 -mx-1 px-1">
        <ProductGrid :products="visibleProducts" :loading="loading" @add="addToCart" />
      </div>
    </section>

    <!-- Cart — modal sheet below xl (backdrop click / Esc / ✕ all dismiss it) -->
    <aside
      v-if="mobileCartOpen"
      class="xl:hidden fixed inset-0 z-40 p-2 sm:p-3 bg-slate-900/50 backdrop-blur-sm flex"
      role="dialog"
      aria-modal="true"
      :aria-label="t('pos.currentOrder')"
      @click.self="mobileCartOpen = false"
    >
      <Cart @checkout="openCheckout" @close="mobileCartOpen = false" @discount="openItemDiscount" />
    </aside>

    <!-- Cart — docked panel from xl up -->
    <aside class="hidden xl:block xl:w-[386px] 2xl:w-[420px] shrink-0">
      <Cart @checkout="openCheckout" @discount="openItemDiscount" />
    </aside>

    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-6 opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="translate-y-6 opacity-0"
    >
      <button
        v-if="!mobileCartOpen && !cart.isEmpty"
        type="button"
        class="xl:hidden fixed left-3 right-3 z-30 text-white rounded-2xl
               px-5 py-3.5 flex items-center justify-between gap-3 shadow-xl
               active:scale-[.99] transition
               focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
        :style="{
          background: 'var(--c-primary)',
          bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'
        }"
        @click="mobileCartOpen = true"
      >
        <span class="flex items-center gap-2 font-semibold min-w-0">
          <Icon name="cart" size="w-5 h-5" class="shrink-0" />
          <span class="truncate">{{ t('pos.viewOrder') }}</span>
          <span class="shrink-0 opacity-80 tabular-nums">{{ cart.count }}</span>
        </span>
        <span class="font-bold text-lg tabular-nums shrink-0">{{ settings.money(cart.total) }}</span>
      </button>
    </Transition>

    <Modal :open="!!discountItem" :title="t('pos.itemDiscount')" size="max-w-sm" @close="discountItem = null">
      <div v-if="discountItem">
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {{ discountItem.name }} — {{ settings.money(discountItem.price) }}
        </p>
        <Input
          v-model.number="discountValue"
          :label="`${t('common.discount')} (${settings.currency})`"
          type="number"
          min="0"
          :max="discountItem.price"
          :hint="t('pos.itemDiscountHint')"
        />
      </div>
      <template #footer>
        <Button block @click="applyItemDiscount">{{ t('common.confirm') }}</Button>
      </template>
    </Modal>

    </div>

    <!-- Leaving POS with an open sale -->
    <Modal
      :open="exitConfirm"
      title="Leave POS terminal?"
      size="max-w-sm"
      @close="exitConfirm = false"
    >
      <div class="flex gap-4">
        <span
          class="w-11 h-11 shrink-0 grid place-items-center rounded-xl"
          :style="{
            background: 'color-mix(in srgb, var(--c-warning) 14%, transparent)',
            color: 'var(--c-warning)'
          }"
        >
          <Icon name="cart" size="w-5 h-5" />
        </span>
        <div class="min-w-0">
          <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            You have <b>{{ cart.count }}</b> {{ cart.count === 1 ? 'item' : 'items' }} worth
            <b>{{ settings.money(cart.total) }}</b> in the current order.
          </p>
          <p class="mt-2 text-xs text-slate-400">
            The sale is kept so you can resume it when you return.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <Button variant="secondary" block @click="exitConfirm = false">Stay here</Button>
            <Button block icon="chevronRight" @click="leaveAndKeep">Leave &amp; keep sale</Button>
          </div>
          <button
            type="button"
            class="w-full h-9 rounded-xl text-[13px] font-semibold text-slate-400
                   hover:text-rose-600 transition"
            @click="leaveAndClear"
          >
            Discard sale and leave
          </button>
        </div>
      </template>
    </Modal>

    <CheckoutModal :open="checkoutOpen" @close="checkoutOpen = false" @proceed="proceedToPayment" />
    <PaymentModal
      :open="paymentOpen"
      :total="cart.total"
      :processing="processing"
      @close="paymentOpen = false"
      @confirm="confirmPayment"
    />
    <PaymentSuccessModal
      :open="successOpen"
      :order="lastOrder"
      @print="printReceipt"
      @download="downloadReceipt"
      @new-sale="newSale"
    />
    <ReceiptModal
      :open="receiptOpen"
      :order="lastOrder"
      @close="receiptOpen = false"
      @download="downloadReceipt"
    />
  </div>
</template>
