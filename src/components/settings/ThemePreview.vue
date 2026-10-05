<script setup>
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

const theme = useThemeStore()
const settings = useSettingsStore()

const categories = ['All', 'Food', 'Drinks', 'Bakery']
const active = computed(() => 'Food')
</script>

<template>
  <div
    class="rounded-2xl border border-line overflow-hidden select-none"
    :style="{ background: theme.surfaces.background }"
  >
    <div class="flex min-h-[420px]">
      <!-- sidebar -->
      <aside
        class="hidden sm:flex w-[140px] shrink-0 flex-col border-r p-3 gap-1"
        :style="{ background: theme.surfaces.sidebar, borderColor: theme.surfaces.border }"
      >
        <div class="flex items-center gap-2 mb-3">
          <span
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
            :style="{ background: theme.primary, color: 'var(--c-on-primary)', borderRadius: 'var(--radius-lg)' }"
          >
            <Icon name="store" size="w-4 h-4" />
          </span>
          <span class="text-xs font-bold" :style="{ color: theme.surfaces.heading }">NovaPOS</span>
        </div>

        <div
          class="flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold"
          :style="{
            background: theme.primary,
            color: 'var(--c-on-primary)',
            borderRadius: 'var(--radius-xl)'
          }"
        >
          <Icon name="dashboard" size="w-3.5 h-3.5" /> Dashboard
        </div>
        <div
          v-for="item in ['POS', 'Products', 'Orders']"
          :key="item"
          class="flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium"
          :style="{ color: theme.surfaces.mutedText }"
        >
          <Icon name="chevronRight" size="w-3 h-3" /> {{ item }}
        </div>
      </aside>

      <div class="grow min-w-0">
        <!-- navbar -->
        <header
          class="flex items-center gap-2 px-4 h-12 border-b"
          :style="{ background: theme.surfaces.navbar, borderColor: theme.surfaces.border }"
        >
          <Icon name="menu" size="w-4 h-4" :style="{ color: theme.surfaces.mutedText }" />
          <span class="text-xs font-semibold" :style="{ color: theme.surfaces.heading }">Dashboard</span>
          <span class="ml-auto flex items-center gap-1.5">
            <span
              class="w-6 h-6 rounded-lg flex items-center justify-center"
              :style="{ color: theme.surfaces.mutedText }"
            >
              <Icon name="bell" size="w-3.5 h-3.5" />
            </span>
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
              :style="{ background: theme.primary, color: 'var(--c-on-primary)' }"
            >
              AM
            </span>
          </span>
        </header>

        <div class="p-4 space-y-3">
          <!-- stat cards -->
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="(stat, i) in [
                { label: 'Total sales', value: '$24,580', tone: theme.primary, icon: 'dollar' },
                { label: 'Profit', value: '$8,140', tone: theme.success, icon: 'trendUp' }
              ]"
              :key="i"
              class="p-3 border"
              :style="{
                background: theme.surfaces.card,
                borderColor: theme.surfaces.border,
                borderRadius: 'var(--radius-2xl)'
              }"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-wider" :style="{ color: theme.surfaces.mutedText }">
                    {{ stat.label }}
                  </p>
                  <p class="text-lg font-bold mt-1" :style="{ color: theme.surfaces.heading }">{{ stat.value }}</p>
                </div>
                <span
                  class="w-7 h-7 rounded-lg flex items-center justify-center"
                  :style="{ background: `color-mix(in srgb, ${stat.tone} 14%, transparent)`, color: stat.tone }"
                >
                  <Icon :name="stat.icon" size="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          <!-- buttons + input -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="px-3 py-2 text-[11px] font-semibold inline-flex items-center gap-1.5"
              :style="{
                background: theme.resolved.buttonBackground,
                color: theme.resolved.buttonText,
                borderRadius: 'var(--btn-radius)'
              }"
            >
              <Icon name="plus" size="w-3.5 h-3.5" /> Add product
            </button>
            <button
              class="px-3 py-2 text-[11px] font-semibold border"
              :style="{
                background: theme.surfaces.subtle,
                color: theme.surfaces.text,
                borderColor: theme.surfaces.border,
                borderRadius: 'var(--btn-radius)'
              }"
            >
              Secondary
            </button>
            <span
              class="px-2 py-1 text-[10px] font-bold"
              :style="{
                background: `color-mix(in srgb, ${theme.success} 15%, transparent)`,
                color: theme.success,
                borderRadius: 'var(--radius-lg)'
              }"
            >
              Paid
            </span>
            <span
              class="px-2 py-1 text-[10px] font-bold"
              :style="{
                background: `color-mix(in srgb, ${theme.warning} 15%, transparent)`,
                color: theme.warning,
                borderRadius: 'var(--radius-lg)'
              }"
            >
              Pending
            </span>
          </div>

          <div
            class="px-3 py-2 text-[11px] border flex items-center gap-2"
            :style="{
              background: theme.surfaces.input,
              borderColor: theme.surfaces.inputBorder,
              color: theme.surfaces.mutedText,
              borderRadius: 'var(--radius-xl)'
            }"
          >
            <Icon name="search" size="w-3.5 h-3.5" /> Search product…
          </div>

          <!-- category tabs -->
          <div class="flex gap-1.5 flex-wrap">
            <span
              v-for="category in categories"
              :key="category"
              class="px-2.5 py-1.5 text-[10px] font-semibold border"
              :style="
                category === active
                  ? {
                      background: theme.resolved.posActiveCategory,
                      color: 'var(--pos-active-category-text)',
                      borderColor: theme.resolved.posActiveCategory,
                      borderRadius: 'var(--radius-xl)'
                    }
                  : {
                      background: theme.surfaces.card,
                      color: theme.surfaces.text,
                      borderColor: theme.surfaces.border,
                      borderRadius: 'var(--radius-xl)'
                    }
              "
            >
              {{ category }}
            </span>
          </div>

          <!-- product cards -->
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="(product, i) in [
                { name: 'Espresso', price: '$12.50' },
                { name: 'Croissant', price: '$2.75' },
                { name: 'Cold Brew', price: '$3.25' }
              ]"
              :key="product.name"
              class="p-2 border"
              :style="{
                background: theme.surfaces.card,
                borderColor: i === 1 ? theme.resolved.posSelectedProduct : theme.surfaces.border,
                boxShadow:
                  i === 1
                    ? `0 0 0 3px color-mix(in srgb, ${theme.resolved.posSelectedProduct} 22%, transparent)`
                    : 'none',
                borderRadius: 'var(--radius-2xl)'
              }"
            >
              <div
                class="h-10 mb-1.5"
                :style="{
                  background: `color-mix(in srgb, ${theme.primary} 12%, ${theme.surfaces.subtle})`,
                  borderRadius: 'var(--radius-xl)'
                }"
              />
              <p class="text-[10px] font-semibold truncate" :style="{ color: theme.surfaces.heading }">
                {{ product.name }}
              </p>
              <p class="text-[10px] font-bold" :style="{ color: theme.primary }">{{ product.price }}</p>
            </div>
          </div>

          <!-- table -->
          <div
            class="overflow-hidden border"
            :style="{ borderColor: theme.surfaces.border, borderRadius: 'var(--radius-2xl)' }"
          >
            <div
              class="grid grid-cols-3 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider"
              :style="{ background: theme.surfaces.subtle, color: theme.surfaces.mutedText }"
            >
              <span>Order</span><span>Status</span><span class="text-right">Total</span>
            </div>
            <div
              v-for="(row, i) in [
                { id: 'ORD-2401', status: 'Paid', total: '$42.10' },
                { id: 'ORD-2402', status: 'Pending', total: '$18.90' }
              ]"
              :key="row.id"
              class="grid grid-cols-3 px-3 py-2 text-[10px] items-center"
              :style="{
                background: theme.surfaces.card,
                borderTop: i ? `1px solid ${theme.surfaces.border}` : 'none',
                color: theme.surfaces.text
              }"
            >
              <span :style="{ color: theme.surfaces.heading }" class="font-semibold">{{ row.id }}</span>
              <span>
                <span
                  class="px-1.5 py-0.5 text-[9px] font-bold"
                  :style="{
                    background: `color-mix(in srgb, ${row.status === 'Paid' ? theme.success : theme.warning} 15%, transparent)`,
                    color: row.status === 'Paid' ? theme.success : theme.warning,
                    borderRadius: 'var(--radius-md)'
                  }"
                >
                  {{ row.status }}
                </span>
              </span>
              <span class="text-right font-bold" :style="{ color: theme.surfaces.heading }">{{ row.total }}</span>
            </div>
          </div>

          <!-- cart + checkout -->
          <div
            class="p-3 border"
            :style="{
              background: theme.resolved.posCartHighlight,
              borderColor: theme.surfaces.border,
              borderRadius: 'var(--radius-2xl)'
            }"
          >
            <div class="flex justify-between text-[10px]" :style="{ color: theme.surfaces.mutedText }">
              <span>Subtotal</span><span>{{ settings.currency }}18.50</span>
            </div>
            <div class="flex justify-between text-[10px] mt-1">
              <span :style="{ color: theme.surfaces.mutedText }">Discount</span>
              <span :style="{ color: theme.posDiscount }">−{{ settings.currency }}2.00</span>
            </div>
            <div class="flex justify-between items-center mt-2 pt-2" :style="{ borderTop: `1px dashed ${theme.surfaces.border}` }">
              <span class="text-[11px] font-bold" :style="{ color: theme.surfaces.heading }">Total</span>
              <span class="text-base font-bold" :style="{ color: theme.primary }">{{ settings.currency }}16.50</span>
            </div>
            <button
              class="w-full mt-2 py-2 text-[11px] font-bold inline-flex items-center justify-center gap-1.5"
              :style="{
                background: theme.posPaymentSuccess,
                color: 'var(--menu-checkout-text)',
                borderRadius: 'var(--btn-radius)'
              }"
            >
              <Icon name="check" size="w-3.5 h-3.5" /> Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
