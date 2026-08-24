export const DEFAULT_SETTINGS = Object.freeze({
  wallpaper: 'aurora',
  customSource: '',
  opacity: 0.48,
  blur: 0,
  overlay: '#07111f',
  overlayOpacity: 0.32,
  accent: '#8f7bff',
})

export const THEMES = Object.freeze([
  { id: 'dsh-midnight', label: '午夜蓝' },
  { id: 'dsh-sakura', label: '樱花' },
  { id: 'dsh-emerald', label: '翡翠' },
  { id: 'dsh-paper', label: '纸张' },
])

export const WALLPAPERS = Object.freeze([
  { id: 'none', label: '无壁纸', background: 'linear-gradient(135deg, #101827, #17213b)' },
  { id: 'aurora', label: '极光', background: 'radial-gradient(circle at 18% 18%, rgba(93, 179, 255, .8), transparent 34%)' },
  { id: 'night-grid', label: '夜网格', background: 'linear-gradient(rgba(93, 142, 214, .12) 1px, transparent 1px)', size: '42px 42px' },
  { id: 'paper-light', label: '纸张纹理', background: 'radial-gradient(rgba(62, 74, 78, .12) .7px, transparent .7px)', size: '8px 8px' },
])

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

function cssUrl(value) {
  return `url("${String(value).replace(/["\\\r\n]/g, char => `\\${char}`)}")`
}

export function wallpaperPresentation(value = DEFAULT_SETTINGS) {
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
