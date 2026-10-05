<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import ThemeModeToggle from '@/components/ui/ThemeModeToggle.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

/**
 * Public customer menu / website.
 * Uses the exact same global theme tokens as the back office — changing the
 * brand colour in Settings → Appearance updates this page instantly.
 */
const router = useRouter()
const products = useProductsStore()
const settings = useSettingsStore()
const theme = useThemeStore()

const category = ref('All')
const basket = ref([])

const list = computed(() =>
  products.items.filter((p) => category.value === 'All' || p.category === category.value)
)
const total = computed(() => basket.value.reduce((s, i) => s + i.price, 0))
const add = (product) => basket.value.push(product)
</script>

<template>
  <div class="min-h-full bg-canvas">
    <!-- header -->
    <header class="menu-header">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
          <img v-if="settings.logo" :src="settings.logo" alt="" class="w-full h-full object-cover" />
          <Icon v-else name="store" />
        </span>
        <div class="min-w-0">
          <p class="font-bold leading-tight truncate">{{ settings.store }}</p>
          <p class="text-[11px] opacity-80 truncate">{{ settings.address }}</p>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <ThemeModeToggle compact />
          <button
            class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-white/15 hover:bg-white/25 transition"
            :style="{ borderRadius: 'var(--btn-radius)' }"
            @click="router.push('/dashboard')"
          >
            <Icon name="pos" size="w-4 h-4" /> Staff login
          </button>
        </div>
      </div>
    </header>

    <!-- hero -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
      <div class="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="grow">
          <span class="menu-promotion inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold">
            Today only · 10% off bakery
          </span>
          <h1 class="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Order online, pick up in store.
          </h1>
          <p class="mt-2 text-sm text-slate-500 max-w-lg">
            Browse the live menu — prices and stock come straight from the POS.
          </p>
        </div>
        <button
          class="menu-checkout px-5 py-3 text-sm font-bold shrink-0"
          :style="{ borderRadius: 'var(--btn-radius)' }"
        >
          Start an order
        </button>
      </div>
    </section>

    <!-- categories -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-5">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="c in products.categoryTabs"
          :key="c"
          class="px-3.5 py-2 text-sm font-medium whitespace-nowrap border transition"
          :style="
            category === c
              ? {
                  background: 'var(--menu-active)',
                  color: 'var(--menu-button-text)',
                  borderColor: 'var(--menu-active)',
                  borderRadius: 'var(--radius-xl)'
                }
              : { borderRadius: 'var(--radius-xl)' }
          "
          :class="category === c ? '' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'"
          @click="category = c"
        >
          {{ c }}
        </button>
      </div>

      <!-- products -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        <article v-for="product in list" :key="product.id" class="card card-hover p-3 flex flex-col">
          <div class="aspect-square rounded-xl overflow-hidden bg-surface-subtle">
            <img :src="product.image" :alt="product.name" loading="lazy" class="w-full h-full object-cover" />
          </div>
          <p class="mt-2.5 text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
            {{ product.name }}
          </p>
          <p class="menu-price text-base font-bold mt-0.5">{{ settings.money(product.price) }}</p>
          <button
            class="menu-button mt-2.5 w-full py-2 text-xs font-bold disabled:opacity-50"
            :style="{ borderRadius: 'var(--btn-radius)' }"
            :disabled="product.stock <= 0"
            @click="add(product)"
          >
            {{ product.stock > 0 ? 'Add to basket' : 'Sold out' }}
          </button>
        </article>
      </div>
    </section>

    <!-- sticky basket -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-6 opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="translate-y-6 opacity-0"
    >
      <div v-if="basket.length" class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-80 z-30">
        <div class="card p-3 flex items-center gap-3 shadow-xl">
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {{ basket.length }} items
          </span>
          <span class="menu-price font-bold ml-auto">{{ settings.money(total) }}</span>
          <button
            class="menu-checkout px-4 py-2 text-sm font-bold"
            :style="{ borderRadius: 'var(--btn-radius)' }"
            @click="basket = []"
          >
            Checkout
          </button>
        </div>
      </div>
    </Transition>

    <footer class="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-xs text-slate-400">
      {{ settings.store }} · {{ settings.phone }} — powered by NovaPOS
      <span class="block mt-1">Theme: {{ theme.selectedPreset }} · {{ theme.isDark ? 'Dark' : 'Light' }}</span>
    </footer>
  </div>
</template>
