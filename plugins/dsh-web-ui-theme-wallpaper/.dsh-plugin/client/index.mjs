import { createElement as h, useEffect, useState } from 'react'

export const name = 'dsh-web-ui-theme-wallpaper'
export const inject = ['slots', 'theme']

export const STORAGE_KEY = 'dsh-web-ui-theme-wallpaper:v1'
export const WALLPAPER_ROOT_ID = 'dsh-web-ui-theme-wallpaper-root'

export const THEMES = Object.freeze([
  {
    id: 'dsh-midnight',
    label: '午夜蓝',
    description: '深海蓝底与冷紫强调色，适合长时间工作。',
    colorScheme: 'dark',
    swatch: ['#0b1225', '#172951', '#8f7bff'],
    tokens: {
      '--dsw-alias-bg-base': '#0b1225',
      '--dsw-alias-bg-layer-1': '#111c35',
      '--dsw-alias-bg-layer-2': '#172545',
      '--dsw-alias-bg-overlay': '#182642',
      '--dsw-alias-border-l1': 'rgba(147, 174, 229, .16)',
      '--dsw-alias-border-l2': 'rgba(147, 174, 229, .28)',
      '--dsw-alias-brand-primary': '#8f7bff',
      '--dsw-alias-label-primary': '#edf3ff',
      '--dsw-alias-label-secondary': '#a9b9d9',
      '--dsw-specific-sidebar-fill': '#0d172c',
    },
  },
  {
    id: 'dsh-sakura',
    label: '樱花',
    description: '暖白底、柔粉边框和莓红强调色。',
    colorScheme: 'light',
    swatch: ['#fff8fb', '#ffe6ef', '#c34576'],
    tokens: {
      '--dsw-alias-bg-base': '#fff8fb',
      '--dsw-alias-bg-layer-1': '#fffdfd',
      '--dsw-alias-bg-layer-2': '#ffeef4',
      '--dsw-alias-bg-overlay': '#fffafd',
      '--dsw-alias-border-l1': 'rgba(174, 79, 116, .16)',
      '--dsw-alias-border-l2': 'rgba(174, 79, 116, .28)',
      '--dsw-alias-brand-primary': '#c34576',
      '--dsw-alias-label-primary': '#321b28',
      '--dsw-alias-label-secondary': '#765264',
      '--dsw-specific-sidebar-fill': '#fff1f6',
    },
  },
  {
    id: 'dsh-emerald',
    label: '翡翠',
    description: '低饱和墨绿工作台，减少高亮色干扰。',
    colorScheme: 'dark',
    swatch: ['#0d1c1a', '#15372f', '#4ec9a1'],
    tokens: {
      '--dsw-alias-bg-base': '#0d1c1a',
      '--dsw-alias-bg-layer-1': '#112723',
      '--dsw-alias-bg-layer-2': '#17342e',
      '--dsw-alias-bg-overlay': '#17312c',
      '--dsw-alias-border-l1': 'rgba(118, 212, 177, .16)',
      '--dsw-alias-border-l2': 'rgba(118, 212, 177, .29)',
      '--dsw-alias-brand-primary': '#4ec9a1',
      '--dsw-alias-label-primary': '#e9fff6',
      '--dsw-alias-label-secondary': '#9cc8ba',
      '--dsw-specific-sidebar-fill': '#0e2420',
    },
  },
  {
    id: 'dsh-paper',
    label: '纸张',
    description: '柔和米白与青灰色，适合文档和阅读。',
    colorScheme: 'light',
    swatch: ['#f6f4ee', '#ffffff', '#476b78'],
    tokens: {
      '--dsw-alias-bg-base': '#f6f4ee',
      '--dsw-alias-bg-layer-1': '#ffffff',
      '--dsw-alias-bg-layer-2': '#eef2f1',
      '--dsw-alias-bg-overlay': '#ffffff',
      '--dsw-alias-border-l1': 'rgba(61, 88, 96, .16)',
      '--dsw-alias-border-l2': 'rgba(61, 88, 96, .28)',
      '--dsw-alias-brand-primary': '#476b78',
      '--dsw-alias-label-primary': '#1f2b2d',
      '--dsw-alias-label-secondary': '#5e7073',
      '--dsw-specific-sidebar-fill': '#eceae3',
    },
  },
])

export const WALLPAPERS = Object.freeze([
  { id: 'none', label: '无壁纸', description: '使用主题本身的背景。', background: 'linear-gradient(135deg, #101827, #17213b)' },
  { id: 'aurora', label: '极光', description: '蓝紫极光与柔和光晕。', background: 'radial-gradient(circle at 18% 18%, rgba(93, 179, 255, .8), transparent 34%), radial-gradient(circle at 80% 10%, rgba(184, 105, 255, .65), transparent 34%), linear-gradient(135deg, #081528, #161634 56%, #0b1e2b)' },
  { id: 'night-grid', label: '夜网格', description: '低对比网格，适合代码工作区。', background: 'linear-gradient(rgba(93, 142, 214, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 142, 214, .12) 1px, transparent 1px), linear-gradient(135deg, #08111f, #111d32)', size: '42px 42px, 42px 42px, auto' },
  { id: 'paper-light', label: '纸张纹理', description: '暖白纸张的细密渐变。', background: 'radial-gradient(rgba(62, 74, 78, .12) .7px, transparent .7px), linear-gradient(135deg, #f8f5ed, #dfe9e5)', size: '8px 8px, auto' },
])

const DEFAULT_SETTINGS = Object.freeze({
  wallpaper: 'aurora',
  customSource: '',
  opacity: 0.48,
  blur: 0,
  overlay: '#07111f',
  overlayOpacity: 0.32,
  accent: '#8f7bff',
})

let currentSettings = loadStoredSettings()
const settingsListeners = new Set()
let accentDisposer = null

const CSS = `
body { isolation: isolate; }
body > *:not(#${WALLPAPER_ROOT_ID}) { position: relative; z-index: 1; }
#${WALLPAPER_ROOT_ID} { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: #101827; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-image, #${WALLPAPER_ROOT_ID} .dsh-wuw-overlay { position: absolute; inset: -24px; pointer-events: none; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-image { background-position: center; background-repeat: no-repeat; background-size: cover; transform: scale(1.04); transition: background .24s ease, opacity .24s ease, filter .24s ease; }
#${WALLPAPER_ROOT_ID} .dsh-wuw-overlay { background: #07111f; transition: background .24s ease, opacity .24s ease; }
.dsh-wuw-panel { color: var(--dsw-alias-label-primary, #e8edf7); padding: 4px 0 24px; max-width: 900px; }
.dsh-wuw-intro { color: var(--dsw-alias-label-secondary, #9aa9c2); margin: 0 0 18px; line-height: 1.6; }
.dsh-wuw-block { border-top: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); padding: 18px 0 4px; }
.dsh-wuw-block h3 { margin: 0 0 5px; font-size: 14px; font-weight: 650; }
.dsh-wuw-hint { margin: 0 0 12px; color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 12px; line-height: 1.5; }
.dsh-wuw-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.dsh-wuw-card { display: flex; gap: 10px; text-align: left; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); background: var(--dsw-alias-bg-layer-1, rgba(20,30,51,.8)); color: inherit; border-radius: 7px; padding: 11px; cursor: pointer; min-height: 74px; transition: border-color .18s ease, transform .18s ease, background .18s ease; }
.dsh-wuw-card:hover { transform: translateY(-1px); border-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-card.is-active { border-color: var(--dsw-alias-brand-primary, #8f7bff); box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary, #8f7bff) 50%, transparent); }
.dsh-wuw-swatch { flex: 0 0 48px; height: 48px; border-radius: 5px; border: 1px solid rgba(255,255,255,.22); }
.dsh-wuw-card-copy { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.dsh-wuw-card-title { font-size: 13px; font-weight: 650; }
.dsh-wuw-card-desc { color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 11px; line-height: 1.35; }
.dsh-wuw-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; }
.dsh-wuw-row label { color: var(--dsw-alias-label-secondary, #9aa9c2); font-size: 12px; }
.dsh-wuw-row input[type=file] { max-width: 220px; font-size: 12px; }
.dsh-wuw-row input[type=url] { min-width: min(420px, 100%); flex: 1; border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.12)); border-radius: 5px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-2, rgba(20,30,51,.8)); color: inherit; }
.dsh-wuw-action, .dsh-wuw-reset { border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.2)); border-radius: 5px; padding: 7px 12px; background: var(--dsw-alias-bg-layer-2, rgba(20,30,51,.8)); color: inherit; cursor: pointer; font: inherit; font-size: 12px; }
.dsh-wuw-action:hover, .dsh-wuw-reset:hover { border-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-range { display: grid; grid-template-columns: 110px minmax(120px, 1fr) 48px; gap: 8px; align-items: center; width: min(520px, 100%); margin-top: 12px; font-size: 12px; color: var(--dsw-alias-label-secondary, #9aa9c2); }
.dsh-wuw-range input { width: 100%; accent-color: var(--dsw-alias-brand-primary, #8f7bff); }
.dsh-wuw-color { width: 34px; height: 27px; border: 0; padding: 0; background: transparent; }
.dsh-wuw-status { min-height: 20px; margin-top: 10px; color: var(--dsw-alias-brand-primary, #8f7bff); font-size: 12px; }
@media (max-width: 620px) { .dsh-wuw-range { grid-template-columns: 94px minmax(90px, 1fr) 44px; } .dsh-wuw-grid { grid-template-columns: 1fr; } }
`

function storage() {
  try { return globalThis.localStorage } catch { return null }
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

export function safeWallpaperSource(value) {
  if (typeof value !== 'string' || value.length > 8 * 1024 * 1024) return ''
  if (/^https:\/\//i.test(value)) return value
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)) return value
  return ''
}

export function normalizeSettings(value) {
  const candidate = value && typeof value === 'object' ? value : {}
  const wallpaper = [...WALLPAPERS.map(item => item.id), 'custom'].includes(candidate.wallpaper)
    ? candidate.wallpaper
    : DEFAULT_SETTINGS.wallpaper
  const opacity = Number(candidate.opacity)
  const blur = Number(candidate.blur)
  const overlayOpacity = Number(candidate.overlayOpacity)
  return {
    wallpaper,
    customSource: safeWallpaperSource(candidate.customSource),
    opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : DEFAULT_SETTINGS.opacity,
    blur: Number.isFinite(blur) ? Math.min(20, Math.max(0, blur)) : DEFAULT_SETTINGS.blur,
    overlay: isHexColor(candidate.overlay) ? candidate.overlay : DEFAULT_SETTINGS.overlay,
    overlayOpacity: Number.isFinite(overlayOpacity) ? Math.min(0.9, Math.max(0, overlayOpacity)) : DEFAULT_SETTINGS.overlayOpacity,
    accent: isHexColor(candidate.accent) ? candidate.accent : DEFAULT_SETTINGS.accent,
  }
}

function loadStoredSettings() {
  const value = storage()?.getItem(STORAGE_KEY)
  if (value === null || value === undefined) return { ...DEFAULT_SETTINGS }
  try { return normalizeSettings(JSON.parse(value)) } catch { return { ...DEFAULT_SETTINGS } }
}

function persistSettings() {
  try { storage()?.setItem(STORAGE_KEY, JSON.stringify(currentSettings)) } catch { /* private mode or quota */ }
}

function cssUrl(value) {
  return `url("${String(value).replace(/["\\\r\n]/g, char => `\\${char}`)}")`
}

export function wallpaperPresentation(value = currentSettings) {
  const settings = normalizeSettings(value)
  const preset = WALLPAPERS.find(item => item.id === settings.wallpaper)
  const backgroundImage = settings.wallpaper === 'custom' && settings.customSource !== ''
    ? cssUrl(settings.customSource)
    : (preset?.background ?? WALLPAPERS[0].background)
  return {
    backgroundImage,
    backgroundSize: preset?.size ?? 'cover',
    opacity: settings.wallpaper === 'none' ? 0 : settings.opacity,
    blur: settings.blur,
    overlay: settings.overlay,
    overlayOpacity: settings.overlayOpacity,
  }
}

function ensureWallpaperRoot() {
  if (typeof document === 'undefined' || document.body === null) return null
  let style = document.getElementById(`${WALLPAPER_ROOT_ID}-styles`)
  if (style === null) {
    style = document.createElement('style')
    style.id = `${WALLPAPER_ROOT_ID}-styles`
    style.textContent = CSS
    document.head.append(style)
  }
  let root = document.getElementById(WALLPAPER_ROOT_ID)
  if (root === null) {
    root = document.createElement('div')
    root.id = WALLPAPER_ROOT_ID
    root.setAttribute('aria-hidden', 'true')
    root.innerHTML = '<div class="dsh-wuw-image"></div><div class="dsh-wuw-overlay"></div>'
    document.body.prepend(root)
  }
  return root
}

export function applyWallpaper(value = currentSettings) {
  const root = ensureWallpaperRoot()
  if (root === null) return
  const presentation = wallpaperPresentation(value)
  const image = root.querySelector('.dsh-wuw-image')
  const overlay = root.querySelector('.dsh-wuw-overlay')
  if (!(image instanceof HTMLElement) || !(overlay instanceof HTMLElement)) return
  image.style.backgroundImage = presentation.backgroundImage
  image.style.backgroundSize = presentation.backgroundSize
  image.style.opacity = String(presentation.opacity)
  image.style.filter = `blur(${presentation.blur}px) saturate(1.08)`
  overlay.style.background = presentation.overlay
  overlay.style.opacity = String(presentation.overlayOpacity)
  root.dataset.wallpaper = value.wallpaper
}

function updateSettings(patch) {
  currentSettings = normalizeSettings({ ...currentSettings, ...patch })
  persistSettings()
  applyWallpaper(currentSettings)
  for (const listener of settingsListeners) listener(currentSettings)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(typeof reader.result === 'string' ? reader.result : ''))
    reader.addEventListener('error', () => reject(reader.error ?? new Error('读取图片失败')))
    reader.readAsDataURL(file)
  })
}

function swatchStyle(colors) {
  return { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 55%, ${colors[2]})` }
}

function ThemeCard({ theme, active, onClick }) {
  return h('button', { type: 'button', className: `dsh-wuw-card${active ? ' is-active' : ''}`, onClick },
    h('span', { className: 'dsh-wuw-swatch', style: swatchStyle(theme.swatch), 'aria-hidden': 'true' }),
    h('span', { className: 'dsh-wuw-card-copy' },
      h('span', { className: 'dsh-wuw-card-title' }, theme.label),
      h('span', { className: 'dsh-wuw-card-desc' }, theme.description),
      active ? h('span', { className: 'dsh-wuw-card-desc' }, '使用中') : null,
    ),
  )
}

function WallpaperCard({ wallpaper, active, onClick }) {
  return h('button', { type: 'button', className: `dsh-wuw-card${active ? ' is-active' : ''}`, onClick },
    h('span', { className: 'dsh-wuw-swatch', style: { background: wallpaper.background, backgroundSize: wallpaper.size ?? 'cover' }, 'aria-hidden': 'true' }),
    h('span', { className: 'dsh-wuw-card-copy' },
      h('span', { className: 'dsh-wuw-card-title' }, wallpaper.label),
      h('span', { className: 'dsh-wuw-card-desc' }, wallpaper.description),
      active ? h('span', { className: 'dsh-wuw-card-desc' }, '使用中') : null,
    ),
  )
}

function ThemeWallpaperSection({ ctx, theme }) {
  const [state, setState] = useState(currentSettings)
  const [snapshot, setSnapshot] = useState(() => theme.getTheme?.() ?? null)
  const [urlDraft, setUrlDraft] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const listener = next => setState(next)
    settingsListeners.add(listener)
    return () => settingsListeners.delete(listener)
  }, [])

  useEffect(() => {
    if (typeof ctx.on !== 'function') return undefined
    return ctx.on('theme/change', next => setSnapshot(next))
  }, [ctx])

  const change = patch => {
    updateSettings(patch)
    setStatus('设置已保存')
  }
  const activeTheme = snapshot?.preference ?? 'system'
  const chooseTheme = id => {
    try {
      theme.setTheme(id)
      setStatus(`已切换到${id === 'system' ? '系统主题' : (THEMES.find(item => item.id === id)?.label ?? id)}`)
    } catch (error) { setStatus(`主题切换失败：${String(error)}`) }
  }
  const chooseFile = async event => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file === undefined) return
    if (!file.type.startsWith('image/')) { setStatus('请选择图片文件'); return }
    if (file.size > 5 * 1024 * 1024) { setStatus('图片不能超过 5 MB'); return }
    try {
      const source = safeWallpaperSource(await readFileAsDataUrl(file))
      if (source === '') throw new Error('图片格式不受支持')
      change({ wallpaper: 'custom', customSource: source })
    } catch (error) { setStatus(String(error)) }
  }
  const applyUrl = () => {
    const source = safeWallpaperSource(urlDraft.trim())
    if (source === '') { setStatus('只允许 https 图片地址'); return }
    change({ wallpaper: 'custom', customSource: source })
    setUrlDraft('')
  }
  const reset = () => {
    updateSettings(DEFAULT_SETTINGS)
    try { theme.setTheme('system') } catch { /* old host */ }
    setStatus('已恢复默认主题与壁纸')
  }

  return h('div', { className: 'dsh-wuw-panel' },
    h('p', { className: 'dsh-wuw-intro' }, '独立的主题与壁纸中心。主题通过 Harness 原生主题服务生效，壁纸只作用于 Web 界面背景，不改变会话、模型或插件数据。'),
    h('section', { className: 'dsh-wuw-block' },
      h('h3', null, '界面主题'),
      h('p', { className: 'dsh-wuw-hint' }, '主题颜色会覆盖原生令牌；系统主题会跟随操作系统的明暗偏好。'),
      h('div', { className: 'dsh-wuw-grid' },
        h(ThemeCard, { theme: { label: '跟随系统', description: '使用操作系统的明暗偏好。', swatch: ['#f6f8fb', '#1b2946', '#6f82a8'] }, active: activeTheme === 'system', onClick: () => chooseTheme('system') }),
        ...THEMES.map(item => h(ThemeCard, { key: item.id, theme: item, active: activeTheme === item.id, onClick: () => chooseTheme(item.id) })),
      ),
    ),
    h('section', { className: 'dsh-wuw-block' },
      h('h3', null, '壁纸'),
      h('p', { className: 'dsh-wuw-hint' }, '预置壁纸不联网；自定义图片只保存在本机当前浏览器。'),
      h('div', { className: 'dsh-wuw-grid' }, WALLPAPERS.map(item => h(WallpaperCard, { key: item.id, wallpaper: item, active: state.wallpaper === item.id, onClick: () => change({ wallpaper: item.id }) }))),
      h('div', { className: 'dsh-wuw-row' },
        h('label', null, '选择本机图片'),
        h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', onChange: chooseFile }),
      ),
      h('div', { className: 'dsh-wuw-row' },
        h('input', { type: 'url', value: urlDraft, placeholder: 'https://example.com/wallpaper.webp', onChange: event => setUrlDraft(event.currentTarget.value), 'aria-label': '壁纸 URL' }),
        h('button', { type: 'button', className: 'dsh-wuw-action', onClick: applyUrl }, '应用图片地址'),
      ),
    ),
    h('section', { className: 'dsh-wuw-block' },
      h('h3', null, '显示调节'),
      h('div', { className: 'dsh-wuw-range' }, h('span', null, '壁纸透明度'), h('input', { type: 'range', min: 0, max: 100, value: Math.round(state.opacity * 100), onChange: event => change({ opacity: Number(event.currentTarget.value) / 100 }) }), h('span', null, `${Math.round(state.opacity * 100)}%`)),
      h('div', { className: 'dsh-wuw-range' }, h('span', null, '背景模糊'), h('input', { type: 'range', min: 0, max: 20, value: state.blur, onChange: event => change({ blur: Number(event.currentTarget.value) }) }), h('span', null, `${state.blur}px`)),
      h('div', { className: 'dsh-wuw-range' }, h('span', null, '前景遮罩'), h('input', { type: 'range', min: 0, max: 90, value: Math.round(state.overlayOpacity * 100), onChange: event => change({ overlayOpacity: Number(event.currentTarget.value) / 100 }) }), h('span', null, `${Math.round(state.overlayOpacity * 100)}%`)),
      h('div', { className: 'dsh-wuw-row' }, h('label', null, '强调色'), h('input', { className: 'dsh-wuw-color', type: 'color', value: state.accent, onChange: event => change({ accent: event.currentTarget.value }), 'aria-label': '主题强调色' }), h('span', { className: 'dsh-wuw-hint', style: { margin: 0 } }, state.accent)),
    ),
    h('div', { className: 'dsh-wuw-row' }, h('button', { type: 'button', className: 'dsh-wuw-reset', onClick: reset }, '恢复默认'), h('span', { className: 'dsh-wuw-status', role: 'status' }, status)),
  )
}

function applyAccent(theme, value) {
  if (typeof theme.overrideTokens !== 'function') return
  try {
    accentDisposer?.()
    accentDisposer = theme.overrideTokens('dsh-web-ui-theme-wallpaper', {
      '--dsw-alias-brand-primary': { light: value, dark: value },
    })
  } catch { /* hosts before overrideTokens simply keep the registered accent */ }
}

export function apply(ctx) {
  const theme = ctx.theme
  const setup = () => {
    const registered = []
    if (typeof theme?.register === 'function') {
      for (const definition of THEMES) {
        try { registered.push(theme.register(definition)) } catch (error) { ctx.logger?.debug?.(`dsh-web-ui-theme-wallpaper: theme ${definition.id} unavailable: ${String(error)}`) }
      }
      applyAccent(theme, currentSettings.accent)
    }
    applyWallpaper(currentSettings)
    return () => {
      for (const dispose of registered.reverse()) dispose?.()
      accentDisposer?.()
      accentDisposer = null
      document.getElementById(WALLPAPER_ROOT_ID)?.remove()
      document.getElementById(`${WALLPAPER_ROOT_ID}-styles`)?.remove()
    }
  }
  if (typeof ctx.effect === 'function') ctx.effect(setup, 'dsh-web-ui-theme-wallpaper: runtime')
  else setup()

  if (typeof ctx.slots?.inject !== 'function') return
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-web-ui-theme-wallpaper',
    order: 45,
    label: () => '主题与壁纸',
  }, () => h(ThemeWallpaperSection, { ctx, theme })))
}
