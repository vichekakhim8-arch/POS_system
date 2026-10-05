import { onMounted, ref } from 'vue'
import { useLoadingStore } from '@/stores/loading'

/**
 * Gives any view a consistent loading / error lifecycle.
 *
 *   const { loading, error, run, reload } = useAsyncView('orders', async () => {
 *     // fetch or simulate
 *   })
 *
 * Views that only read from Pinia (current mock setup) still benefit: the
 * initial paint shows a centered loader so the page never flashes empty.
 */
export function useAsyncView(key, loader = null, { immediate = true, minMs = 260 } = {}) {
  const store = useLoadingStore()

  const loading = ref(immediate)
  const error = ref('')

  const run = async (fn = loader) => {
    if (typeof fn !== 'function') {
      loading.value = false
      return
    }
    loading.value = true
    error.value = ''
    try {
      await store.track(key, fn, { minMs })
    } catch (e) {
      error.value = e?.message || 'Something went wrong. Please try again.'
    } finally {
      loading.value = false
    }
  }

  /** Re-run the original loader (used by error-state retry buttons). */
  const reload = () => run(loader)

  if (immediate) {
    onMounted(() => {
      // No loader supplied → simply let the first frame settle, then reveal.
      if (typeof loader !== 'function') {
        setTimeout(() => (loading.value = false), minMs)
      } else {
        run()
      }
    })
  }

  return { loading, error, run, reload }
}
