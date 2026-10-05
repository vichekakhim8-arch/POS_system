<script setup>
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import Input from '@/components/ui/Input.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { APPLY_TO_OPTIONS } from '@/data/discounts'

const props = defineProps({
  applyTo: { type: String, default: 'all' },
  categoryIds: { type: Array, default: () => [] },
  productIds: { type: Array, default: () => [] },
  variantIds: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:applyTo',
  'update:categoryIds',
  'update:productIds',
  'update:variantIds'
])

const products = useProductsStore()
const settings = useSettingsStore()

const productSearch = ref('')
const variantSearch = ref('')

/* -------------------------------------------------------------- helpers */
const toggle = (list, value, event) => {
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  emit(event, next)
}

const filteredProducts = computed(() => {
  const term = productSearch.value.trim().toLowerCase()
  return products.items
    .filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    .slice(0, 60)
})

const variantProducts = computed(() => {
  const term = variantSearch.value.trim().toLowerCase()
  return products.items
    .filter((p) => (p.variants || []).length)
    .filter((p) => !term || p.name.toLowerCase().includes(term))
})

const selectedCategories = computed(() =>
  props.categoryIds.map((id) => products.categories.find((c) => c.id === id)).filter(Boolean)
)
const selectedProducts = computed(() =>
  props.productIds.map((id) => products.byId(id)).filter(Boolean)
)
const selectedVariants = computed(() =>
  props.variantIds
    .map((vid) => {
      const product = products.items.find((p) => (p.variants || []).some((v) => v.id === vid))
      const variant = product?.variants.find((v) => v.id === vid)
      return product && variant ? { id: vid, label: `${product.name} · ${variant.name}` } : null
    })
    .filter(Boolean)
)
</script>

<template>
  <div class="space-y-4">
    <!-- mode -->
    <div class="grid sm:grid-cols-2 gap-2.5">
      <button
        v-for="option in APPLY_TO_OPTIONS"
        :key="option.value"
        type="button"
        class="flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition"
        :class="
          applyTo === option.value
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
            : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
        "
        @click="emit('update:applyTo', option.value)"
      >
        <span
          class="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition"
          :class="applyTo === option.value ? 'border-brand-600' : 'border-slate-300 dark:border-slate-600'"
        >
          <span v-if="applyTo === option.value" class="w-2.5 h-2.5 rounded-full bg-brand-600" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ option.label }}
          </span>
          <span class="block text-xs text-slate-400">{{ option.hint }}</span>
        </span>
      </button>
    </div>

    <!-- ALL -->
    <div
      v-if="applyTo === 'all'"
      class="flex items-center gap-3 p-4 rounded-xl bg-surface-subtle text-sm text-slate-600 dark:text-slate-300"
    >
      <Icon name="check" size="w-4 h-4" class="text-emerald-500 shrink-0" />
      Applies to all {{ products.total }} eligible products. No selection needed.
    </div>

    <!-- CATEGORIES -->
    <div v-else-if="applyTo === 'categories'" class="space-y-3">
      <p class="label">Select categories</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <label
          v-for="category in products.categories"
          :key="category.id"
          class="flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition"
          :class="
            categoryIds.includes(category.id)
              ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5'
              : 'border-slate-200 dark:border-slate-700'
          "
        >
          <input
            type="checkbox"
            class="w-4 h-4 rounded accent-brand-600"
            :checked="categoryIds.includes(category.id)"
            @change="toggle(categoryIds, category.id, 'update:categoryIds')"
          />
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: category.color }" />
          <span class="text-sm text-slate-700 dark:text-slate-200 truncate grow">{{ category.name }}</span>
          <span class="text-[11px] text-slate-400">{{ products.countByCategory(category.name) }}</span>
        </label>
      </div>

      <div v-if="selectedCategories.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="category in selectedCategories"
          :key="category.id"
          class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 text-xs font-medium"
        >
          {{ category.name }}
          <button
            type="button"
            class="hover:text-rose-500"
            @click="toggle(categoryIds, category.id, 'update:categoryIds')"
          >
            <Icon name="x" size="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>

    <!-- PRODUCTS -->
    <div v-else-if="applyTo === 'products'" class="space-y-3">
      <Input v-model="productSearch" icon="search" label="Search products" placeholder="Search product…" />

      <div class="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <label
          v-for="product in filteredProducts"
          :key="product.id"
          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <input
            type="checkbox"
            class="w-4 h-4 rounded accent-brand-600 shrink-0"
            :checked="productIds.includes(product.id)"
            @change="toggle(productIds, product.id, 'update:productIds')"
          />
          <img :src="product.image" :alt="product.name" class="w-8 h-8 rounded-lg object-cover shrink-0" />
          <span class="min-w-0 grow">
            <span class="block text-sm text-slate-800 dark:text-slate-100 truncate">{{ product.name }}</span>
            <span class="block text-[11px] text-slate-400">{{ product.category }}</span>
          </span>
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            {{ settings.money(product.price) }}
          </span>
        </label>
        <p v-if="!filteredProducts.length" class="px-3 py-8 text-center text-sm text-slate-400">
          No products found.
        </p>
      </div>

      <div v-if="selectedProducts.length">
        <p class="label">Selected products ({{ selectedProducts.length }})</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="product in selectedProducts"
            :key="product.id"
            class="inline-flex items-center gap-1.5 pl-1.5 pr-1.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 text-xs font-medium"
          >
            <img :src="product.image" :alt="product.name" class="w-4 h-4 rounded object-cover" />
            {{ product.name }}
            <button
              type="button"
              class="hover:text-rose-500"
              @click="toggle(productIds, product.id, 'update:productIds')"
            >
              <Icon name="x" size="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- VARIANTS -->
    <div v-else class="space-y-3">
      <Input v-model="variantSearch" icon="search" label="Search products with variants" placeholder="Search…" />

      <div class="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <div v-for="product in variantProducts" :key="product.id" class="px-3 py-2.5">
          <div class="flex items-center gap-2.5">
            <img :src="product.image" :alt="product.name" class="w-8 h-8 rounded-lg object-cover shrink-0" />
            <p class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{{ product.name }}</p>
          </div>
          <div class="mt-2 ml-11 grid sm:grid-cols-3 gap-1.5">
            <label
              v-for="variant in product.variants"
              :key="variant.id"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition"
              :class="
                variantIds.includes(variant.id)
                  ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-500/5'
                  : 'border-slate-200 dark:border-slate-700'
              "
            >
              <input
                type="checkbox"
                class="w-3.5 h-3.5 rounded accent-brand-600"
                :checked="variantIds.includes(variant.id)"
                @change="toggle(variantIds, variant.id, 'update:variantIds')"
              />
              <span class="text-xs text-slate-700 dark:text-slate-200 grow truncate">{{ variant.name }}</span>
              <span class="text-[11px] text-slate-400">{{ settings.money(variant.price) }}</span>
            </label>
          </div>
        </div>
        <p v-if="!variantProducts.length" class="px-3 py-8 text-center text-sm text-slate-400">
          No products with variants found.
        </p>
      </div>

      <div v-if="selectedVariants.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="variant in selectedVariants"
          :key="variant.id"
          class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 text-xs font-medium"
        >
          {{ variant.label }}
          <button
            type="button"
            class="hover:text-rose-500"
            @click="toggle(variantIds, variant.id, 'update:variantIds')"
          >
            <Icon name="x" size="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
