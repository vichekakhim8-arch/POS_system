<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

/**
 * Row action group for DataTable cells.
 *
 * - 34px targets with tooltips and aria-labels (tap-friendly on tablets).
 * - Delete keeps a faint danger tint at rest, so it reads as destructive
 *   before hover. A grey icon that only turns red on hover is easy to miss
 *   and easy to mis-tap — and mis-taps here destroy records.
 * - Anything not listed can go in the default slot and inherits the spacing.
 *
 *   <RowActions
 *     show-edit
 *     show-delete
 *     :edit-label="t('common.edit')"
 *     @edit="router.push(`/products/${row.id}/edit`)"
 *     @delete="deleting = row"
 *   />
 */
const props = defineProps({
  showView: { type: Boolean, default: false },
  showEdit: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: false },
  viewLabel: { type: String, default: 'View' },
  editLabel: { type: String, default: 'Edit' },
  deleteLabel: { type: String, default: 'Delete' },
  align: { type: String, default: 'right' } // right | center
})

const emit = defineEmits(['view', 'edit', 'delete'])

const hasAny = computed(() => props.showView || props.showEdit || props.showDelete)

const dangerTint = 'color-mix(in srgb, var(--c-danger) 11%, transparent)'
const dangerSolid = 'var(--c-danger)'
</script>

<template>
  <div
    v-if="hasAny || $slots.default"
    class="flex items-center gap-1"
    :class="align === 'center' ? 'justify-center' : 'justify-end'"
    @click.stop
  >
    <button
      v-if="showView"
      type="button"
      class="w-[34px] h-[34px] grid place-items-center rounded-lg text-slate-400 transition
             hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10
             focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :title="viewLabel"
      :aria-label="viewLabel"
      data-loading-key="common.loading"
      @click="emit('view')"
    >
      <Icon name="eye" size="w-4 h-4" />
    </button>

    <button
      v-if="showEdit"
      type="button"
      class="w-[34px] h-[34px] grid place-items-center rounded-lg text-slate-400 transition
             hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10
             focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
      :title="editLabel"
      :aria-label="editLabel"
      data-loading-key="common.loading"
      @click="emit('edit')"
    >
      <Icon name="edit" size="w-4 h-4" />
    </button>

    <button
      v-if="showDelete"
      type="button"
      class="w-[34px] h-[34px] grid place-items-center rounded-lg transition
             hover:brightness-90 active:scale-95
             focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/25"
      :style="{ background: dangerTint, color: dangerSolid }"
      :title="deleteLabel"
      :aria-label="deleteLabel"
      data-loading-key="common.deleting"
      @click="emit('delete')"
    >
      <Icon name="trash" size="w-4 h-4" />
    </button>

    <slot />
  </div>
</template>
