<script setup>
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search product name or SKU…' }
})

const emit = defineEmits(['update:modelValue', 'submit'])
const input = ref(null)

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="flex gap-2">
    <div class="relative grow">
      <Icon
        name="search"
        size="w-4 h-4"
        class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        ref="input"
        :value="modelValue"
        :placeholder="placeholder"
        class="field pl-10"
        @input="emit('update:modelValue', $event.target.value)"
        @keyup.enter="emit('submit')"
      />
    </div>
    <button
      v-if="modelValue"
      class="px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
      title="Clear search"
      @click="emit('update:modelValue', '')"
    >
      <Icon name="x" size="w-4 h-4" />
    </button>
  </div>
</template>
