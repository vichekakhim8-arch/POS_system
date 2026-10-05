<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CartItem from './CartItem.vue'
import Icon from '@/components/ui/Icon.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useCartStore } from '@/stores/cart'
import { useAction } from '@/composables/useAction'
import { useCustomersStore } from '@/stores/customers'
import { useSettingsStore } from '@/stores/settings'
import { useDiscountsStore } from '@/stores/discounts'
import { useUiStore } from '@/stores/ui'

defineEmits(['checkout', 'close', 'discount'])

const { t } = useI18n()
const cart = useCartStore()
const { run } = useAction()
const customers = useCustomersStore()
const settings = useSettingsStore()
const discounts = useDiscountsStore()
const ui = useUiStore()

const codeInput = ref('')
const showCode = ref(false)
const clearOpen = ref(false)

const selectedCustomer = computed({
  get: () => (cart.customerId ? String(cart.customerId) : ''),
  set: (value) => cart.setCustomer(value ? Number(value) : null)
})

const discountValue = computed({
  get: () => cart.orderDiscount,
  set: (value) => cart.setOrderDiscount(value)
})

const discountType = computed({
  get: () => cart.discountType,
  set: (value) => cart.setOrderDiscount(cart.orderDiscount, value)
})

/** Nearest locked campaign → drives the unlock progress banner. */
const nextUnlock = computed(() => cart.unmetMinimums[0] || null)
const unlockProgress = computed(() => {
  if (!nextUnlock.value) return 0
  return Math.min(100, (cart.grossSubtotal / nextUnlock.value.minimumOrderAmount) * 100)
})

/** The adjustments panel is only interesting once something lives inside it. */
const adjustmentsActive = computed(
  () => discounts.appliedCodes.length > 0 || cart.orderDiscount > 0
)

const submitCode = () => {
  const result = discounts.applyCode(codeInput.value)
  ui.notify(result.message, result.ok ? 'success' : 'error')
  if (result.ok) codeInput.value = ''
}

/** Clearing wipes an open sale, so it always goes through a confirmation. */
const confirmClear = async () => {
  await run(() => cart.clear(), { message: t('common.deleting') })
  clearOpen.value = false
  ui.notify(t('pos.cartCleared'), 'success')
}
</script>

<template>
  <div class="card flex flex-col h-full w-full overflow-hidden">
    <!-- ══════════ Header ══════════ -->
    <header class="shrink-0 px-4 pt-3.5 pb-3 border-b" :style="{ borderColor: 'var(--c-border)' }">
      <div class="flex items-center gap-2">
        <h3 class="t-section text-slate-900 dark:text-white truncate">{{ t('pos.currentOrder') }}</h3>
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="opacity-0 scale-50"
        >
          <span
            v-if="cart.count"
            class="h-[20px] min-w-[20px] px-1.5 shrink-0 grid place-items-center rounded-full
                   text-[11px] font-bold tabular-nums text-white"
            :style="{ background: 'var(--c-primary)' }"
          >
            {{ cart.count }}
          </span>
        </Transition>

        <div class="ml-auto flex items-center gap-1 shrink-0">
          <button
            v-if="!cart.isEmpty"
            type="button"
            class="w-8 h-8 grid place-items-center rounded-lg text-slate-400
                   hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20"
            :title="t('pos.clearCart')"
            :aria-label="t('pos.clearCart')"
            @click="clearOpen = true"
          >
            <Icon name="trash" size="w-4 h-4" />
          </button>
          <button data-no-loader
            type="button"
            class="xl:hidden w-8 h-8 grid place-items-center rounded-lg text-slate-400
                   hover:text-slate-700 dark:hover:text-slate-200 transition
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
            :aria-label="t('common.close')"
            @click="$emit('close')"
          >
            <Icon name="x" size="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- customer -->
      <div class="input-group mt-2.5">
        <Icon name="user" size="w-4 h-4" class="input-icon" />
        <select v-model="selectedCustomer" class="field pl-10 h-10 text-[13px]">
          <option value="">{{ t('pos.walkIn') }}</option>
          <option v-for="c in customers.items" :key="c.id" :value="String(c.id)">
            {{ c.name }} — {{ c.phone }}
          </option>
        </select>
      </div>
    </header>

    <!-- ══════════ Items ══════════ -->
    <div class="grow min-h-0 overflow-y-auto px-3 py-3" :style="{ background: 'var(--c-subtle)' }">
      <div v-if="cart.isEmpty" class="h-full grid place-items-center text-center px-4 py-12">
        <div>
          <span
            class="w-16 h-16 mx-auto mb-3.5 grid place-items-center rounded-2xl
                   border border-dashed border-slate-300 dark:border-slate-700
                   text-slate-300 dark:text-slate-600"
          >
            <Icon name="cart" size="w-6 h-6" />
          </span>
          <p class="text-[13.5px] font-semibold text-slate-600 dark:text-slate-300">
            {{ t('pos.emptyCart') }}
          </p>
          <p class="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
            {{ t('pos.emptyCartHint') }}
          </p>
        </div>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="space-y-2">
        <CartItem
          v-for="line in cart.lines"
          :key="line.key"
          :line="line"
          @increase="cart.increase($event)"
          @decrease="cart.decrease($event)"
          @remove="cart.remove($event)"
          @discount="$emit('discount', $event)"
        />
      </TransitionGroup>
    </div>

    <!-- ══════════ Footer ══════════ -->
    <footer
      class="shrink-0 border-t px-4 pt-4 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      :style="{ borderColor: 'var(--c-border)' }"
    >
      <!-- unlock progress -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="nextUnlock"
          class="rounded-xl px-3 py-2.5"
          :style="{ background: 'color-mix(in srgb, var(--c-warning) 11%, transparent)' }"
        >
          <div class="flex items-center gap-2">
            <Icon name="sparkles" size="w-3.5 h-3.5" class="shrink-0" :style="{ color: 'var(--c-warning)' }" />
            <p class="text-[11.5px] font-semibold leading-tight" :style="{ color: 'var(--c-warning)' }">
              {{ t('pos.unlockHint', { amount: settings.money(nextUnlock.remaining), name: nextUnlock.name }) }}
            </p>
          </div>
          <div class="mt-2 h-1.5 rounded-full overflow-hidden" :style="{ background: 'var(--c-border)' }">
            <div
              class="h-full rounded-full transition-[width] duration-500 ease-out"
              :style="{ width: `${unlockProgress}%`, background: 'var(--c-warning)' }"
            />
          </div>
        </div>
      </Transition>

      <!-- applied codes -->
      <div v-if="discounts.appliedCodes.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="code in discounts.appliedCodes"
          :key="code"
          class="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-[11px] font-bold font-mono"
          :style="{
            background: 'color-mix(in srgb, var(--c-primary) 11%, transparent)',
            color: 'var(--c-primary)'
          }"
        >
          {{ code }}
          <button data-no-loader
            type="button"
            class="grid place-items-center hover:text-rose-500 transition"
            :aria-label="t('pos.removeCode', { code })"
            @click="discounts.removeCode(code)"
          >
            <Icon name="x" size="w-3 h-3" />
          </button>
        </span>
      </div>

      <!-- promo + manual discount, collapsed by default to reduce noise -->
      <button data-no-loader
        type="button"
        class="w-full flex items-center gap-2 h-9 px-2.5 rounded-lg text-[12px] font-semibold
               text-slate-500 hover:text-brand-600 hover:bg-surface-subtle transition
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        <Icon name="tag" size="w-3.5 h-3.5" />
        {{ t('pos.discountAdjustments') }}
        <span
          v-if="adjustmentsActive && !showCode"
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :style="{ background: 'var(--c-primary)' }"
        />
        <Icon
          name="chevronRight"
          size="w-3.5 h-3.5"
          class="ml-auto transition-transform duration-300"
          :class="showCode ? '-rotate-90' : 'rotate-90'"
        />
      </button>

      <div
        class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        :style="{ gridTemplateRows: showCode ? '1fr' : '0fr', opacity: showCode ? 1 : 0 }"
      >
        <div class="overflow-hidden min-h-0">
          <div class="space-y-2 pt-0.5">
            <div class="flex gap-2">
              <div class="input-group grow">
                <Icon name="sparkles" size="w-4 h-4" class="input-icon !left-3" />
                <input
                  v-model="codeInput"
                  class="field pl-9 h-10 text-[13px] uppercase"
                  :placeholder="t('pos.enterCode')"
                  :aria-label="t('pos.enterCode')"
                  @keyup.enter="submitCode"
                />
              </div>
              <button data-no-loader
                type="button"
                class="h-10 px-4 rounded-xl text-[13px] font-semibold text-white transition
                       hover:brightness-95 active:scale-[.97] shrink-0
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
                :style="{ background: 'var(--c-primary)' }"
                @click="submitCode"
              >
                {{ t('pos.applyCode') }}
              </button>
            </div>

            <div class="flex items-center gap-2">
              <label
                for="cart-order-discount"
                class="text-[11px] font-semibold text-slate-400 shrink-0 w-[92px]"
              >
                {{ t('pos.orderDiscount') }}
              </label>
              <input
                id="cart-order-discount"
                v-model.number="discountValue"
                type="number"
                min="0"
                class="field h-10 py-0 text-right text-[13px]"
                :aria-label="t('pos.orderDiscount')"
              />
              <select
                v-model="discountType"
                class="field h-10 py-0 w-[64px] text-[13px]"
                :aria-label="`${t('pos.orderDiscount')} type`"
              >
                <option value="amount">{{ settings.currency }}</option>
                <option value="percent">%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- summary -->
      <dl
        class="space-y-1.5 rounded-xl px-3 py-2.5"
        :style="{ background: 'var(--c-subtle)' }"
      >
        <div class="flex justify-between gap-3 text-[13px]">
          <dt class="text-slate-500">{{ t('common.subtotal') }}</dt>
          <dd class="font-medium text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
            {{ settings.money(cart.subtotal) }}
          </dd>
        </div>

        <template v-if="cart.discount > 0">
          <div class="flex justify-between gap-3 text-[13px]">
            <dt class="text-slate-500">{{ t('common.discount') }}</dt>
            <dd class="font-semibold tabular-nums shrink-0" :style="{ color: 'var(--pos-discount)' }">
              −{{ settings.money(cart.discount) }}
            </dd>
          </div>
          <div
            v-for="applied in cart.appliedDiscounts"
            :key="applied.id"
            class="flex justify-between gap-3 text-[11px] pl-3"
          >
            <dt class="text-slate-400 truncate">{{ applied.name }}</dt>
            <dd class="text-slate-400 tabular-nums shrink-0">−{{ settings.money(applied.amount) }}</dd>
          </div>
        </template>

        <div class="flex justify-between gap-3 text-[13px]">
          <dt class="text-slate-500">{{ t('common.tax') }} ({{ settings.taxRate }}%)</dt>
          <dd class="font-medium text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
            {{ settings.money(cart.tax) }}
          </dd>
        </div>
      </dl>

      <!-- grand total -->
      <div class="flex items-end justify-between gap-3">
        <span class="text-[13px] font-semibold text-slate-600 dark:text-slate-300 pb-1">
          {{ t('common.grandTotal') }}
        </span>
        <span class="text-[26px] font-bold leading-none tabular-nums" :style="{ color: 'var(--c-primary)' }">
          <AnimatedNumber :value="cart.total" currency :duration="450" />
        </span>
      </div>

      <button
        type="button"
        class="w-full h-[52px] rounded-2xl text-[15px] font-bold text-white
               inline-flex items-center justify-center gap-2 transition
               hover:brightness-95 active:scale-[.985]
               disabled:opacity-35 disabled:active:scale-100 disabled:cursor-not-allowed
               focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        :style="{
          background: 'var(--c-primary)',
          boxShadow: cart.isEmpty
            ? 'none'
            : '0 8px 20px -8px color-mix(in srgb, var(--c-primary) 70%, transparent)'
        }"
        :disabled="cart.isEmpty"
        @click="$emit('checkout')"
      >
        <Icon name="check" size="w-5 h-5" stroke-width="2.5" />
        {{ t('pos.checkout') }}
        <span v-if="!cart.isEmpty" class="font-medium opacity-80 tabular-nums">
          {{ settings.money(cart.total) }}
        </span>
      </button>
    </footer>

    <!-- Clearing the order is destructive, so it always asks first -->
    <ConfirmDialog
      :open="clearOpen"
      :title="t('pos.clearCartTitle')"
      :confirm-label="t('pos.clearCart')"
      :cancel-label="t('common.cancel')"
      :count="0"
      @close="clearOpen = false"
      @confirm="confirmClear"
    >
      {{ t('pos.clearCartMessage', { count: cart.count, total: settings.money(cart.total) }) }}
    </ConfirmDialog>
  </div>
</template>
