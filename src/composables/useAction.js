import { useLoadingStore } from '@/stores/loading'

/**
 * Runs a user-triggered mutation behind the centered global loader.
 *
 *   const { run } = useAction()
 *   await run(() => products.removeProduct(row.id), { message: t('common.deleting') })
 *
 * `run` is fire-and-forget safe: it swallows nothing and returns the callback's
 * value, but callers never have to await it for the UI to behave correctly.
 */
export function useAction() {
  const loading = useLoadingStore()

  const run = (fn, options) => loading.runAction(fn, options)

  return { run }
}
