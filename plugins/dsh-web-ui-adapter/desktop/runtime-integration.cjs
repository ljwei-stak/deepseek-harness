const fs = require('node:fs')
const path = require('node:path')

const PROFILE_BUNDLES = [
  'model-router-galgame',
  'dshmarket',
  '@linxin666/dsh-web-ui-all',
]

const WEB_UI_PACKAGES = [
  ['@linxin666/dsh-web-ui-all', '0.2.9'],
  ['@linxin666/dsh-client-ui-web-ui-settings', '0.2.9'],
  ['@linxin666/dsh-client-ui-plugin-manager', '0.2.9'],
  ['@linxin666/dsh-client-ui-community-plugins', '0.2.9'],
  ['@linxin666/dsh-client-ui-market', '0.2.9'],
  ['@linxin666/dsh-client-ui-aionui-panel', '0.2.9'],
  ['@linxin666/dsh-client-ui-task-board', '0.2.9'],
  ['@linxin666/dsh-client-ui-git-graph', '0.2.9'],
  ['@linxin666/dsh-remote-web-ui', '0.2.9'],
  ['@linxin666/dsh-pet', '0.2.9'],
  ['@linxin666/dsh-ssh', '0.2.9'],
  ['@linxin666/dsh-tool-describe-image', '0.2.9'],
  ['@linxin666/dsh-chat-recovery', '0.2.9'],
  ['@linxin666/dsh-liangshen', '0.2.9'],
  ['@linxin666/dsh-client-ui-skill-explorer', '0.2.9'],
  ['@linxin666/dsh-desktop-launcher', '0.2.9'],
  ['@linxin666/dsh-doctor', '0.2.9'],
  ['@linxin666/dsh-client-ui-skin-center', '0.2.9'],
  ['dsh-better-sidebar', '0.15.2'],
  ['@mlgbnb/dsh-archive-manager', '1.0.7'],
]

function disableDuplicateClientFace(packageDirectory, debugLog = () => {}) {
  const manifestPath = path.join(packageDirectory, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (manifest?.dsh?.client === undefined) return
  const next = { ...manifest, dsh: { ...(manifest.dsh || {}) } }
  delete next.dsh.client
  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  debugLog(`Disabled duplicate browser face for ${manifest.name}`)
}

function ensureProfileBundles(home, debugLog = () => {}) {
  const profileDir = path.join(home, 'profiles', 'web')
  const manifestPath = path.join(profileDir, 'package.json')
  fs.mkdirSync(profileDir, { recursive: true })
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch {
    manifest = { name: 'dsh-profile-web', private: true, dependencies: {} }
  }
  const bundles = Array.isArray(manifest?.dsh?.profile?.bundles)
    ? [...manifest.dsh.profile.bundles]
    : ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']
  const nextBundles = [...bundles]
  for (const name of PROFILE_BUNDLES) {
    if (!nextBundles.includes(name)) nextBundles.push(name)
  }
  if (JSON.stringify(nextBundles) === JSON.stringify(bundles)) return false
  manifest.dsh = {
    ...(manifest.dsh && typeof manifest.dsh === 'object' ? manifest.dsh : {}),
    profile: {
      ...(manifest.dsh?.profile && typeof manifest.dsh.profile === 'object' ? manifest.dsh.profile : {}),
      bundles: nextBundles,
    },
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  debugLog(`Enabled local profile bundles: ${nextBundles.join(', ')}`)
  return true
}

module.exports = {
  PROFILE_BUNDLES,
  WEB_UI_PACKAGES,
  disableDuplicateClientFace,
  ensureProfileBundles,
}
