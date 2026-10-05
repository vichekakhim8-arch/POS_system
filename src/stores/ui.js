import { defineStore } from 'pinia'
import { uid } from '@/utils/helpers'
import { useThemeStore } from './theme'

/**
 * UI shell state. Theme concerns are delegated to the single global
 * theme store so there is exactly one source of truth for colours/mode.
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem('novapos-collapsed') === '1',
    mobileSidebarOpen: false,
    toasts: []
  }),
  getters: {
    dark: () => useThemeStore().isDark,
    mode: () => useThemeStore().mode
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('novapos-collapsed', this.sidebarCollapsed ? '1' : '0')
    },
    openMobileSidebar() {
      this.mobileSidebarOpen = true
    },
    closeMobileSidebar() {
      this.mobileSidebarOpen = false
    },
    setDark(value) {
      useThemeStore().setMode(value ? 'dark' : 'light')
    },
    toggleDark() {
      useThemeStore().toggleMode()
    },
    setMode(mode) {
      useThemeStore().setMode(mode)
    },
    initTheme() {
      useThemeStore().apply()
    },
    notify(message, type = 'success') {
      const id = uid()
      this.toasts.push({ id, message, type })
      setTimeout(() => this.dismiss(id), 2400)
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    }
  }
})
