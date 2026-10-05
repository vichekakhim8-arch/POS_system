<script setup>
import { useI18n } from 'vue-i18n'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Button from '@/components/ui/Button.vue'
import { useProductsStore } from '@/stores/products'

const products = useProductsStore()
const { t } = useI18n()
</script>

<template>
  <div class="card p-4 grid sm:grid-cols-[1fr_auto_auto_auto] gap-3">
    <Input
      :model-value="products.search"
      icon="search"
      :placeholder="t('common.searchPlaceholder')"
      @update:model-value="products.setSearch($event)"
    />
    <Select
      :model-value="products.category"
      :options="products.categoryTabs"
      @update:model-value="products.setCategory($event)"
    />
    <Select
      :model-value="products.status"
      :options="['All', 'Active', 'Inactive']"
      @update:model-value="products.setStatus($event)"
    />
    <Button variant="ghost" icon="refresh" @click="products.resetFilters()">
      {{ t('common.filters') }}
    </Button>
  </div>
</template>
