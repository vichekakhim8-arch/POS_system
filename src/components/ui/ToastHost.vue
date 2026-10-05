<script setup>
import { useUiStore } from '@/stores/ui'
import Icon from './Icon.vue'

const ui = useUiStore()
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] space-y-2 w-[min(92vw,22rem)]">
      <TransitionGroup
        enter-active-class="transition duration-250 ease-out"
        enter-from-class="opacity-0 translate-x-8"
        leave-active-class="transition duration-200 ease-in absolute"
        leave-to-class="opacity-0 translate-x-8"
        move-class="transition duration-200"
      >
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="flex items-center gap-3 pl-3 pr-3.5 py-3 rounded-2xl shadow-lg shadow-slate-900/15 border text-sm font-medium backdrop-blur bg-white/95 dark:bg-slate-800/95"
          :class="
            toast.type === 'error'
              ? 'border-rose-200 dark:border-rose-500/30'
              : 'border-emerald-200 dark:border-emerald-500/30'
          "
        >
          <span
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            :class="
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15'
            "
          >
            <Icon :name="toast.type === 'error' ? 'alert' : 'check'" size="w-4 h-4" stroke-width="2.4" />
          </span>
          <span class="grow text-slate-700 dark:text-slate-100">{{ toast.message }}</span>
          <button class="text-slate-400 hover:text-slate-600 shrink-0" @click="ui.dismiss(toast.id)">
            <Icon name="x" size="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
