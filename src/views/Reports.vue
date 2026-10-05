<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import DataTable from '@/components/ui/DataTable.vue'
import DateRangeDropdown from '@/components/ui/DateRangeDropdown.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import Icon from '@/components/ui/Icon.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { useOrdersStore } from '@/stores/orders'
import { useExpensesStore } from '@/stores/expenses'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useSettingsStore } from '@/stores/settings'
import { CHART_COLORS, round2, shortDate } from '@/utils/helpers'
import { eachDay, resolveRange } from '@/utils/dateRanges'
import { useAsyncView } from '@/composables/useAsyncView'

const orders = useOrdersStore()
const expenses = useExpensesStore()
const products = useProductsStore()
const customers = useCustomersStore()
const settings = useSettingsStore()
const { t } = useI18n()

const tabs = [
  { key: 'sales', label: 'Sales', icon: 'dollar', formats: ['excel', 'csv', 'pdf'] },
  { key: 'profit', label: 'Profit', icon: 'trendUp', formats: ['excel', 'pdf'] },
  { key: 'product', label: 'Product performance', icon: 'box', formats: ['excel', 'csv'] },
  { key: 'inventory', label: 'Inventory', icon: 'layers', formats: ['excel', 'pdf'] },
  { key: 'customer', label: 'Customer', icon: 'users', formats: ['excel', 'pdf'] },
  { key: 'expense', label: 'Expense', icon: 'wallet', formats: ['excel', 'csv', 'pdf'] },
  { key: 'discount', label: 'Discount', icon: 'sparkles', formats: ['excel', 'csv', 'pdf'] }
]

const tab = ref('sales')
const rangeKey = ref('thisMonth')
const range = ref(resolveRange('thisMonth'))

const { loading } = useAsyncView('reports')

const activeTab = computed(() => tabs.find((x) => x.key === tab.value))

const rangeOrders = computed(() => orders.inRange(range.value.from, range.value.to))
const rangeExpenses = computed(() => expenses.inRange(range.value.from, range.value.to))

const revenue = computed(() => round2(rangeOrders.value.reduce((s, o) => s + o.total, 0)))
const grossProfit = computed(() => round2(rangeOrders.value.reduce((s, o) => s + o.profit, 0)))
const expenseTotal = computed(() => round2(rangeExpenses.value.reduce((s, e) => s + e.amount, 0)))
const netProfit = computed(() => round2(grossProfit.value - expenseTotal.value))

const days = computed(() => eachDay(range.value.from, range.value.to))
const labels = computed(() => days.value.map(shortDate))
const salesSeries = computed(() =>
  days.value.map((d) => round2(rangeOrders.value.filter((o) => o.date === d).reduce((s, o) => s + o.total, 0)))
)
const profitSeries = computed(() =>
  days.value.map((d) => round2(rangeOrders.value.filter((o) => o.date === d).reduce((s, o) => s + o.profit, 0)))
)

const productRows = computed(() => {
  const map = {}
  rangeOrders.value.forEach((order) =>
    order.items.forEach((item) => {
      if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0, profit: 0 }
      map[item.name].qty += item.qty
      map[item.name].revenue = round2(map[item.name].revenue + item.price * item.qty)
      map[item.name].profit = round2(map[item.name].profit + (item.price - item.cost) * item.qty)
    })
  )
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

const customerRows = computed(() =>
  customers.items
    .map((customer) => {
      const history = rangeOrders.value.filter((o) => o.customerId === customer.id)
      return {
        ...customer,
        orders: history.length,
        spent: round2(history.reduce((s, o) => s + o.total, 0))
      }
    })
    .sort((a, b) => b.spent - a.spent)
)

const inventoryRows = computed(() =>
  products.items.map((p) => ({ ...p, value: round2(p.stock * p.cost) }))
)

const discountStats = computed(() => orders.discountStats(range.value.from, range.value.to))

const discountSeries = computed(() =>
  days.value.map((d) =>
    round2(
      rangeOrders.value.filter((o) => o.date === d).reduce((s, o) => s + (o.discount || 0), 0)
    )
  )
)

const expenseMix = computed(() =>
  expenses.categories
    .map((category, i) => ({
      label: category,
      color: CHART_COLORS[i % CHART_COLORS.length],
      value: round2(
        rangeExpenses.value.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0)
      )
    }))
    .filter((d) => d.value > 0)
)

const money2 = (v) => Number(v).toFixed(2)

const config = computed(
  () =>
    ({
      sales: {
        rows: rangeOrders.value,
        columns: [
          { key: 'id', label: 'Order' },
          { key: 'date', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'method', label: 'Payment' },
          { key: 'total', label: 'Total', align: 'right', format: money2 }
        ],
        summary: [
          ['Revenue', settings.money(revenue.value)],
          ['Orders', rangeOrders.value.length]
        ]
      },
      profit: {
        rows: productRows.value,
        columns: [
          { key: 'name', label: 'Product' },
          { key: 'qty', label: 'Units', align: 'right' },
          { key: 'revenue', label: 'Revenue', align: 'right', format: money2 },
          { key: 'profit', label: 'Profit', align: 'right', format: money2 }
        ],
        summary: [
          ['Gross profit', settings.money(grossProfit.value)],
          ['Expenses', settings.money(expenseTotal.value)],
          ['Net profit', settings.money(netProfit.value)]
        ]
      },
      product: {
        rows: productRows.value,
        columns: [
          { key: 'name', label: 'Product' },
          { key: 'qty', label: 'Units sold', align: 'right' },
          { key: 'revenue', label: 'Revenue', align: 'right', format: money2 },
          { key: 'profit', label: 'Profit', align: 'right', format: money2 }
        ],
        summary: []
      },
      inventory: {
        rows: inventoryRows.value,
        columns: [
          { key: 'name', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Category' },
          { key: 'stock', label: 'Stock', align: 'right' },
          { key: 'cost', label: 'Unit cost', align: 'right', format: money2 },
          { key: 'value', label: 'Stock value', align: 'right', format: money2 }
        ],
        summary: [['Total stock value', settings.money(products.stockValue)]]
      },
      customer: {
        rows: customerRows.value,
        columns: [
          { key: 'name', label: 'Customer' },
          { key: 'phone', label: 'Phone' },
          { key: 'orders', label: 'Orders', align: 'right' },
          { key: 'spent', label: 'Spent', align: 'right', format: money2 }
        ],
        summary: [['Total', settings.money(revenue.value)]]
      },
      expense: {
        rows: rangeExpenses.value,
        columns: [
          { key: 'name', label: 'Expense' },
          { key: 'category', label: 'Category' },
          { key: 'date', label: 'Date' },
          { key: 'amount', label: 'Amount', align: 'right', format: money2 }
        ],
        summary: [['Total expenses', settings.money(expenseTotal.value)]]
      },
      discount: {
        rows: discountStats.value.campaigns,
        columns: [
          { key: 'name', label: 'Campaign' },
          { key: 'orders', label: 'Orders', align: 'right' },
          { key: 'amount', label: 'Discount given', align: 'right', format: money2 }
        ],
        summary: [
          ['Total discount given', settings.money(discountStats.value.totalDiscount)],
          ['Discounted orders', discountStats.value.discountedOrders],
          ['Average discount', settings.money(discountStats.value.averageDiscount)]
        ]
      }
    })[tab.value]
)

const tableColumns = computed(() =>
  config.value.columns.map((c) => ({ ...c, sortable: true, format: undefined }))
)
</script>

<template>
  <div>
    <PageHeader icon="chart" :title="t('nav.reports')" subtitle="Analyse sales, profit, inventory and costs">
      <template #actions>
        <DateRangeDropdown
          v-model="rangeKey"
          :from="range.from"
          :to="range.to"
          @change="range = { from: $event.from, to: $event.to }"
        />
        <ExportMenu
          :filename="`${tab}-report`"
          :title="`${activeTab.label} report`"
          :subtitle="`${range.from} → ${range.to}`"
          :columns="config.columns"
          :rows="config.rows"
          :summary="config.summary"
          :formats="activeTab.formats"
          variant="primary"
          orientation="landscape"
        />
      </template>
    </PageHeader>

    <!-- report switcher -->
    <div class="card p-2 mb-5 flex gap-1.5 overflow-x-auto">
      <button
        v-for="x in tabs"
        :key="x.key"
        class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition duration-150"
        :class="
          tab === x.key
            ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        "
        @click="tab = x.key"
      >
        <Icon :name="x.icon" size="w-4 h-4" />
        {{ x.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 stagger">
      <StatCard
        :label="t('dashboard.revenue')"
        :amount="revenue"
        :decimals="2"
        :prefix="settings.currency"
        icon="dollar"
      />
      <StatCard
        label="Gross profit"
        :amount="grossProfit"
        :decimals="2"
        :prefix="settings.currency"
        icon="trendUp"
        tone="emerald"
      />
      <StatCard
        :label="t('nav.expenses')"
        :amount="expenseTotal"
        :decimals="2"
        :prefix="settings.currency"
        icon="wallet"
        tone="rose"
      />
      <StatCard
        label="Net profit"
        :amount="netProfit"
        :decimals="2"
        :prefix="settings.currency"
        icon="chart"
        tone="violet"
      />
    </div>

    <!-- charts -->
    <div v-if="tab === 'sales' || tab === 'profit'" class="card p-5 mb-5">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-4">
        {{ tab === 'sales' ? t('dashboard.salesOverview') : 'Profit trend' }}
      </h3>
      <LineChart
        :data="tab === 'sales' ? salesSeries : profitSeries"
        :labels="labels"
        :height="260"
        :color="tab === 'sales' ? 'var(--c-primary)' : 'var(--c-success)'"
        :formatter="(v) => settings.money(v)"
      />
    </div>

    <div v-if="tab === 'product'" class="card p-5 mb-5">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-4">Top products by revenue</h3>
      <BarChart
        :data="productRows.slice(0, 10).map((p) => p.revenue)"
        :labels="productRows.slice(0, 10).map((p) => p.name.split(' ')[0])"
        :height="250"
        :formatter="(v) => settings.money(v)"
      />
    </div>

    <div v-if="tab === 'expense'" class="card p-5 mb-5">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-5">Expense breakdown</h3>
      <DonutChart :data="expenseMix" />
    </div>

    <!-- discount report -->
    <template v-if="tab === 'discount'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total discount given"
          :amount="discountStats.totalDiscount"
          :decimals="2"
          :prefix="settings.currency"
          icon="sparkles"
          tone="rose"
        />
        <StatCard label="Discounted orders" :amount="discountStats.discountedOrders" icon="cart" tone="sky" />
        <StatCard
          label="Average discount"
          :amount="discountStats.averageDiscount"
          :decimals="2"
          :prefix="settings.currency"
          icon="chart"
          tone="amber"
        />
        <StatCard
          label="Most used"
          :value="discountStats.topCampaign ? discountStats.topCampaign.name : '—'"
          icon="trendUp"
          tone="violet"
          :hint="discountStats.topCampaign ? `${discountStats.topCampaign.orders} orders` : 'No campaigns used'"
        />
      </div>

      <div class="card p-5 mb-5">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-4">Discount amount by date</h3>
        <BarChart
          :data="discountSeries"
          :labels="labels"
          :height="240"
          color="var(--pos-discount)"
          :formatter="(v) => settings.money(v)"
        />
      </div>

      <div class="card overflow-hidden mb-5">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 class="font-semibold text-slate-900 dark:text-white">Discount by product</h3>
        </div>
        <ul class="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          <li
            v-for="product in discountStats.products"
            :key="product.name"
            class="flex items-center gap-3 px-5 py-3"
          >
            <span class="grow min-w-0 text-sm text-slate-700 dark:text-slate-200 truncate">
              {{ product.name }}
            </span>
            <span class="text-xs text-slate-400 shrink-0">{{ product.qty }} units</span>
            <span class="text-sm font-semibold text-discount shrink-0">
              {{ settings.money(product.amount) }}
            </span>
          </li>
          <li v-if="!discountStats.products.length" class="px-5 py-12 text-center text-sm text-slate-400">
            No discounts applied in this period.
          </li>
        </ul>
      </div>
    </template>

    <DataTable
      :title="`${activeTab.label} detail`"
      :columns="tableColumns"
      :rows="config.rows"
      row-key="id"
      :loading="loading"
      min-width="min-w-[680px]"
      max-height="max-h-[520px]"
      empty-icon="chart"
    >
      <template #cell-name="{ row }">
        <span class="font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
      </template>
      <template #cell-id="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ row.id }}</span>
      </template>
      <template #cell-total="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.total) }}</span>
      </template>
      <template #cell-revenue="{ row }">{{ settings.money(row.revenue) }}</template>
      <template #cell-profit="{ row }">
        <span class="font-semibold text-emerald-600">{{ settings.money(row.profit) }}</span>
      </template>
      <template #cell-spent="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.spent) }}</span>
      </template>
      <template #cell-amount="{ row }">
        <span class="font-semibold text-rose-600">{{ settings.money(row.amount) }}</span>
      </template>
      <template #cell-value="{ row }">
        <span class="font-semibold text-slate-900 dark:text-white">{{ settings.money(row.value) }}</span>
      </template>
      <template #cell-cost="{ row }">{{ settings.money(row.cost) }}</template>
    </DataTable>
  </div>
</template>
