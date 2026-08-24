import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SETTINGS,
  THEMES,
  WALLPAPERS,
  normalizeSettings,
  safeWallpaperSource,
  wallpaperPresentation,
} from '../.dsh-plugin/client/core.mjs'

test('exposes independent built-in themes and wallpapers', () => {
  assert.equal(THEMES.length, 4)
  assert.equal(new Set(THEMES.map(theme => theme.id)).size, THEMES.length)
  assert.ok(WALLPAPERS.some(wallpaper => wallpaper.id === 'aurora'))
  assert.ok(WALLPAPERS.some(wallpaper => wallpaper.id === 'none'))
})

test('normalizes invalid settings without accepting unsafe sources', () => {
  const value = normalizeSettings({ wallpaper: 'custom', customSource: 'javascript:alert(1)', opacity: 4, blur: -2, overlay: 'red' })
  assert.equal(value.customSource, '')
  assert.equal(value.opacity, 1)
  assert.equal(value.blur, 0)
  assert.equal(value.overlay, DEFAULT_SETTINGS.overlay)
  assert.equal(safeWallpaperSource('http://example.com/a.png'), '')
  assert.equal(safeWallpaperSource('https://example.com/a.png'), 'https://example.com/a.png')
  assert.equal(safeWallpaperSource('data:image/svg+xml;base64,PHN2Zz4='), '')
})

test('builds a bounded presentation for preset and custom wallpapers', () => {
  const preset = wallpaperPresentation({ wallpaper: 'night-grid', opacity: 0.3, blur: 6, overlayOpacity: 0.2 })
  assert.match(preset.backgroundImage, /linear-gradient/)
  assert.equal(preset.opacity, 0.3)
  assert.equal(preset.blur, 6)
  const custom = wallpaperPresentation({ wallpaper: 'custom', customSource: 'https://example.com/wall.webp' })
  assert.match(custom.backgroundImage, /^url\("https:\/\/example\.com\/wall\.webp"\)$/)
})
