<script setup>
import { onBeforeUnmount, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'max-w-lg' },
  closable: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

const close = () => props.closable && emit('close')

const onKey = (e) => {
  if (e.key === 'Escape') close()
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close" />
        <div
          class="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col"
          :class="size"
          role="dialog"
          aria-modal="true"
        >
          <header
            class="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0"
          >
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
              <p v-if="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
            </div>
            <button
              v-if="closable"
              class="p-2 -mr-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="close"
            >
              <Icon name="x" size="w-4 h-4" />
            </button>
          </header>

          <div class="p-5 overflow-y-auto grow">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
