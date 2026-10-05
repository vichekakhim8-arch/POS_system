<script setup>
import ProductCard from './ProductCard.vue'
import Icon from '@/components/ui/Icon.vue'

defineProps({
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['add'])
</script>

<template>
  <div>
    <!-- loading skeleton keeps the grid from jumping -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3"
    >
      <div
        v-for="n in 10"
        :key="n"
        class="border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
        :style="{ borderRadius: 'var(--radius-2xl)' }"
      >
        <div class="aspect-square bg-slate-200 dark:bg-slate-800" />
        <div class="p-3 space-y-2">
          <div class="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
          <div class="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>

    <TransitionGroup
      v-else-if="products.length"
      name="list"
      tag="div"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @add="$emit('add', $event)"
      />
    </TransitionGroup>

    <div v-else class="py-20 text-center">
      <span
        class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center"
      >
        <Icon name="search" size="w-6 h-6" />
      </span>
      <p class="text-sm font-medium text-slate-600 dark:text-slate-300">No products found</p>
      <p class="text-xs text-slate-400 mt-1">Try a different search term or category.</p>
    </div>
  </div>
</template>
