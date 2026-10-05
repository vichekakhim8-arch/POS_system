<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  align: { type: String, default: 'right' }, // left | right
  width: { type: String, default: 'w-60' },
  variant: { type: String, default: 'secondary' }, // primary | secondary | ghost | plain
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
})

const open = ref(false)
const root = ref(null)

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white border border-transparent shadow-sm shadow-brand-600/20',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:text-brand-600',
  ghost:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700',
  plain: 'bg-transparent text-slate-500 hover:text-brand-600 border border-transparent'
}

const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-3.5 py-2.5 text-sm' }

const close = () => (open.value = false)
const toggle = () => !props.disabled && (open.value = !open.value)

const onOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) close()
}
const onKey = (e) => e.key === 'Escape' && close()

onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutside)
  document.removeEventListener('keydown', onKey)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button
      type="button"
      :disabled="disabled"
      data-no-loader
      class="inline-flex items-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:opacity-40"
      :class="[variants[variant], sizes[size]]"
      @click="toggle"
    >
      <Icon v-if="icon" :name="icon" size="w-4 h-4" />
      <slot name="trigger">{{ label }}</slot>
      <Icon
        name="chevronRight"
        size="w-3.5 h-3.5"
        class="transition-transform duration-200 opacity-60"
        :class="open ? '-rotate-90' : 'rotate-90'"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[.98]"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 -translate-y-1 scale-[.98]"
    >
      <div
        v-if="open"
        class="absolute z-50 mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 p-1.5 max-h-[70vh] overflow-y-auto"
        :class="[width, align === 'right' ? 'right-0' : 'left-0']"
        @click="close"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
