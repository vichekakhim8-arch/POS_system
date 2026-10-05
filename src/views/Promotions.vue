<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useDiscountsStore } from '@/stores/discounts'

const router = useRouter()
const discounts = useDiscountsStore()
const { t } = useI18n()

const planned = [
  { icon: 'cart', title: 'Buy X Get Y', text: 'Automatically add a free item when conditions are met.' },
  { icon: 'layers', title: 'Bundle deals', text: 'Group products together at a combined price.' },
  { icon: 'clipboard', title: 'Happy hour menus', text: 'Time-boxed menus that swap automatically.' },
  { icon: 'users', title: 'Loyalty rewards', text: 'Points and tier-based automatic rewards.' }
]
</script>

<template>
  <div>
    <PageHeader
      icon="tag"
      :title="t('nav.promotions')"
      subtitle="Campaign types beyond simple discounts"
    >
      <template #actions>
        <Button icon="sparkles" @click="router.push('/discounts')">Go to discounts</Button>
      </template>
    </PageHeader>

    <div class="card p-6 sm:p-8 text-center">
      <span
        class="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center"
      >
        <Icon name="tag" size="w-7 h-7" />
      </span>
      <h2 class="mt-4 text-lg font-bold text-slate-900 dark:text-white">Promotions are coming next</h2>
      <p class="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
        Percentage and fixed-amount campaigns are fully available today in
        <b>Marketing → Discounts</b>. Advanced promotion types are planned below.
      </p>
      <Button class="mt-5" icon="sparkles" @click="router.push('/discounts/new')">
        Create a discount instead
      </Button>
    </div>

    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
      <article v-for="item in planned" :key="item.title" class="card p-5 min-h-[150px]">
        <span
          class="w-10 h-10 rounded-xl bg-surface-subtle text-slate-400 flex items-center justify-center"
        >
          <Icon :name="item.icon" size="w-5 h-5" />
        </span>
        <h3 class="mt-3 font-semibold text-slate-900 dark:text-white">{{ item.title }}</h3>
        <p class="mt-1 text-xs text-slate-400">{{ item.text }}</p>
        <span class="inline-block mt-3 px-2 py-0.5 rounded-md bg-surface-subtle text-[10px] font-bold text-slate-400">
          PLANNED
        </span>
      </article>
    </div>

    <div class="card p-5 mt-5">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-1">Running campaigns today</h3>
      <p class="text-xs text-slate-400 mb-3">Live discounts already driving sales.</p>
      <ul class="space-y-2">
        <li
          v-for="discount in discounts.activeDiscounts"
          :key="discount.id"
          class="flex items-center gap-3 text-sm"
        >
          <Icon name="sparkles" size="w-4 h-4" class="text-brand-600 shrink-0" />
          <span class="grow truncate text-slate-700 dark:text-slate-200">{{ discount.name }}</span>
          <span class="text-xs font-bold text-brand-600 shrink-0">
            {{ discount.type === 'percentage' ? `${discount.value}%` : discount.value }} OFF
          </span>
        </li>
        <li v-if="!discounts.activeDiscounts.length" class="text-sm text-slate-400">
          {{ t('common.noData') }}
        </li>
      </ul>
    </div>
  </div>
</template>
