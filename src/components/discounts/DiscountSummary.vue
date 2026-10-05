<script setup>
import { computed } from 'vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useDiscountsStore } from '@/stores/discounts'
import { shortDate } from '@/utils/helpers'

const props = defineProps({
  discount: { type: Object, required: true }
})

const products = useProductsStore()
const settings = useSettingsStore()
const discounts = useDiscountsStore()

const label = computed(() =>
  props.discount.type === 'percentage'
    ? `${props.discount.value}% OFF`
    : `${settings.money(props.discount.value)} OFF`
)

const targets = computed(() => {
  const d = props.discount
  if (d.applyTo === 'all') return ['All products']
  if (d.applyTo === 'categories')
    return d.categoryIds.map((id) => products.categories.find((c) => c.id === id)?.name).filter(Boolean)
  if (d.applyTo === 'products')
    return d.productIds.map((id) => products.byId(id)?.name).filter(Boolean)
  return d.variantIds
    .map((vid) => {
      const product = products.items.find((p) => (p.variants || []).some((v) => v.id === vid))
      const variant = product?.variants.find((v) => v.id === vid)
      return product && variant ? `${product.name} · ${variant.name}` : null
    })
    .filter(Boolean)
})

const affected = computed(() =>
  products.items.filter((p) => discounts.discountForProduct(p)?.id === props.discount.id).length
)

const conditions = computed(() => {
  const d = props.discount
  const out = []
  if (d.minimumOrderAmount > 0) out.push(['Minimum order', settings.money(d.minimumOrderAmount)])
  if (d.maximumDiscount) out.push(['Maximum discount', settings.money(d.maximumDiscount)])
  if (d.usageLimit) out.push(['Usage limit', `${d.usageCount} / ${d.usageLimit}`])
  if (d.perCustomerLimit) out.push(['Per customer limit', d.perCustomerLimit])
  return out
})
</script>

<template>
  <div class="space-y-5">
    <!-- hero -->
    <div class="flex items-center gap-4 p-4 rounded-2xl bg-surface-subtle">
      <span
        class="w-14 h-14 rounded-2xl bg-brand-600 text-white flex flex-col items-center justify-center shrink-0 leading-none"
      >
        <span class="text-base font-bold">
          {{ discount.type === 'percentage' ? `${discount.value}%` : settings.money(discount.value) }}
        </span>
        <span class="text-[9px] font-bold tracking-wider opacity-80">OFF</span>
      </span>
      <div class="min-w-0 grow">
        <p class="font-semibold text-slate-900 dark:text-white truncate">{{ discount.name }}</p>
        <p class="text-xs text-slate-400 truncate">{{ discount.description || label }}</p>
      </div>
      <Badge :type="discount.status" dot />
    </div>

    <!-- schedule -->
    <dl class="grid sm:grid-cols-2 gap-3 text-sm">
      <div>
        <dt class="text-xs text-slate-400">Schedule</dt>
        <dd class="font-medium text-slate-800 dark:text-slate-100">
          {{ discount.startDate ? `${shortDate(discount.startDate)} → ${shortDate(discount.endDate)}` : 'Not scheduled' }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-slate-400">Daily window</dt>
        <dd class="font-medium text-slate-800 dark:text-slate-100">
          {{ discount.startTime }} – {{ discount.endTime }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-slate-400">Discount code</dt>
        <dd class="font-medium text-slate-800 dark:text-slate-100">
          <span v-if="discount.code" class="font-mono">{{ discount.code }}</span>
          <span v-else>Automatic</span>
          <span v-if="discount.requiresCode" class="text-xs text-slate-400"> · required</span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-slate-400">Times used</dt>
        <dd class="font-medium text-slate-800 dark:text-slate-100">{{ discount.usageCount }}</dd>
      </div>
    </dl>

    <!-- targets -->
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Applies to · {{ affected }} live products
      </p>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="target in targets"
          :key="target"
          class="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 text-xs font-medium"
        >
          {{ target }}
        </span>
        <span v-if="!targets.length" class="text-xs text-slate-400">Nothing selected yet</span>
      </div>
    </div>

    <!-- conditions -->
    <div v-if="conditions.length">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Conditions</p>
      <ul class="space-y-1.5 text-sm">
        <li v-for="[key, value] in conditions" :key="key" class="flex justify-between gap-3">
          <span class="text-slate-500">{{ key }}</span>
          <span class="font-medium text-slate-800 dark:text-slate-100">{{ value }}</span>
        </li>
      </ul>
    </div>

    <p class="flex items-start gap-2 text-xs text-slate-400">
      <Icon name="shield" size="w-4 h-4" class="shrink-0 mt-0.5" />
      Discount stacking is disabled — each product receives only its highest-priority discount.
    </p>
  </div>
</template>
