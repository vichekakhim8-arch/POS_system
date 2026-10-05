<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import { useProductsStore } from '@/stores/products'
import { useInventoryStore } from '@/stores/inventory'
import { useUiStore } from '@/stores/ui'
import { useAction } from '@/composables/useAction'

const router = useRouter()
const products = useProductsStore()
const inventory = useInventoryStore()
const ui = useUiStore()
const { t } = useI18n()
const { run } = useAction()

const save = async (payload) => {
  let product
  await run(() => {
    product = products.addProduct(payload)
    if (product.stock > 0) {
      inventory.log({
        productId: product.id,
        product: product.name,
        type: 'in',
        qty: product.stock,
        reason: 'Initial stock'
      })
    }
  }, { message: t('common.saving') })
  ui.notify(`${product.name} created`)
  router.push('/products')
}
</script>

<template>
  <div class="max-w-5xl">
    <PageHeader
      title="Add product"
      subtitle="Create a new product in your catalogue"
      back-to="/products"
    />
    <ProductForm submit-label="Create product" @submit="save" @cancel="router.push('/products')" />
  </div>
</template>
