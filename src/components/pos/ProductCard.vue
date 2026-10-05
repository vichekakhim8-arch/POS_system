<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useDiscountsStore } from '@/stores/discounts'
import { useCartStore } from '@/stores/cart'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({
  product: { type: Object, required: true }
})

defineEmits(['add'])

const { t } = useI18n()
const settings = useSettingsStore()
const discounts = useDiscountsStore()
const cart = useCartStore()

const imageFailed = ref(false)
watch(() => props.product.image, () => (imageFailed.value = false))

const outOfStock = computed(() => props.product.stock <= 0)
const lowStock = computed(() => props.product.stock > 0 && props.product.stock <= props.product.lowStock)

/**
 * Shared discount engine — no pricing logic duplicated here.
 * The cart's gross value is passed in so a campaign with a minimum spend
 * shows as "locked" on the card until the cart actually qualifies.
 */
const pricing = computed(() =>
  discounts.priceFor(props.product, null, { orderTotal: cart.grossSubtotal })
)
const hasDiscount = computed(() => pricing.value.unitDiscount > 0)
const locked = computed(() => pricing.value.locked)
const badge = computed(() =>
  pricing.value.discount?.type === 'fixed'
    ? `−${settings.money(pricing.value.unitDiscount)}`
    : `−${pricing.value.percentOff}%`
)
</script>

<template>
  <button
    type="button"
    data-no-loader
    class="group relative flex flex-col text-left overflow-hidden bg-white dark:bg-slate-900
           border border-slate-200 dark:border-slate-800 transition-all duration-200
           hover:border-brand-400 hover:shadow-[0_10px_30px_-12px_rgb(15_23_42/.25)] hover:-translate-y-0.5
           focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25
           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
    :style="{ borderRadius: 'var(--radius-2xl)' }"
    :disabled="outOfStock"
    @click="$emit('add', product)"
  >
    <!-- image -->
    <div class="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      <img
        v-if="product.image && !imageFailed"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
        @error="imageFailed = true"
      />
      <span
        v-else
        class="absolute inset-0 grid place-items-center text-xl font-bold select-none"
        :style="{ background: 'var(--c-subtle)', color: 'var(--c-muted)' }"
      >
        {{ product.name.slice(0, 2).toUpperCase() }}
      </span>

      <span
        v-if="outOfStock"
        class="absolute inset-0 bg-slate-900/70 text-white text-xs font-bold flex items-center justify-center backdrop-blur-[2px]"
      >
        {{ t('pos.outOfStock') }}
      </span>

      <!-- single badge slot — never stack badges -->
      <span
        v-else-if="hasDiscount"
        class="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm"
        :style="{ background: 'var(--pos-discount)', borderRadius: 'var(--radius-lg)' }"
      >
        {{ badge }}
      </span>
      <!-- campaign exists but the cart hasn't met its minimum yet -->
      <span
        v-else-if="locked"
        class="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold leading-none shadow-sm
               inline-flex items-center gap-1"
        :style="{
          background: 'color-mix(in srgb, var(--c-warning) 92%, #fff)',
          color: '#fff',
          borderRadius: 'var(--radius-lg)'
        }"
        :title="`Spend ${settings.money(locked.remaining)} more to unlock ${locked.name}`"
      >
        <Icon name="sparkles" size="w-2.5 h-2.5" />
        {{ settings.money(locked.remaining) }} to unlock
      </span>
      <span
        v-else-if="lowStock"
        class="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm"
        :style="{ background: 'var(--c-warning)', borderRadius: 'var(--radius-lg)' }"
      >
        {{ product.stock }} left
      </span>

      <span
        v-if="(product.variants || []).length"
        class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/70 backdrop-blur text-white text-[9px] font-semibold"
      >
        {{ product.variants.length }} options
      </span>

      <!-- add affordance -->
      <span
        class="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center text-white shadow-lg
               opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
               group-focus-visible:opacity-100 transition-all duration-200"
        :style="{ background: 'var(--c-primary)', borderRadius: 'var(--radius-xl)' }"
      >
        <Icon name="plus" size="w-5 h-5" stroke-width="2.5" />
      </span>
    </div>

    <!-- body: fixed rhythm so every card has identical height -->
    <div class="flex flex-col grow p-3 gap-1">
      <p
        class="text-[13px] font-semibold text-slate-900 dark:text-white leading-[1.35] line-clamp-2 min-h-[2.3rem]"
      >
        {{ product.name }}
      </p>

      <div class="mt-auto flex items-end justify-between gap-2">
        <div class="min-w-0">
          <p v-if="hasDiscount" class="text-[11px] line-through text-slate-400 leading-none">
            {{ settings.money(pricing.unitPrice) }}
          </p>
          <p class="text-[15px] font-bold leading-tight" :style="{ color: 'var(--c-primary)' }">
            {{ settings.money(pricing.finalPrice) }}
          </p>
        </div>
        <span class="text-[10px] font-medium text-slate-400 truncate shrink-0 pb-0.5">
          {{ product.category }}
        </span>
      </div>
    </div>
  </button>
</template>
