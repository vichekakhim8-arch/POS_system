<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Slim top progress bar for route changes.
 * Only appears if navigation takes longer than 120ms, so fast
 * transitions never flash a bar.
 */
const router = useRouter()

const visible = ref(false)
const progress = ref(0)
let showTimer = null
let tickTimer = null
let hideTimer = null

const clearAll = () => {
  clearTimeout(showTimer)
  clearInterval(tickTimer)
  clearTimeout(hideTimer)
}

const start = () => {
  clearAll()
  showTimer = setTimeout(() => {
    visible.value = true
    progress.value = 12
    tickTimer = setInterval(() => {
      // ease toward 90% — never completes until navigation resolves
      progress.value = Math.min(90, progress.value + (90 - progress.value) * 0.18)
    }, 120)
  }, 120)
}

const done = () => {
  clearAll()
  if (!visible.value) return
  progress.value = 100
  hideTimer = setTimeout(() => {
    visible.value = false
    progress.value = 0
  }, 240)
}

router.beforeEach((to, from, next) => {
  if (to.path !== from.path) start()
  next()
})
router.afterEach(done)
router.onError(done)

onBeforeUnmount(clearAll)
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-300"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" class="fixed top-0 inset-x-0 z-[100] h-[3px] pointer-events-none">
      <div
        class="h-full rounded-r-full transition-[width] duration-200 ease-out"
        :style="{
          width: `${progress}%`,
          background: 'var(--c-primary)',
          boxShadow: '0 0 12px color-mix(in srgb, var(--c-primary) 65%, transparent)'
        }"
      />
    </div>
  </Transition>
</template>
