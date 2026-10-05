import { defineStore } from 'pinia'

/* ------------------------------------------------------------------ utils */
const clamp = (n, min = 0, max = 255) => Math.min(max, Math.max(min, n))

export const normalizeHex = (hex) => {
  let value = String(hex || '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(value))
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value.toLowerCase()}` : null
}

export const hexToRgb = (hex) => {
  const safe = normalizeHex(hex) || '#000000'
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16)
  }
}

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('')}`

/** Mix two hex colors. amount = 0 → a, 1 → b */
export const mix = (a, b, amount) => {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex(
    x.r + (y.r - x.r) * amount,
    x.g + (y.g - x.g) * amount,
    x.b + (y.b - x.b) * amount
  )
}

/** Relative luminance (WCAG) */
export const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  const channel = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export const contrastRatio = (a, b) => {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** Guarantee a readable foreground for any background. */
export const readableOn = (background, light = '#ffffff', dark = '#0f172a') =>
  contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark

/** Build a 50→900 scale from a single brand color. */
export const buildScale = (base) => ({
  50: mix(base, '#ffffff', 0.92),
  100: mix(base, '#ffffff', 0.84),
  200: mix(base, '#ffffff', 0.68),
  300: mix(base, '#ffffff', 0.48),
  400: mix(base, '#ffffff', 0.24),
  500: mix(base, '#ffffff', 0.08),
  600: base,
  700: mix(base, '#000000', 0.16),
  800: mix(base, '#000000', 0.3),
  900: mix(base, '#000000', 0.44)
})

/* --------------------------------------------------------------- defaults */
/**
 * Light palette — warmer, lower-glare canvas with a crisp white card so
 * surfaces separate clearly instead of washing into each other.
 */
export const LIGHT_SURFACES = {
  background: '#f7f8fa',
  card: '#ffffff',
  sidebar: '#ffffff',
  navbar: '#ffffff',
  heading: '#0b1220',
  text: '#3d4759',
  secondaryText: '#55607a',
  mutedText: '#8b95a8',
  border: '#e8ebf0',
  input: '#ffffff',
  inputBorder: '#dfe3ea',
  subtle: '#f3f5f8'
}

export const DARK_SURFACES = {
  background: '#020617',
  card: '#0f172a',
  sidebar: '#0f172a',
  navbar: '#0f172a',
  heading: '#f8fafc',
  text: '#cbd5e1',
  secondaryText: '#cbd5e1',
  mutedText: '#64748b',
  border: '#1e293b',
  input: '#1e293b',
  inputBorder: '#334155',
  subtle: '#1e293b'
}

const BASE = {
  // brand
  primary: '#4f46e5',
  secondary: '#0ea5e9',
  accent: '#f59e0b',
  linkColor: '',
  buttonBackground: '',
  buttonText: '',
  // status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',
  // POS
  posActiveCategory: '',
  posSelectedProduct: '',
  posCartHighlight: '',
  posDiscount: '#ef4444',
  posPaymentSuccess: '#10b981',
  // customer menu / public website
  menuHeader: '',
  menuActiveCategory: '',
  menuProductButton: '',
  menuPrice: '',
  menuPromotion: '#f59e0b',
  menuCheckout: '#10b981',
  // shape
  borderRadius: 'medium',
  buttonStyle: 'soft'
}

export const RADIUS_SCALES = {
  sharp: { sm: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', '3xl': '0px' },
  small: { sm: '2px', md: '4px', lg: '6px', xl: '7px', '2xl': '9px', '3xl': '12px' },
  medium: { sm: '4px', md: '8px', lg: '10px', xl: '12px', '2xl': '16px', '3xl': '22px' },
  large: { sm: '6px', md: '10px', lg: '14px', xl: '18px', '2xl': '24px', '3xl': '30px' },
  xlarge: { sm: '8px', md: '14px', lg: '20px', xl: '26px', '2xl': '32px', '3xl': '40px' }
}

export const RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra large' }
]

export const BUTTON_STYLES = [
  { value: 'square', label: 'Square', radius: '2px' },
  { value: 'soft', label: 'Soft', radius: 'var(--radius-xl)' },
  { value: 'rounded', label: 'Rounded', radius: '9999px' }
]

/* ---------------------------------------------------------------- presets */
export const PRESETS = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    swatch: '#2563eb',
    colors: { primary: '#2563eb', secondary: '#0ea5e9', accent: '#06b6d4' }
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    swatch: '#7c3aed',
    colors: { primary: '#7c3aed', secondary: '#a855f7', accent: '#ec4899' }
  },
  {
    id: 'emerald',
    name: 'Emerald',
    swatch: '#059669',
    colors: { primary: '#059669', secondary: '#10b981', accent: '#84cc16' }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    swatch: '#ea580c',
    colors: { primary: '#ea580c', secondary: '#f59e0b', accent: '#f43f5e' }
  },
  {
    id: 'ruby',
    name: 'Ruby',
    swatch: '#e11d48',
    colors: { primary: '#e11d48', secondary: '#f43f5e', accent: '#a855f7' }
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    swatch: '#111827',
    mode: 'dark',
    colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#22d3ee' },
    dark: { ...DARK_SURFACES, background: '#0b0f1a', card: '#121829', sidebar: '#0d1322', navbar: '#0d1322', border: '#1f2937' }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    swatch: '#334155',
    colors: { primary: '#334155', secondary: '#64748b', accent: '#0ea5e9' },
    light: { ...LIGHT_SURFACES, background: '#fafafa', card: '#ffffff', border: '#ebebeb' },
    borderRadius: 'small'
  }
]

const STORAGE_KEY = 'novapos-theme'

/* ------------------------------------------------------------------ store */
export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'system', // light | dark | system
    systemPrefersDark: false,
    selectedPreset: 'ocean',
    ...BASE,
    light: { ...LIGHT_SURFACES },
    dark: { ...DARK_SURFACES },
    _mediaQuery: null
  }),

  getters: {
    isDark: (state) => (state.mode === 'system' ? state.systemPrefersDark : state.mode === 'dark'),
    surfaces() {
      return this.isDark ? this.dark : this.light
    },
    scale: (state) => buildScale(state.primary),
    /** Effective (auto-derived when left empty) colors. */
    resolved(state) {
      const surfaces = this.surfaces
      return {
        link: state.linkColor || state.primary,
        buttonBackground: state.buttonBackground || state.primary,
        buttonText: state.buttonText || readableOn(state.buttonBackground || state.primary),
        posActiveCategory: state.posActiveCategory || state.primary,
        posSelectedProduct: state.posSelectedProduct || state.primary,
        posCartHighlight: state.posCartHighlight || surfaces.subtle,
        menuHeader: state.menuHeader || state.primary,
        menuActiveCategory: state.menuActiveCategory || state.primary,
        menuProductButton: state.menuProductButton || state.primary,
        menuPrice: state.menuPrice || state.secondary
      }
    },
    /** Accessibility audit for the live customizer. */
    contrastReport(state) {
      const s = this.surfaces
      const checks = [
        { label: 'Heading on background', value: contrastRatio(s.heading, s.background) },
        { label: 'Body text on card', value: contrastRatio(s.text, s.card) },
        { label: 'Muted text on card', value: contrastRatio(s.mutedText, s.card) },
        { label: 'Button text on brand', value: contrastRatio(this.resolved.buttonText, this.resolved.buttonBackground) },
        { label: 'Input text on input', value: contrastRatio(s.text, s.input) }
      ]
      return checks.map((c) => ({
        ...c,
        ratio: c.value.toFixed(2),
        level: c.value >= 4.5 ? 'AA' : c.value >= 3 ? 'AA Large' : 'Fail',
        ok: c.value >= 4.5
      }))
    },
    payload(state) {
      return {
        mode: state.mode,
        selectedPreset: state.selectedPreset,
        primary: state.primary,
        secondary: state.secondary,
        accent: state.accent,
        linkColor: state.linkColor,
        buttonBackground: state.buttonBackground,
        buttonText: state.buttonText,
        success: state.success,
        warning: state.warning,
        danger: state.danger,
        info: state.info,
        posActiveCategory: state.posActiveCategory,
        posSelectedProduct: state.posSelectedProduct,
        posCartHighlight: state.posCartHighlight,
        posDiscount: state.posDiscount,
        posPaymentSuccess: state.posPaymentSuccess,
        menuHeader: state.menuHeader,
        menuActiveCategory: state.menuActiveCategory,
        menuProductButton: state.menuProductButton,
        menuPrice: state.menuPrice,
        menuPromotion: state.menuPromotion,
        menuCheckout: state.menuCheckout,
        borderRadius: state.borderRadius,
        buttonStyle: state.buttonStyle,
        light: { ...state.light },
        dark: { ...state.dark }
      }
    }
  },

  actions: {
    /* ---------------------------------------------------------- lifecycle */
    init() {
      this.load()
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        this.systemPrefersDark = mq.matches
        const handler = (e) => {
          this.systemPrefersDark = e.matches
          if (this.mode === 'system') this.apply()
        }
        mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler)
        this._mediaQuery = mq
      }
      this.apply()
    },

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        const { light, dark, ...rest } = saved
        Object.assign(this, rest)
        if (light) this.light = { ...LIGHT_SURFACES, ...light }
        if (dark) this.dark = { ...DARK_SURFACES, ...dark }
      } catch {
        /* corrupted payload — fall back to defaults */
      }
    },

    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.payload))
    },

    /* ------------------------------------------------------------- apply */
    apply() {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      const set = (name, value) => root.style.setProperty(name, value)
      const dark = this.isDark
      const s = this.surfaces
      const r = this.resolved
      const scale = this.scale

      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'

      // brand scale
      Object.entries(scale).forEach(([step, value]) => set(`--brand-${step}`, value))
      set('--c-primary', this.primary)
      set('--c-secondary', this.secondary)
      set('--c-accent', this.accent)
      set('--c-on-primary', readableOn(this.primary))
      set('--c-on-secondary', readableOn(this.secondary))

      // surfaces
      set('--c-bg', s.background)
      set('--c-card', s.card)
      set('--c-sidebar', s.sidebar)
      set('--c-navbar', s.navbar)
      set('--c-subtle', s.subtle)
      set('--c-border', s.border)
      set('--c-input', s.input)
      set('--c-input-border', s.inputBorder)
      // Borderless control fills — derived so they always match the surface.
      set('--c-field-fill', dark ? mix(s.card, '#ffffff', 0.07) : mix(s.background, '#ffffff', 0.35))
      set('--c-field-fill-hover', dark ? mix(s.card, '#ffffff', 0.12) : mix(s.background, '#ffffff', 0.15))

      // Elevation — light mode needs real (soft) shadows, dark mode needs almost none.
      set(
        '--shadow-card',
        dark
          ? '0 1px 2px rgb(0 0 0 / 0.35)'
          : '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.03)'
      )
      set(
        '--shadow-lift',
        dark
          ? '0 12px 28px -12px rgb(0 0 0 / 0.6)'
          : '0 10px 26px -12px rgb(16 24 40 / 0.16), 0 2px 6px rgb(16 24 40 / 0.04)'
      )
      set('--shadow-pop', dark ? '0 16px 40px -12px rgb(0 0 0 / 0.7)' : '0 16px 40px -14px rgb(16 24 40 / 0.22)')

      // text
      set('--c-heading', s.heading)
      set('--c-text', s.text)
      set('--c-text-secondary', s.secondaryText)
      set('--c-muted', s.mutedText)
      set('--c-link', r.link)

      // buttons
      set('--c-btn-bg', r.buttonBackground)
      set('--c-btn-text', r.buttonText)

      // status
      set('--c-success', this.success)
      set('--c-warning', this.warning)
      set('--c-danger', this.danger)
      set('--c-info', this.info)
      ;[
        ['success', this.success],
        ['warning', this.warning],
        ['danger', this.danger],
        ['info', this.info]
      ].forEach(([name, value]) => {
        set(`--c-${name}-soft`, mix(value, s.card, dark ? 0.86 : 0.88))
        set(`--c-${name}-ink`, dark ? mix(value, '#ffffff', 0.25) : mix(value, '#000000', 0.25))
      })

      // POS
      set('--pos-active-category', r.posActiveCategory)
      set('--pos-active-category-text', readableOn(r.posActiveCategory))
      set('--pos-selected-product', r.posSelectedProduct)
      set('--pos-cart-highlight', r.posCartHighlight)
      set('--pos-discount', this.posDiscount)
      set('--pos-payment-success', this.posPaymentSuccess)

      // customer menu / public website
      set('--menu-header', r.menuHeader)
      set('--menu-header-text', readableOn(r.menuHeader))
      set('--menu-active', r.menuActiveCategory)
      set('--menu-button', r.menuProductButton)
      set('--menu-button-text', readableOn(r.menuProductButton))
      set('--menu-price', r.menuPrice)
      set('--menu-promotion', this.menuPromotion)
      set('--menu-checkout', this.menuCheckout)
      set('--menu-checkout-text', readableOn(this.menuCheckout))

      // charts
      const palette = [
        this.primary,
        this.secondary,
        this.accent,
        this.success,
        this.danger,
        mix(this.primary, '#ffffff', 0.35),
        mix(this.secondary, '#000000', 0.25),
        this.info
      ]
      palette.forEach((color, i) => set(`--chart-${i + 1}`, color))

      // shape
      const radii = RADIUS_SCALES[this.borderRadius] || RADIUS_SCALES.medium
      Object.entries(radii).forEach(([key, value]) => set(`--radius-${key}`, value))
      const button = BUTTON_STYLES.find((b) => b.value === this.buttonStyle) || BUTTON_STYLES[1]
      set('--btn-radius', button.radius)

      this.persist()
    },

    /* ------------------------------------------------------------ setters */
    setMode(mode) {
      this.mode = ['light', 'dark', 'system'].includes(mode) ? mode : 'system'
      this.apply()
    },

    toggleMode() {
      this.setMode(this.isDark ? 'light' : 'dark')
    },

    setColor(key, value) {
      const hex = normalizeHex(value)
      if (!hex) return false
      this[key] = hex
      this.selectedPreset = 'custom'
      this.apply()
      return true
    },

    setSurface(key, value, scope = null) {
      const hex = normalizeHex(value)
      if (!hex) return false
      const target = scope || (this.isDark ? 'dark' : 'light')
      this[target] = { ...this[target], [key]: hex }
      this.selectedPreset = 'custom'
      this.apply()
      return true
    },

    resetColor(key) {
      this[key] = BASE[key] ?? ''
      this.apply()
    },

    resetSurface(key) {
      const target = this.isDark ? 'dark' : 'light'
      const defaults = this.isDark ? DARK_SURFACES : LIGHT_SURFACES
      this[target] = { ...this[target], [key]: defaults[key] }
      this.apply()
    },

    setRadius(value) {
      this.borderRadius = value
      this.apply()
    },

    setButtonStyle(value) {
      this.buttonStyle = value
      this.apply()
    },

    applyPreset(id) {
      const preset = PRESETS.find((p) => p.id === id)
      if (!preset) {
        this.selectedPreset = 'custom'
        return
      }
      Object.assign(this, preset.colors)
      this.light = { ...LIGHT_SURFACES, ...(preset.light || {}) }
      this.dark = { ...DARK_SURFACES, ...(preset.dark || {}) }
      this.borderRadius = preset.borderRadius || BASE.borderRadius
      this.buttonStyle = preset.buttonStyle || BASE.buttonStyle
      if (preset.mode) this.mode = preset.mode
      this.selectedPreset = id
      this.apply()
    },

    resetAll() {
      Object.assign(this, BASE)
      this.light = { ...LIGHT_SURFACES }
      this.dark = { ...DARK_SURFACES }
      this.selectedPreset = 'ocean'
      this.applyPreset('ocean')
    },

    /** Snapshot / restore used by the customizer's cancel + save flow. */
    snapshot() {
      return JSON.parse(JSON.stringify(this.payload))
    },

    restore(snapshot) {
      const { light, dark, ...rest } = snapshot
      Object.assign(this, rest)
      this.light = { ...light }
      this.dark = { ...dark }
      this.apply()
    }
  }
})
