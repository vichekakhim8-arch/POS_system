<script setup>
import Modal from './Modal.vue'
import Button from './Button.vue'
import Icon from './Icon.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Delete' },
  cancelLabel: { type: String, default: 'Cancel' },
  tone: { type: String, default: 'danger' }, // danger | primary
  loading: { type: Boolean, default: false },
  count: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Modal :open="open" :title="title" size="max-w-md" @close="emit('close')">
    <div class="flex gap-4">
      <span
        class="w-11 h-11 shrink-0 flex items-center justify-center"
        :style="{
          background: `color-mix(in srgb, var(--c-${tone === 'danger' ? 'danger' : 'primary'}) 14%, transparent)`,
          color: `var(--c-${tone === 'danger' ? 'danger' : 'primary'})`,
          borderRadius: 'var(--radius-xl)'
        }"
      >
        <Icon :name="tone === 'danger' ? 'trash' : 'alert'" size="w-5 h-5" />
      </span>

      <div class="min-w-0">
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <slot>{{ message }}</slot>
        </p>
        <p
          v-if="count > 1"
          class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-subtle text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          <Icon name="layers" size="w-3.5 h-3.5" />
          {{ count }} records selected
        </p>
        <p class="mt-2 text-xs text-slate-400">This action cannot be undone.</p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button variant="secondary" block :disabled="loading" @click="emit('close')">
          {{ cancelLabel }}
        </Button>
        <Button
          :variant="tone === 'danger' ? 'danger' : 'primary'"
          block
          :icon="tone === 'danger' ? 'trash' : 'check'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
