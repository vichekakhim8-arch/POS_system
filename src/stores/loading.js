import { defineStore } from 'pinia'

/**
 * Global async tracker.
 *
 * Any operation can register itself by key; the UI reads `isBusy` / `isActive`
 * to show a centered loader. Counting (not a boolean) means overlapping calls
 * can't switch the spinner off early.
 *
 *   const loading = useLoadingStore()
 *   await loading.track('products:fetch', () => api.get('/products'))
 */
export const useLoadingStore = defineStore('loading', {
  state: () => ({
    /** key → pending count */
    tasks: {},
    /** full-screen blocking loader (used for boot / heavy transitions) */
    blocking: false,
    blockingMessage: '',
    /** centered loader driven by runAction() — the "I clicked something" state */
    action: false,
    actionMessage: '',
    /** nested runAction() calls, so the first one to finish can't hide the loader */
    actionCount: 0
  }),

  getters: {
    /** Any async work in flight? */
    isBusy: (state) => Object.values(state.tasks).some((count) => count > 0),
    /** Is this specific key loading? Supports prefix match: `isActive('products')` */
    isActive: (state) => (key) =>
      Object.entries(state.tasks).some(([k, count]) => count > 0 && (k === key || k.startsWith(`${key}:`))),
    activeKeys: (state) => Object.keys(state.tasks).filter((k) => state.tasks[k] > 0)
  },

  actions: {
    start(key = 'global') {
      this.tasks[key] = (this.tasks[key] || 0) + 1
    },

    stop(key = 'global') {
      const next = (this.tasks[key] || 1) - 1
      if (next <= 0) delete this.tasks[key]
      else this.tasks[key] = next
    },

    /**
     * Run an async fn while tracking it. Always clears, even on throw.
     * `minMs` prevents sub-200ms flashes that read as a glitch.
     */
    async track(key, fn, { minMs = 220 } = {}) {
      this.start(key)
      const startedAt = performance.now()
      try {
        return await fn()
      } finally {
        const elapsed = performance.now() - startedAt
        if (elapsed < minMs) await new Promise((r) => setTimeout(r, minMs - elapsed))
        this.stop(key)
      }
    },

    /**
     * Run a user-triggered action behind the centered loader.
     *
     * The work is usually instant (local stores), so `minMs` deliberately holds
     * the spinner long enough to be perceived and to swallow double clicks —
     * a 20ms flash would just look like a stutter.
     */
    async runAction(fn, { message = '', minMs = 420 } = {}) {
      this.actionCount += 1
      this.action = true
      if (message) this.actionMessage = message
      const startedAt = performance.now()
      try {
        return await fn()
      } finally {
        const elapsed = performance.now() - startedAt
        if (elapsed < minMs) await new Promise((r) => setTimeout(r, minMs - elapsed))
        this.actionCount = Math.max(0, this.actionCount - 1)
        if (!this.actionCount) {
          this.action = false
          this.actionMessage = ''
        }
      }
    },

    /** Full-screen blocking overlay — use sparingly. */
    block(message = '') {
      this.blocking = true
      this.blockingMessage = message
    },

    unblock() {
      this.blocking = false
      this.blockingMessage = ''
    },

    reset() {
      this.tasks = {}
      this.action = false
      this.actionMessage = ''
      this.actionCount = 0
      this.unblock()
    }
  }
})
