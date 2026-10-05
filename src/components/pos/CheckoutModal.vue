<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import OrderSummary from './OrderSummary.vue'
import { useCartStore } from '@/stores/cart'
import { useCustomersStore } from '@/stores/customers'
import { useSettingsStore } from '@/stores/settings'
import { initials } from '@/utils/helpers'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'proceed'])

const { t } = useI18n()
const cart = useCartStore()
const customers = useCustomersStore()
const settings = useSettingsStore()

const customer = computed(() => (cart.customerId ? customers.byId(cart.customerId) : null))
</script>

<template>
  <Modal :open="open" :title="t('pos.checkout')" size="max-w-lg" @close="emit('close')">
    <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
      <span
        class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold"
      >
        <template v-if="customer">{{ initials(customer.name) }}</template>
        <Icon v-else name="user" />
      </span>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {{ customer ? customer.name : t('pos.walkIn') }}
        </p>
        <p class="text-xs text-slate-400 truncate">{{ customer ? customer.phone : '—' }}</p>
      </div>
      <span class="ml-auto text-xs font-semibold text-slate-400">{{ cart.count }} items</span>
    </div>

    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-2">
      {{ t('pos.currentOrder') }}
    </p>
    <ul class="max-h-56 overflow-y-auto space-y-2 pr-1">
      <li v-for="line in cart.lines" :key="line.key" class="flex items-center gap-3 text-sm">
        <img :src="line.image" :alt="line.name" class="w-9 h-9 rounded-lg object-cover shrink-0" />
        <span class="grow min-w-0">
          <span class="block truncate text-slate-600 dark:text-slate-300">
            {{ line.qty }} × {{ line.name }}
          </span>
          <span v-if="line.discountName" class="block text-[11px] text-discount truncate">
            {{ line.discountName }} · −{{ settings.money(line.lineDiscount) }}
          </span>
        </span>
        <span class="text-right shrink-0">
          <span class="block font-semibold text-slate-900 dark:text-white">
            {{ settings.money(line.lineTotal) }}
          </span>
          <span v-if="line.lineDiscount > 0" class="block text-[11px] line-through text-slate-400">
            {{ settings.money(line.lineOriginal) }}
          </span>
        </span>
      </li>
    </ul>

    <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
      <OrderSummary
        compact
        :subtotal="cart.subtotal"
        :discount="cart.discount"
        :tax="cart.tax"
        :total="cart.total"
        :applied-discounts="cart.appliedDiscounts"
      />
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button variant="secondary" block @click="emit('close')">{{ t('pos.backToCart') }}</Button>
        <Button block icon-right="chevronRight" @click="emit('proceed')">{{ t('pos.continuePayment') }}</Button>
      </div>
    </template>
  </Modal>
</template>
