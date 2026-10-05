<script setup>
import { useI18n } from 'vue-i18n'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useSettingsStore } from '@/stores/settings'

defineProps({
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  /** [{ id, name, amount }] — itemised campaign breakdown */
  appliedDiscounts: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false }
})

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template>
  <div class="space-y-2 text-sm">
    <div class="flex justify-between text-slate-500">
      <span>{{ t('common.subtotal') }}</span>
      <span class="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
        {{ settings.money(subtotal) }}
      </span>
    </div>

    <!-- discount row only rendered when there is one -->
    <template v-if="discount > 0">
      <div class="flex justify-between">
        <span class="text-slate-500">{{ t('common.discount') }}</span>
        <span class="font-medium text-discount tabular-nums">−{{ settings.money(discount) }}</span>
      </div>
      <ul v-if="appliedDiscounts.length" class="space-y-0.5 pl-3">
        <li
          v-for="applied in appliedDiscounts"
          :key="applied.id"
          class="flex justify-between text-[11px] text-slate-400"
        >
          <span class="truncate pr-2">{{ applied.name }}</span>
          <span class="tabular-nums shrink-0">−{{ settings.money(applied.amount) }}</span>
        </li>
      </ul>
    </template>

    <div class="flex justify-between text-slate-500">
      <span>{{ t('common.tax') }} ({{ settings.taxRate }}%)</span>
      <span class="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
        {{ settings.money(tax) }}
      </span>
    </div>

    <div class="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-300 dark:border-slate-700">
      <span class="font-semibold text-slate-900 dark:text-white">{{ t('common.grandTotal') }}</span>
      <span class="font-bold text-brand-600" :class="compact ? 'text-lg' : 'text-2xl'">
        <AnimatedNumber :value="total" currency :duration="500" />
      </span>
    </div>
  </div>
</template>
