<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import Button from '@/components/ui/Button.vue'
import { useProductsStore } from '@/stores/products'
import { useUiStore } from '@/stores/ui'
import { useAction } from '@/composables/useAction'

const route = useRoute()
const router = useRouter()
const products = useProductsStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const product = computed(() => products.byId(route.params.id))

const save = async (payload) => {
  await run(() => products.updateProduct(route.params.id, payload), { message: t('common.saving') })
  ui.notify(`${payload.name} updated`)
  router.push('/products')
}
</script>

<template>
  <div class="max-w-5xl">
    <PageHeader
      title="Edit product"
      :subtitle="product ? `Updating ${product.name}` : 'Product not found'"
      back-to="/products"
    />

    <ProductForm
      v-if="product"
      :key="product.id"
      :product="product"
      submit-label="Save changes"
      @submit="save"
      @cancel="router.push('/products')"
    />

    <div v-else class="card p-10 text-center">
      <p class="text-slate-500">This product no longer exists.</p>
      <Button class="mt-4" @click="router.push('/products')">Back to products</Button>
    </div>
  </div>
</template>
