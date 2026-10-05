<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Icon from '@/components/ui/Icon.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import DropdownItem from '@/components/ui/DropdownItem.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { initials, randomInt } from '@/utils/helpers'
import { useAsyncView } from '@/composables/useAsyncView'
import { useAction } from '@/composables/useAction'

const users = useUsersStore()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

/* ───────────────────────────── view state ───────────────────────────── */
const view = ref('cards') // cards | table
const search = ref('')
const roleFilter = ref('All')

const { loading } = useAsyncView('staff')
const { run } = useAction()

const formOpen = ref(false)
const editing = ref(null)
const deleting = ref(null)
const permissionsFor = ref(null)

const form = reactive({ name: '', email: '', phone: '', role: 'Cashier', status: 'Active', pin: '' })
const errors = reactive({ name: '', email: '', pin: '' })

/* ──────────────────────────── derived data ──────────────────────────── */
/** Mock "last active" so the table reads like a real product. */
const lastActive = (user) => {
  const minutes = (user.id * 37) % 2880
  if (minutes < 5) return 'Online now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

const isOnline = (user) => user.status === 'Active' && (user.id * 37) % 2880 < 5

const staff = computed(() =>
  users.items
    .filter((u) => roleFilter.value === 'All' || u.role === roleFilter.value)
    .filter((u) => {
      const term = search.value.trim().toLowerCase()
      return !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    })
    .map((u) => ({ ...u, lastActive: lastActive(u) }))
)

const columns = computed(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'email', label: t('common.email'), sortable: true },
  { key: 'role', label: t('common.role'), sortable: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'lastActive', label: 'Last active' },
  { key: 'actions', label: t('common.actions'), align: 'right', cardHide: true }
])

const exportColumns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last active' },
  { key: 'joined', label: 'Joined' }
]

/* ─────────────────────────────── actions ────────────────────────────── */
const openCreate = (role = 'Cashier') => {
  editing.value = null
  Object.assign(form, {
    name: '',
    email: '',
    phone: '',
    role,
    status: 'Active',
    pin: String(randomInt(1000, 9999))
  })
  Object.assign(errors, { name: '', email: '', pin: '' })
  formOpen.value = true
}

const openEdit = (user) => {
  editing.value = user
  Object.assign(form, { ...user, pin: '' })
  Object.assign(errors, { name: '', email: '', pin: '' })
  formOpen.value = true
}

const validate = () => {
  errors.name = form.name.trim() ? '' : 'Full name is required.'
  errors.email = /^\S+@\S+\.\S+$/.test(form.email) ? '' : 'Enter a valid email address.'
  errors.pin = !editing.value && !/^\d{4,6}$/.test(form.pin) ? 'PIN must be 4–6 digits.' : ''
  return !errors.name && !errors.email && !errors.pin
}

const save = async () => {
  if (!validate()) return ui.notify('Please check the highlighted fields', 'error')
  const payload = { ...form }
  delete payload.pin
  await run(() => {
    if (editing.value) {
      users.update(editing.value.id, payload)
      ui.notify(`${form.name} updated`)
    } else {
      users.add(payload)
      ui.notify(`${form.name} added to ${form.role}`)
    }
  }, { message: t('common.saving') })
  formOpen.value = false
}

const toggleStatus = async (user) => {
  const next = user.status === 'Active' ? 'Inactive' : 'Active'
  await run(() => users.update(user.id, { status: next }), { message: t('common.saving') })
  ui.notify(`${user.name} is now ${next.toLowerCase()}`)
}

const confirmDelete = async () => {
  const user = deleting.value
  if (auth.user?.id === user.id) {
    ui.notify(t('users.cannotDeleteSelf'), 'error')
    deleting.value = null
    return
  }
  await run(() => users.remove(user.id), { message: t('common.deleting') })
  ui.notify(t('users.removed', { name: user.name }))
  deleting.value = null
}

const viewRole = (role) => {
  roleFilter.value = role
  view.value = 'table'
}
</script>

<template>
  <div>
    <PageHeader icon="shield" :title="t('nav.users')" :subtitle="`${users.items.length} team members`">
      <template #actions>
        <!-- Cards ⇄ Table -->
        <div class="segmented">
          <button
            class="segmented-item flex items-center gap-1.5"
            :class="view === 'cards' ? 'segmented-item-active' : ''"
            @click="view = 'cards'"
          >
            <Icon name="layers" size="w-4 h-4" />
            <span class="hidden sm:inline">Roles</span>
          </button>
          <button
            class="segmented-item flex items-center gap-1.5"
            :class="view === 'table' ? 'segmented-item-active' : ''"
            @click="view = 'table'"
          >
            <Icon name="menu" size="w-4 h-4" />
            <span class="hidden sm:inline">All staff</span>
          </button>
        </div>

        <ExportMenu
          filename="staff"
          :title="t('nav.users')"
          :columns="exportColumns"
          :rows="staff"
          :formats="['excel', 'csv']"
        />
        <Button icon="plus" @click="openCreate()">Add staff</Button>
      </template>
    </PageHeader>

    <!-- ═══════════════ Role overview ═══════════════ -->
    <Transition name="page" mode="out-in">
      <div v-if="view === 'cards'" key="cards" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        <article
          v-for="role in users.roles"
          :key="role"
          class="metric p-5 flex flex-col"
        >
          <header class="flex items-start justify-between gap-2">
            <div>
              <Badge :type="role" />
              <p class="mt-2 text-[22px] font-bold text-slate-900 dark:text-white leading-none tabular-nums">
                {{ users.byRole(role).length }}
              </p>
              <p class="text-[11px] text-slate-400 mt-1">
                {{ users.byRole(role).length === 1 ? 'member' : 'members' }}
              </p>
            </div>

            <Dropdown variant="plain" size="sm" width="w-52">
              <template #trigger><Icon name="sliders" size="w-4 h-4" /></template>
              <DropdownItem icon="users" @click="viewRole(role)">View members</DropdownItem>
              <DropdownItem icon="plus" @click="openCreate(role)">Assign user</DropdownItem>
              <DropdownItem icon="shield" @click="permissionsFor = role">Edit permissions</DropdownItem>
            </Dropdown>
          </header>

          <!-- avatar stack with +X overflow -->
          <div class="flex items-center mt-4 min-h-[32px]">
            <template v-if="users.byRole(role).length">
              <span
                v-for="(u, i) in users.byRole(role).slice(0, 3)"
                :key="u.id"
                class="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold text-white
                       ring-2 ring-white dark:ring-slate-900"
                :class="i ? '-ml-2.5' : ''"
                :style="{ background: 'var(--c-primary)' }"
                :title="u.name"
              >
                {{ initials(u.name) }}
              </span>
              <span
                v-if="users.byRole(role).length > 3"
                class="-ml-2.5 h-8 px-2 rounded-full grid place-items-center text-[10px] font-bold
                       ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700
                       text-slate-600 dark:text-slate-200"
                :title="`${users.byRole(role).length - 3} more`"
              >
                +{{ users.byRole(role).length - 3 }}
              </span>
            </template>
            <span v-else class="text-[12px] text-slate-400">No members yet</span>
          </div>

          <ul class="mt-4 space-y-1.5 text-[12.5px] text-slate-600 dark:text-slate-300 grow">
            <li v-for="permission in users.permissions[role]" :key="permission" class="flex items-start gap-2">
              <Icon name="check" size="w-3.5 h-3.5" class="text-emerald-500 shrink-0 mt-[3px]" />
              <span class="leading-snug">{{ permission }}</span>
            </li>
          </ul>

          <button
            type="button"
            class="mt-4 w-full h-9 rounded-xl text-[12.5px] font-semibold transition
                   text-slate-600 dark:text-slate-300 hover:text-brand-600
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                   inline-flex items-center justify-center gap-1.5"
            :style="{ background: 'var(--c-subtle)' }"
            @click="openCreate(role)"
          >
            <Icon name="plus" size="w-3.5 h-3.5" />
            Add member
          </button>
        </article>
      </div>

      <!-- ═══════════════ All staff table ═══════════════ -->
      <DataTable
        v-else
        key="table"
        :columns="columns"
        :rows="staff"
        paginate
        :loading="loading"
        :per-page="10"
        item-label="staff"
        min-width="min-w-[860px]"
        max-height="max-h-[560px]"
        empty-icon="users"
        empty-text="No staff match your search."
      >
        <template #toolbar>
          <div class="flex flex-col sm:flex-row gap-2.5">
            <Input v-model="search" icon="search" placeholder="Search name or email…" class="grow" />
            <Select v-model="roleFilter" :options="['All', ...users.roles]" class="sm:w-44" />
          </div>
        </template>

        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <span class="relative shrink-0">
              <span
                class="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold text-white"
                :style="{ background: 'var(--c-primary)' }"
              >
                {{ initials(row.name) }}
              </span>
              <span
                v-if="isOnline(row)"
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900"
                :style="{ background: 'var(--c-success)' }"
                title="Online now"
              />
            </span>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 dark:text-white truncate">{{ row.name }}</p>
              <p class="text-xs text-slate-400">{{ row.phone || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-email="{ row }">
          <span class="text-slate-500 truncate">{{ row.email }}</span>
        </template>
        <template #cell-role="{ row }"><Badge :type="row.role" /></template>
        <template #cell-status="{ row }"><Badge :type="row.status" dot /></template>
        <template #cell-lastActive="{ row }">
          <span class="text-[12.5px]" :class="isOnline(row) ? 'text-emerald-600 font-semibold' : 'text-slate-400'">
            {{ row.lastActive }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <RowActions
            show-edit
            :edit-label="`${t('common.edit')} ${row.name}`"
            @edit="openEdit(row)"
          >
            <Dropdown variant="plain" size="sm" width="w-52">
              <template #trigger><Icon name="sliders" size="w-4 h-4" /></template>
              <DropdownItem :icon="row.status === 'Active' ? 'x' : 'check'" @click="toggleStatus(row)">
                {{ row.status === 'Active' ? 'Deactivate' : 'Activate' }}
              </DropdownItem>
              <DropdownItem icon="shield" @click="permissionsFor = row.role">View permissions</DropdownItem>
              <div class="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
              <DropdownItem icon="trash" danger @click="deleting = row">Remove</DropdownItem>
            </Dropdown>
          </RowActions>
        </template>
      </DataTable>
    </Transition>

    <!-- ═══════════════ Add / edit staff ═══════════════ -->
    <Modal
      :open="formOpen"
      :title="editing ? 'Edit staff member' : 'Add staff member'"
      :subtitle="editing ? editing.email : 'They can sign in with their email and PIN'"
      size="max-w-md"
      @close="formOpen = false"
    >
      <div class="space-y-4">
        <Input v-model="form.name" :label="t('common.name')" icon="user" required :error="errors.name" />
        <Input
          v-model="form.email"
          :label="t('common.email')"
          type="email"
          icon="mail"
          required
          :error="errors.email"
        />
        <Input v-model="form.phone" :label="t('common.phone')" placeholder="+855 …" />

        <div class="grid sm:grid-cols-2 gap-4">
          <Select v-model="form.role" :label="t('common.role')" :options="users.roles" />
          <Select v-model="form.status" :label="t('common.status')" :options="['Active', 'Inactive']" />
        </div>

        <Input
          v-if="!editing"
          v-model="form.pin"
          label="Terminal PIN"
          icon="lock"
          maxlength="6"
          inputmode="numeric"
          required
          :error="errors.pin"
          hint="4–6 digits, used to unlock the POS terminal"
        />

        <div class="rounded-2xl p-4" :style="{ background: 'var(--c-subtle)' }">
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
            {{ form.role }} permissions
          </p>
          <ul class="space-y-1 text-[13px] text-slate-600 dark:text-slate-300">
            <li v-for="permission in users.permissions[form.role]" :key="permission" class="flex gap-2">
              <Icon name="check" size="w-3.5 h-3.5" class="text-emerald-500 shrink-0 mt-[3px]" />
              {{ permission }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="formOpen = false">{{ t('common.cancel') }}</Button>
          <Button block icon="check" @click="save">
            {{ editing ? t('common.saveChanges') : 'Add staff' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- ═══════════════ Permissions ═══════════════ -->
    <Modal
      :open="!!permissionsFor"
      :title="`${permissionsFor} permissions`"
      size="max-w-md"
      @close="permissionsFor = null"
    >
      <ul v-if="permissionsFor" class="space-y-2">
        <li
          v-for="permission in users.permissions[permissionsFor]"
          :key="permission"
          class="flex items-center gap-3 p-3 rounded-xl"
          :style="{ background: 'var(--c-subtle)' }"
        >
          <span
            class="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            :style="{
              background: 'color-mix(in srgb, var(--c-success) 14%, transparent)',
              color: 'var(--c-success)'
            }"
          >
            <Icon name="check" size="w-3.5 h-3.5" />
          </span>
          <span class="text-[13.5px] text-slate-700 dark:text-slate-200">{{ permission }}</span>
        </li>
      </ul>
      <p class="mt-4 text-xs text-slate-400">
        Permission editing is managed by your plan administrator.
      </p>

      <template #footer>
        <div class="flex gap-2">
          <Button variant="secondary" block @click="permissionsFor = null">{{ t('common.close') }}</Button>
          <Button block icon="plus" @click="openCreate(permissionsFor); permissionsFor = null">
            Assign user
          </Button>
        </div>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      :title="t('users.deleteTitle')"
      :message="t('users.deleteHint', { name: deleting?.name })"
      confirm-label="Remove"
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
