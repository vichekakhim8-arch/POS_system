<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ProductThumb from '@/components/ui/ProductThumb.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Icon from '@/components/ui/Icon.vue'
import { useAsyncView } from '@/composables/useAsyncView'
import DateRangeDropdown from '@/components/ui/DateRangeDropdown.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { CHART_COLORS, round2, shortDate } from '@/utils/helpers'
import { eachDay, resolveRange } from '@/utils/dateRanges'

const router = useRouter()
const orders = useOrdersStore()
const products = useProductsStore()
const settings = useSettingsStore()
const { t } = useI18n()

const rangeKey = ref('last30')
const range = ref(resolveRange('last30'))

const { loading } = useAsyncView('dashboard')

const onRangeChange = (payload) => {
  range.value = { from: payload.from, to: payload.to }
}

const scoped = computed(() => orders.paid.filter((o) => o.date >= range.value.from && o.date <= range.value.to))

const days = computed(() => eachDay(range.value.from, range.value.to))
const labels = computed(() => days.value.map(shortDate))

const salesSeries = computed(() =>
  days.value.map((d) => round2(scoped.value.filter((o) => o.date === d).reduce((s, o) => s + o.total, 0)))
)
const ordersSeries = computed(() => days.value.map((d) => scoped.value.filter((o) => o.date === d).length))

const rangeRevenue = computed(() => round2(scoped.value.reduce((s, o) => s + o.total, 0)))
const rangeProfit = computed(() => round2(scoped.value.reduce((s, o) => s + o.profit, 0)))

const topProducts = computed(() => orders.productPerformance.slice(0, 5))
const topRevenue = computed(() => round2(topProducts.value.reduce((s, p) => s + p.revenue, 0)))
const topUnits = computed(() => topProducts.value.reduce((s, p) => s + p.qty, 0))
const topMaxRevenue = computed(() =>
  topProducts.value.reduce((max, p) => Math.max(max, p.revenue), 0)
)
/** Bar width relative to the #1 product, guarded against an empty list. */
const barWidth = (revenue) =>
  `${topMaxRevenue.value ? Math.min(100, Math.max(3, (revenue / topMaxRevenue.value) * 100)) : 0}%`
const lowStockList = computed(() => [...products.outOfStock, ...products.lowStock].slice(0, 6))
const recentOrders = computed(() => orders.items.slice(0, 7))
const recentTotal = computed(() => round2(recentOrders.value.reduce((s, o) => s + o.total, 0)))

const categoryMix = computed(() =>
  products.categories
    .map((category, i) => ({
      label: category.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
      value: round2(
        scoped.value.reduce(
          (sum, order) =>
            sum +
            order.items
              .filter((item) => products.byId(item.id)?.category === category.name)
              .reduce((s, item) => s + item.price * item.qty, 0),
          0
        )
      )
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
)

const recentColumns = [
  { key: 'id', label: t('nav.orders') },
  { key: 'customer', label: t('common.customer') },
  { key: 'method', label: t('pos.paymentMethod') },
  { key: 'status', label: t('common.status') },
  { key: 'total', label: t('common.total'), align: 'right' }
]

const exportColumns = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'customer', label: 'Customer' },
  { key: 'method', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', align: 'right', format: (v) => Number(v).toFixed(2) },
  { key: 'profit', label: 'Profit', align: 'right', format: (v) => Number(v).toFixed(2) }
]

const money = (v) => settings.money(v)

/**
 * Recent transactions and Top selling products share one body height so the two
 * cards stay exactly the same height on every breakpoint.
 */
const LIST_BODY = 'h-[352px]'

</script>

<template>
  <div>
    <PageHeader icon="dashboard" :title="t('dashboard.title')" :subtitle="t('dashboard.subtitle')">
      <template #actions>
        <DateRangeDropdown
          v-model="rangeKey"
          :from="range.from"
          :to="range.to"
          @change="onRangeChange"
        />
        <ExportMenu
          filename="sales"
          :title="`${t('dashboard.salesOverview')} (${range.from} → ${range.to})`"
          :subtitle="`${scoped.length} paid orders`"
          :columns="exportColumns"
          :rows="scoped"
          :summary="[
            [t('dashboard.revenue'), money(rangeRevenue)],
            [t('dashboard.profit'), money(rangeProfit)]
          ]"
          orientation="landscape"
        />
        <Button icon="pos" @click="router.push('/pos')">{{ t('dashboard.openPos') }}</Button>
      </template>
    </PageHeader>

    <!-- Metrics — 3 per row on desktop -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
      <StatCard
        :label="t('dashboard.todaySales')"
        :amount="orders.todaySales"
        :decimals="2"
        :prefix="settings.currency"
        icon="dollar"
        trend="+12.4%"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.todayOrders')"
        :amount="orders.todayOrders.length"
        icon="cart"
        tone="sky"
        trend="+8.1%"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.totalProducts')"
        :amount="products.total"
        icon="box"
        tone="violet"
        :hint="`${products.outOfStock.length} out of stock`"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.lowStock')"
        :amount="products.lowStock.length"
        icon="alert"
        tone="amber"
        hint="Needs restocking"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.revenue')"
        :amount="rangeRevenue"
        :decimals="2"
        :prefix="settings.currency"
        icon="trendUp"
        tone="emerald"
        trend="+16.9%"
        :loading="loading"
      />
      <StatCard
        :label="t('dashboard.profit')"
        :amount="rangeProfit"
        :decimals="2"
        :prefix="settings.currency"
        icon="chart"
        tone="rose"
        trend="-2.3%"
        :loading="loading"
      />
    </div>

    <!-- Charts row 1 — Sales overview + Sales by category (equal height) -->
    <div class="grid xl:grid-cols-3 gap-5 mt-5 items-stretch">
      <section class="card p-5 xl:col-span-2 flex flex-col h-full animate-rise">
        <header class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('dashboard.salesOverview') }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ range.from }} → {{ range.to }}</p>
          </div>
          <span class="text-[15px] font-bold text-brand-600 tabular-nums shrink-0">
            {{ money(rangeRevenue) }}
          </span>
        </header>
        <div class="grow grid items-end">
          <LoadingState v-if="loading" title="Loading chart" min-height="268px" />
          <LineChart v-else :data="salesSeries" :labels="labels" :height="268" :formatter="money" />
        </div>
      </section>

      <section class="card p-5 flex flex-col h-full animate-rise">
        <header class="mb-4">
          <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('dashboard.salesByCategory') }}</h3>
          <p class="text-xs text-slate-400 mt-0.5">{{ t('dashboard.revenue') }}</p>
        </header>
        <div class="grow grid place-items-center">
          <LoadingState v-if="loading" title="Loading" min-height="200px" />
          <DonutChart v-else :data="categoryMix" :formatter="money" />
        </div>
      </section>
    </div>

    <!-- Charts row 2 — Orders by day + Low stock (equal height) -->
    <div class="grid xl:grid-cols-3 gap-5 mt-5 items-stretch">
      <section class="card p-5 xl:col-span-2 flex flex-col h-full animate-rise">
        <header class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('dashboard.ordersByDay') }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ scoped.length }} orders in range</p>
          </div>
          <span class="text-[15px] font-bold text-brand-600 tabular-nums shrink-0">
            ⌀ {{ (scoped.length / Math.max(days.length, 1)).toFixed(1) }}/day
          </span>
        </header>
        <div class="grow grid items-end">
          <LoadingState v-if="loading" title="Loading chart" min-height="238px" />
          <BarChart
            v-else
            :data="ordersSeries"
            :labels="labels"
            :height="238"
            color="var(--c-secondary)"
            unit="orders"
            :formatter="(v) => v"
          />
        </div>
      </section>

      <section class="card p-5 flex flex-col h-full animate-rise">
        <header class="flex items-center justify-between gap-3 mb-4">
          <h3 class="font-semibold text-slate-900 dark:text-white">{{ t('dashboard.lowStockAlert') }}</h3>
          <button
            class="text-[13px] font-semibold text-brand-600 hover:underline shrink-0"
            @click="router.push('/inventory')"
          >
            {{ t('dashboard.viewAll') }}
          </button>
        </header>
        <!-- fades hint at more content; pb keeps the last row clear of the edge -->
        <div class="relative grow min-h-0">
          <ul class="h-full max-h-[238px] overflow-y-auto space-y-0.5 -mx-1.5 px-1.5 pb-5 scroll-py-2">
            <li
              v-for="product in lowStockList"
              :key="product.id"
              class="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-surface-subtle transition-colors"
            >
              <span
                class="w-1 h-9 rounded-full shrink-0"
                :style="{ background: product.stock <= 0 ? 'var(--c-danger)' : 'var(--c-warning)' }"
              />
              <ProductThumb :src="product.image" :alt="product.name" size="w-9 h-9" scale="sm" />
              <div class="min-w-0 grow">
                <p class="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate">
                  {{ product.name }}
                </p>
                <p class="text-[11px] text-slate-400 truncate">{{ product.category }}</p>
              </div>
              <span
                class="shrink-0 px-2 h-6 grid place-items-center rounded-md text-[11px] font-bold tabular-nums"
                :style="{
                  background: `color-mix(in srgb, ${
                    product.stock <= 0 ? 'var(--c-danger)' : 'var(--c-warning)'
                  } 13%, transparent)`,
                  color: product.stock <= 0 ? 'var(--c-danger)' : 'var(--c-warning)'
                }"
              >
                {{ product.stock <= 0 ? 'Out' : product.stock }}
              </span>
            </li>
            <li v-if="!lowStockList.length" class="py-10 text-center">
              <span
                class="w-11 h-11 mx-auto mb-2.5 grid place-items-center rounded-xl"
                :style="{
                  background: 'color-mix(in srgb, var(--c-success) 12%, transparent)',
                  color: 'var(--c-success)'
                }"
              >
                <Icon name="check" size="w-5 h-5" />
              </span>
              <p class="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                All stock levels healthy
              </p>
            </li>
          </ul>
          <div
            v-if="lowStockList.length > 4"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-8"
            :style="{ background: 'linear-gradient(to top, var(--c-card), transparent)' }"
          />
        </div>
      </section>
    </div>

    <!-- Lists — Recent transactions (wider) + Top products (equal height) -->
    <div class="grid xl:grid-cols-5 gap-5 mt-5 items-stretch">
      <div class="xl:col-span-3 min-w-0 h-full">
        <DataTable
          panel-class="h-full"
          :title="t('dashboard.recentTransactions')"
          :subtitle="`${recentOrders.length} ${t('dashboard.latestOrders')}`"
          :columns="recentColumns"
          :rows="recentOrders"
          min-width="min-w-[520px]"
          :max-height="LIST_BODY"
          :allow-card-view="false"
          :allow-fullscreen="false"
          :paginate="false"
          empty-icon="clipboard"
          :empty-text="t('dashboard.noTransactions')"
          clickable
          @row-click="router.push('/orders')"
        >
          <template #actions>
            <button class="text-sm font-medium text-brand-600 hover:underline" @click="router.push('/orders')">
              {{ t('dashboard.viewAll') }}
            </button>
          </template>
          <template #cell-id="{ row }">
            <p class="font-semibold text-slate-900 dark:text-white">{{ row.id }}</p>
            <p class="text-xs text-slate-400">{{ row.date }} · {{ row.time }}</p>
          </template>
          <template #cell-status="{ row }"><Badge :type="row.status" /></template>
          <template #cell-total="{ row }">
            <span class="font-semibold text-slate-900 dark:text-white">{{ money(row.total) }}</span>
          </template>
          <!-- summary strip — mirrors the top-products footer so both cards match -->
          <template #footer>
            <div class="-mx-5 -my-3 px-5 py-3 flex items-center justify-between gap-3 bg-surface-subtle">
              <span class="t-caption text-slate-400">{{ t('dashboard.listedOrders') }}</span>
              <span class="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
                {{ money(recentTotal) }}
                <span class="font-medium text-slate-400">
                  · {{ t('dashboard.ordersCount', { count: recentOrders.length }) }}
                </span>
              </span>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Top selling products — same card, header and body height as the table -->
      <section class="xl:col-span-2 card overflow-hidden flex flex-col h-full min-w-0">
        <header
          class="px-3 sm:px-4 py-3 border-b flex items-center gap-2 shrink-0"
          :style="{ borderColor: 'var(--c-border)' }"
        >
          <div class="grow min-w-0">
            <h3 class="t-section text-slate-900 dark:text-white truncate">{{ t('dashboard.topProducts') }}</h3>
            <p class="t-caption text-slate-400 mt-0.5 truncate">{{ t('dashboard.byRevenue') }}</p>
          </div>
          <button
            class="text-sm font-medium text-brand-600 hover:underline shrink-0"
            @click="router.push('/products')"
          >
            {{ t('dashboard.viewAll') }}
          </button>
        </header>

        <div class="grow min-h-0 overflow-y-auto" :class="LIST_BODY">
          <ul v-if="topProducts.length" class="divide-y divide-line">
            <li
              v-for="(product, i) in topProducts"
              :key="product.name"
              class="grid grid-cols-[18px_36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5 hover:bg-surface-subtle transition-colors"
            >
              <span
                class="text-[11px] font-bold tabular-nums text-center"
                :style="{ color: i === 0 ? 'var(--c-primary)' : 'var(--c-muted)' }"
              >
                {{ i + 1 }}
              </span>
              <ProductThumb :src="product.image" :alt="product.name" size="w-9 h-9" scale="sm" />

              <p class="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate min-w-0">
                {{ product.name }}
              </p>
              <span class="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums text-right">
                {{ money(product.revenue) }}
              </span>

              <!-- bar spans the text column; units sit under the price -->
              <div class="col-start-3 h-1.5 rounded-full overflow-hidden bg-surface-subtle">
                <div
                  class="h-full rounded-full transition-[width] duration-700 ease-out"
                  :style="{ width: barWidth(product.revenue), background: 'var(--c-primary)' }"
                />
              </div>
              <span class="col-start-4 text-[11px] text-slate-400 tabular-nums text-right whitespace-nowrap">
                {{ t('dashboard.unitsSold', { count: product.qty }) }}
              </span>
            </li>
          </ul>

          <div v-else class="h-full grid place-items-center text-center px-4 py-10">
            <div>
              <span
                class="w-12 h-12 mx-auto mb-3 grid place-items-center rounded-2xl"
                :style="{
                  background: 'color-mix(in srgb, var(--c-primary) 10%, transparent)',
                  color: 'var(--c-primary)'
                }"
              >
                <Icon name="box" size="w-5 h-5" />
              </span>
              <p class="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {{ t('dashboard.noSalesYet') }}
              </p>
            </div>
          </div>
        </div>

        <footer
          class="px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0"
          :style="{ borderColor: 'var(--c-border)', background: 'var(--c-subtle)' }"
        >
          <span class="t-caption text-slate-400">
            {{ t('dashboard.topProductsCount', { count: topProducts.length }) }}
          </span>
          <span class="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
            {{ money(topRevenue) }}
            <span class="font-medium text-slate-400">· {{ t('dashboard.unitsSold', { count: topUnits }) }}</span>
          </span>
        </footer>
      </section>
    </div>
  </div>
</template>
