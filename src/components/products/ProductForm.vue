<script setup>
import { reactive, ref } from 'vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
import { placeholderImage } from '@/utils/helpers'

const props = defineProps({
  product: { type: Object, default: null },
  submitLabel: { type: String, default: 'Save product' }
})

const emit = defineEmits(['submit', 'cancel'])

const products = useProductsStore()
const settings = useSettingsStore()

const form = reactive({
  name: props.product?.name ?? '',
  sku: props.product?.sku ?? `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
  category: props.product?.category ?? products.categoryNames[0] ?? '',
  price: props.product?.price ?? '',
  cost: props.product?.cost ?? '',
  stock: props.product?.stock ?? 0,
  lowStock: props.product?.lowStock ?? settings.lowStockDefault,
  image: props.product?.image ?? '',
  description: props.product?.description ?? '',
  status: props.product?.status ?? 'Active'
})

const errors = reactive({ name: '', price: '' })

const fileInput = ref(null)

const onFile = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => (form.image = reader.result)
  reader.readAsDataURL(file)
}

const useAutoImage = () => {
  if (!form.name) return
  form.image = placeholderImage(form.name)
}

const submit = () => {
  errors.name = form.name.trim() ? '' : 'Product name is required.'
  errors.price = Number(form.price) > 0 ? '' : 'Selling price must be greater than zero.'
  if (errors.name || errors.price) return
  emit('submit', { ...form, image: form.image || placeholderImage(form.name) })
}
</script>

<template>
  <form class="grid lg:grid-cols-3 gap-5" @submit.prevent="submit">
    <div class="card p-5 lg:col-span-2 space-y-4">
      <h3 class="font-semibold text-slate-900 dark:text-white">General information</h3>

      <Input v-model="form.name" label="Product name *" placeholder="e.g. Espresso Blend 250g" :error="errors.name" />

      <div class="grid sm:grid-cols-2 gap-4">
        <Input v-model="form.sku" label="SKU" placeholder="SKU-1000" />
        <Select v-model="form.category" label="Category" :options="products.categoryNames" />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <Input
          v-model="form.price"
          label="Selling price *"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :error="errors.price"
        />
        <Input v-model="form.cost" label="Cost price" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <Input v-model="form.stock" label="Stock quantity" type="number" min="0" />
        <Input
          v-model="form.lowStock"
          label="Low stock alert"
          type="number"
          min="0"
          hint="Trigger an alert at or below this level"
        />
      </div>

      <Input v-model="form.description" label="Description" :rows="4" placeholder="Short product description…" />
    </div>

    <div class="space-y-5">
      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-4">Product image</h3>
        <div
          class="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center"
        >
          <img v-if="form.image" :src="form.image" alt="Preview" class="w-full h-full object-cover" />
          <div v-else class="text-center text-slate-400 p-4">
            <Icon name="box" size="w-8 h-8" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">No image selected</p>
          </div>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
        <Button variant="secondary" block icon="download" class="mt-3" @click="fileInput?.click()">
          Upload image
        </Button>
        <Button variant="ghost" block class="mt-2" :disabled="!form.name" @click="useAutoImage">
          Use auto image
        </Button>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-4">Status</h3>
        <Select v-model="form.status" :options="['Active', 'Inactive']" />
        <p class="text-xs text-slate-400 mt-2">
          Inactive products stay in the catalogue but are flagged for the cashier.
        </p>
      </div>

      <div class="flex gap-2">
        <Button variant="secondary" block @click="emit('cancel')">Cancel</Button>
        <Button type="submit" block icon="check">{{ submitLabel }}</Button>
      </div>
    </div>
  </form>
</template>
