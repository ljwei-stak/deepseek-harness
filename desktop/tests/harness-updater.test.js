const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const updater = require('../harness-updater')

function asset(tag, name, size = 1) {
  return {
    name,
    size,
    browser_download_url: `https://github.com/ljwei-stak/deepseek-harness/releases/download/${tag}/${name}`,
  }
}

function release(version, names) {
  const tag = `model-router-galgame-${version}`
  return updater.normalizeRelease({
    tag_name: tag,
    html_url: `https://github.com/ljwei-stak/deepseek-harness/releases/tag/${tag}`,
    draft: false,
    prerelease: false,
    assets: names.map(name => asset(tag, name)),
  })
}

function writePlugin(root, version, minimum = '0.4.8') {
  fs.mkdirSync(path.join(root, '.dsh-plugin'), { recursive: true })
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'model-router-galgame',
    version,
    dshUpdater: { minDesktopVersion: minimum, minRuntimeVersion: minimum },
  }))
  fs.writeFileSync(path.join(root, '.dsh-plugin', 'index.mjs'), 'export const name = "test"\n')
  fs.writeFileSync(path.join(root, '.dsh-plugin', 'client.js'), 'module.exports = {}\n')
  fs.writeFileSync(path.join(root, 'cordis.patch.yml'), '- insert: []\n')
}

test('semantic versions order stable and prerelease builds', () => {
  assert.equal(updater.compareVersions('0.4.8', '0.4.7'), 1)
  assert.equal(updater.compareVersions('0.4.8', '0.4.8'), 0)
  assert.equal(updater.compareVersions('0.4.8-beta.2', '0.4.8'), -1)
})

test('release parsing rejects assets outside the configured repository', () => {
  assert.throws(() => updater.normalizeRelease({
    tag_name: 'model-router-galgame-0.4.8',
    html_url: 'https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.8',
    assets: [{ name: 'plugin.tar.gz', size: 1, browser_download_url: 'https://example.com/plugin.tar.gz' }],
  }), /不属于/)
})

test('manifest exposes independent plugin and desktop updates', () => {
  const pluginName = 'Model-Router-GALGame-Plugin-0.4.9.tar.gz'
  const installer = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.9-Windows-x64.exe'
  const partNames = [`${installer}.part01`, `${installer}.part02`]
  const parsedRelease = release('0.4.9', [updater.UPDATE_MANIFEST_ASSET, pluginName, ...partNames])
  const hash = 'a'.repeat(64)
  const manifest = updater.normalizeManifest({
    schemaVersion: 1,
    releaseVersion: '0.4.9',
    plugin: {
      version: '0.4.9',
      asset: pluginName,
      sha256: hash,
      minDesktopVersion: '0.4.8',
      minRuntimeVersion: '0.4.8',
    },
    desktop: { version: '0.4.9', installer, parts: partNames, sha256: hash },
  }, parsedRelease)
  const status = updater.assessUpdates({ release: parsedRelease, manifest }, {
    pluginVersion: '0.4.8',
    desktopVersion: '0.4.8',
    runtimeVersion: '0.4.8',
  })

  assert.equal(status.plugin.available, true)
  assert.equal(status.plugin.installable, true)
  assert.equal(status.desktop.available, true)
  assert.equal(status.desktop.installable, true)
})

test('plugin compatibility can require a full client update first', () => {
  const pluginName = 'Model-Router-GALGame-Plugin-0.5.0.tar.gz'
  const installer = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.5.0-Windows-x64.exe'
  const parsedRelease = release('0.5.0', [updater.UPDATE_MANIFEST_ASSET, pluginName, installer])
  const hash = 'b'.repeat(64)
  const manifest = updater.normalizeManifest({
    schemaVersion: 1,
    releaseVersion: '0.5.0',
    plugin: {
      version: '0.5.0',
      asset: pluginName,
      sha256: hash,
      minDesktopVersion: '0.5.0',
      minRuntimeVersion: '0.5.0',
    },
    desktop: { version: '0.5.0', installer, parts: [], sha256: hash },
  }, parsedRelease)
  const status = updater.assessUpdates({ release: parsedRelease, manifest }, {
    pluginVersion: '0.4.8',
    desktopVersion: '0.4.8',
    runtimeVersion: '0.4.8',
  })

  assert.equal(status.plugin.available, true)
  assert.equal(status.plugin.installable, false)
  assert.match(status.plugin.reason, /客户端 >= 0\.5\.0/)
  assert.equal(status.desktop.installable, true)
})

test('legacy split desktop assets remain detectable', () => {
  const installer = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.7-Windows-x64.exe'
  const parsedRelease = release('0.4.7', [`${installer}.part01`, `${installer}.part02`])
  assert.deepEqual(updater.inferDesktopDescriptor(parsedRelease), {
    version: '0.4.7',
    installer,
    parts: [`${installer}.part01`, `${installer}.part02`],
    sha256: '',
  })
})

test('checksum parser accepts common sha256sum formats', () => {
  const hashA = 'a'.repeat(64)
  const hashB = 'b'.repeat(64)
  const parsed = updater.parseChecksums(`${hashA} *one.exe\n${hashB}  two.tar.gz\n`)
  assert.equal(parsed.get('one.exe'), hashA)
  assert.equal(parsed.get('two.tar.gz'), hashB)
})

test('release JSON accepts a PowerShell UTF-8 BOM', () => {
  assert.deepEqual(updater.parseJsonText('\uFEFF{"version":"0.4.8"}', 'fixture'), { version: '0.4.8' })
})

test('desktop download is activated only after SHA256 verification', async () => {
  const payload = Buffer.from('verified installer fixture')
  const hash = crypto.createHash('sha256').update(payload).digest('hex')
  const installer = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.9-Windows-x64.exe'
  const tag = 'model-router-galgame-0.4.9'
  const parsedRelease = updater.normalizeRelease({
    tag_name: tag,
    html_url: `https://github.com/ljwei-stak/deepseek-harness/releases/tag/${tag}`,
    assets: [asset(tag, installer, payload.length)],
  })
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-updater-download-'))
  try {
    const result = await updater.prepareDesktopInstaller({
      release: parsedRelease,
      manifest: {
        desktop: { version: '0.4.9', installer, parts: [], sha256: hash },
      },
    }, directory, {
      fetchImpl: async () => new Response(payload, { status: 200 }),
    })
    assert.deepEqual(fs.readFileSync(result.filename), payload)
  } finally {
    await updater.safeRemoveTree(directory)
  }
})

test('corrupt cached installer parts are removed after verification fails', async () => {
  const installer = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.9-Windows-x64.exe'
  const partNames = [`${installer}.part01`, `${installer}.part02`]
  const tag = 'model-router-galgame-0.4.9'
  const parsedRelease = updater.normalizeRelease({
    tag_name: tag,
    html_url: `https://github.com/ljwei-stak/deepseek-harness/releases/tag/${tag}`,
    assets: partNames.map(name => asset(tag, name, 4)),
  })
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-updater-parts-'))
  for (const name of partNames) fs.writeFileSync(path.join(directory, name), 'bad!')
  try {
    await assert.rejects(() => updater.prepareDesktopInstaller({
      release: parsedRelease,
      manifest: {
        desktop: { version: '0.4.9', installer, parts: partNames, sha256: 'a'.repeat(64) },
      },
    }, directory), /SHA256/)
    for (const name of partNames) assert.equal(fs.existsSync(path.join(directory, name)), false)
  } finally {
    await updater.safeRemoveTree(directory)
  }
})

test('profile uses a compatible persisted plugin until a newer bundle arrives', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-updater-profile-'))
  const runtime = path.join(root, 'runtime')
  const userData = path.join(root, 'user-data')
  const home = path.join(root, 'home')
  const bundled = path.join(runtime, 'node_modules', 'model-router-galgame')
  const updated = path.join(userData, 'plugin-updates', 'model-router-galgame', 'versions', '0.4.9')
  try {
    writePlugin(bundled, '0.4.8')
    writePlugin(updated, '0.4.9')
    fs.mkdirSync(path.dirname(path.dirname(updated)), { recursive: true })
    fs.writeFileSync(path.join(userData, 'plugin-updates', 'model-router-galgame', 'active.json'), '{"version":"0.4.9"}\n')

    const source = updater.selectPluginSource(runtime, userData, '0.4.8', '0.4.8')
    assert.equal(source.source, 'update')
    assert.equal(source.version, '0.4.9')
    const target = await updater.syncPluginToProfile(source, home)
    assert.equal(updater.readPluginPackage(target).version, '0.4.9')

    writePlugin(bundled, '0.5.0', '0.4.8')
    const bundledSource = updater.selectPluginSource(runtime, userData, '0.5.0', '0.5.0')
    assert.equal(bundledSource.source, 'bundled')
    assert.equal(bundledSource.version, '0.5.0')
  } finally {
    await updater.safeRemoveTree(root)
  }
})

test('profile receives a symlink-free runtime package dependency closure', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-market-profile-'))
  const runtime = path.join(root, 'runtime')
  const home = path.join(root, 'home')
  const nodeModules = path.join(runtime, 'node_modules')

  function writePackage(name, version, dependencies = {}) {
    const directory = path.join(nodeModules, ...name.split('/'))
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify({
      name,
      version,
      main: 'index.js',
      dependencies,
    }, null, 2)}\n`)
    fs.writeFileSync(path.join(directory, 'index.js'), `module.exports = ${JSON.stringify(name)}\n`)
    return directory
  }

  try {
    writePackage('dshmarket', '1.18.0', { 'js-yaml': '4.2.0', undici: '7.29.0' })
    writePackage('js-yaml', '4.2.0', { argparse: '2.0.1' })
    writePackage('argparse', '2.0.1')
    writePackage('undici', '7.29.0')

    const target = await updater.syncRuntimePackageToProfile(runtime, home, 'dshmarket', '1.18.0')
    assert.equal(JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')).version, '1.18.0')
    assert.equal(fs.existsSync(path.join(target, 'node_modules', 'js-yaml', 'node_modules', 'argparse', 'index.js')), true)
    assert.equal(fs.existsSync(path.join(target, 'node_modules', 'undici', 'index.js')), true)
    assert.equal(fs.lstatSync(target).isSymbolicLink(), false)

    await updater.safeRemoveTree(path.join(target, 'node_modules', 'js-yaml'))
    await updater.syncRuntimePackageToProfile(runtime, home, 'dshmarket', '1.18.0')
    assert.equal(fs.existsSync(path.join(target, 'node_modules', 'js-yaml', 'node_modules', 'argparse', 'index.js')), true)
  } finally {
    await updater.safeRemoveTree(root)
  }
})

test('profile receives the complete dsh-web-ui aggregate and child closure', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-web-ui-profile-'))
  const runtime = path.join(root, 'runtime')
  const home = path.join(root, 'home')
  const nodeModules = path.join(runtime, 'node_modules')

  function writePackage(name, version, dependencies = {}) {
    const directory = path.join(nodeModules, ...name.split('/'))
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify({
      name,
      version,
      main: 'index.js',
      dependencies,
    }, null, 2)}\n`)
    fs.writeFileSync(path.join(directory, 'index.js'), `module.exports = ${JSON.stringify(name)}\n`)
  }

  try {
    writePackage('@linxin666/dsh-web-ui-all', '0.2.9', {
      '@linxin666/dsh-client-ui-market': '0.2.9',
      '@mlgbnb/dsh-archive-manager': '1.0.7',
    })
    writePackage('@linxin666/dsh-client-ui-market', '0.2.9', { yaml: '2.8.2' })
    writePackage('@mlgbnb/dsh-archive-manager', '1.0.7')
    writePackage('yaml', '2.8.2')

    const target = await updater.syncRuntimePackageToProfile(runtime, home, '@linxin666/dsh-web-ui-all', '0.2.9')
    assert.equal(target, path.join(home, 'profiles', 'node_modules', '@linxin666', 'dsh-web-ui-all'))
    assert.equal(fs.existsSync(path.join(target, 'node_modules', '@linxin666', 'dsh-client-ui-market', 'package.json')), true)
    assert.equal(fs.existsSync(path.join(target, 'node_modules', '@mlgbnb', 'dsh-archive-manager', 'package.json')), true)
    assert.equal(fs.existsSync(path.join(target, 'node_modules', '@linxin666', 'dsh-client-ui-market', 'node_modules', 'yaml', 'package.json')), true)
  } finally {
    await updater.safeRemoveTree(root)
  }
})

test('profile copies dependencies that expose only subpaths', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-subpath-package-'))
  const runtime = path.join(root, 'runtime')
  const home = path.join(root, 'home')
  const packageRoot = path.join(runtime, 'node_modules', 'dsh-better-sidebar')
  const dependency = path.join(packageRoot, 'node_modules', '@codemirror', 'legacy-modes')
  try {
    fs.mkdirSync(dependency, { recursive: true })
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({
      name: 'dsh-better-sidebar',
      version: '0.15.2',
      main: 'index.js',
      dependencies: { '@codemirror/legacy-modes': '6.5.3' },
    }, null, 2))
    fs.writeFileSync(path.join(packageRoot, 'index.js'), 'module.exports = {}\n')
    fs.writeFileSync(path.join(dependency, 'package.json'), JSON.stringify({
      name: '@codemirror/legacy-modes',
      version: '6.5.3',
      type: 'module',
      exports: { './mode/*': './mode/*.js' },
    }, null, 2))
    fs.mkdirSync(path.join(dependency, 'mode'), { recursive: true })
    fs.writeFileSync(path.join(dependency, 'mode', 'shell.js'), 'export const shell = {}\n')

    const target = await updater.syncRuntimePackageToProfile(runtime, home, 'dsh-better-sidebar', '0.15.2')
    assert.equal(fs.existsSync(path.join(target, 'node_modules', '@codemirror', 'legacy-modes', 'package.json')), true)
    assert.equal(fs.existsSync(path.join(target, 'node_modules', '@codemirror', 'legacy-modes', 'mode', 'shell.js')), true)
  } finally {
    await updater.safeRemoveTree(root)
  }
})
