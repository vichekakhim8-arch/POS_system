import { computed, ref, watch } from 'vue'

export const PER_PAGE_OPTIONS = [10, 25, 50, 100]

/**
 * Reusable pagination engine shared by every dashboard table.
 *
 * Client mode  → slices the provided rows locally.
 * Server mode  → emits `onChange({ page, perPage })` so the caller can fetch
 *                `GET /api/resource?page=1&per_page=10` and feed the Laravel-style
 *                response back through `syncFromResponse()`.
 *
 * @param {Ref<Array>|Function} source reactive rows (client mode)
 * @param {Object}   options
 * @param {Boolean}  options.server     use server-side pagination
 * @param {Number}   options.perPage    initial rows per page
 * @param {Array}    options.watchKeys  reactive sources that reset to page 1
 * @param {Function} options.onChange   called with { page, perPage } in server mode
 */
export function usePagination(source, options = {}) {
  const {
    server = false,
    perPage: initialPerPage = 10,
    watchKeys = [],
    onChange = null
  } = options

  const page = ref(1)
  const perPage = ref(initialPerPage)
  const loading = ref(false)

  /** Server-reported meta — mirrors the documented API contract. */
  const meta = ref({
    data: [],
    current_page: 1,
    per_page: initialPerPage,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0
  })

  const allRows = computed(() => {
    if (server) return meta.value.data || []
    const value = typeof source === 'function' ? source() : source?.value
    return Array.isArray(value) ? value : []
  })

  const total = computed(() => (server ? meta.value.total : allRows.value.length))
  const lastPage = computed(() =>
    server ? Math.max(1, meta.value.last_page) : Math.max(1, Math.ceil(total.value / perPage.value))
  )

  const rows = computed(() => {
    if (server) return allRows.value
    const start = (page.value - 1) * perPage.value
    return allRows.value.slice(start, start + perPage.value)
  })

  const from = computed(() => {
    if (!total.value) return 0
    return server ? meta.value.from : (page.value - 1) * perPage.value + 1
  })

  const to = computed(() => {
    if (!total.value) return 0
    return server ? meta.value.to : Math.min(page.value * perPage.value, total.value)
  })

  const isEmpty = computed(() => !loading.value && total.value === 0)

  /* ----------------------------------------------------------- navigation */
  const emitChange = () => {
    if (server && typeof onChange === 'function') {
      onChange({ page: page.value, perPage: perPage.value })
    }
  }

  const goTo = (target) => {
    const next = Math.min(Math.max(1, Number(target) || 1), lastPage.value)
    if (next === page.value) return
    page.value = next
    emitChange()
  }

  const next = () => goTo(page.value + 1)
  const prev = () => goTo(page.value - 1)
  const first = () => goTo(1)
  const last = () => goTo(lastPage.value)

  const setPerPage = (value) => {
    const size = Number(value) || initialPerPage
    if (size === perPage.value) return
    perPage.value = size
    page.value = 1
    emitChange()
  }

  /** Hydrate from an API response that follows the documented shape. */
  const syncFromResponse = (response = {}) => {
    meta.value = {
      data: response.data ?? [],
      current_page: response.current_page ?? 1,
      per_page: response.per_page ?? perPage.value,
      total: response.total ?? 0,
      last_page: response.last_page ?? 1,
      from: response.from ?? 0,
      to: response.to ?? 0
    }
    page.value = meta.value.current_page
    perPage.value = meta.value.per_page
  }

  /* --------------------------------------------- reset on search / filters */
  if (watchKeys.length) {
    watch(watchKeys, () => {
      if (page.value !== 1) {
        page.value = 1
        emitChange()
      }
    })
  }

  // Never strand the user on a page that no longer exists.
  watch(lastPage, (value) => {
    if (page.value > value) goTo(value)
  })

  return {
    page,
    perPage,
    loading,
    rows,
    total,
    lastPage,
    from,
    to,
    isEmpty,
    meta,
    goTo,
    next,
    prev,
    first,
    last,
    setPerPage,
    syncFromResponse
  }
}

/**
 * Build a compact page list with ellipses.
 * Desktop → 7 slots · Mobile → 5 slots
 * e.g. [1, '…', 4, 5, 6, '…', 20]
 */
export function buildPageList(current, lastPage, slots = 7) {
  if (lastPage <= slots) return Array.from({ length: lastPage }, (_, i) => i + 1)

  const side = Math.floor((slots - 3) / 2)
  const pages = [1]

  let start = Math.max(2, current - side)
  let end = Math.min(lastPage - 1, current + side)

  if (current - side <= 2) end = slots - 1
  if (current + side >= lastPage - 1) start = lastPage - slots + 2

  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < lastPage - 1) pages.push('…')

  pages.push(lastPage)
  return pages
}
