const { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const net = require('node:net')
const path = require('node:path')
const updater = require('./harness-updater')

const DEFAULT_REMOTE_ORIGIN = process.env.DEEPSEEK_HARNESS_REMOTE_ORIGIN || 'https://www.jianweilimarx.top'
const DEFAULT_REMOTE_PATH = process.env.DEEPSEEK_HARNESS_REMOTE_PATH || '/harness/'
const CONFIG_FILENAME = 'deepseek-harness-client.json'
const LOCAL_RUNTIME_VERSION = '0.4.11'
const PLUGIN_VERSION = '0.4.10'
const MARKET_VERSION = '1.18.0'
const WEB_UI_VERSION = '0.2.9'
const RELEASE_CACHE_MS = 5 * 60_000
const RETRYABLE_FILESYSTEM_ERRORS = new Set(['EACCES', 'EBUSY', 'ENOTEMPTY', 'EPERM'])

let mainWindow = null
let currentConfig = null
let localHarnessProcess = null
let releaseCache = null
let updateOperation = null

if (process.env.DEEPSEEK_HARNESS_USER_DATA_DIR) {
  fs.mkdirSync(process.env.DEEPSEEK_HARNESS_USER_DATA_DIR, { recursive: true })
  app.setPath('userData', process.env.DEEPSEEK_HARNESS_USER_DATA_DIR)
}

function debugLog(message) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.appendFileSync(path.join(app.getPath('userData'), 'client.log'), `${new Date().toISOString()} ${message}\n`, 'utf8')
  } catch {
    // A diagnostics file is best effort and must never prevent the client from opening.
  }
}

function configFile() {
  return path.join(app.getPath('userData'), CONFIG_FILENAME)
}

function normalizeEndpoint(value) {
  const candidate = typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_REMOTE_ORIGIN
  const parsed = new URL(candidate)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('工作台地址必须是 http:// 或 https:// 地址')
  }
  parsed.hash = ''
  parsed.search = ''
  parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '')
  return parsed.toString().replace(/\/$/, '')
}

function readConfig() {
  try {
    const parsed = JSON.parse(fs.readFileSync(configFile(), 'utf8'))
    const mode = ['server', 'local', 'custom'].includes(parsed.mode)
      ? parsed.mode
      : parsed.local === true
        ? 'custom'
        : 'server'
    return {
      endpoint: normalizeEndpoint(parsed.endpoint),
      local: mode !== 'server',
      mode,
    }
  } catch {
    return { endpoint: DEFAULT_REMOTE_ORIGIN, local: false, mode: 'server' }
  }
}

function writeConfig(config) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(configFile(), JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 })
}

function isDefaultCloud(config) {
  return config.mode === 'server' && config.endpoint === DEFAULT_REMOTE_ORIGIN
}

function workspaceUrl(config) {
  if (isDefaultCloud(config)) return `${config.endpoint}${DEFAULT_REMOTE_PATH}`
  return `${config.endpoint}/`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function bundledResource(name) {
  return path.join(process.resourcesPath, name)
}

function localPatchPath() {
  const configured = process.env.DEEPSEEK_HARNESS_LOCAL_PATCH
  if (configured) return configured
  const bundled = bundledResource('harness-local.patch.yml')
  if (fs.existsSync(bundled)) return bundled
  const development = path.join(__dirname, 'harness-local.patch.yml')
  if (fs.existsSync(development)) return development
  throw new Error('本地运行配置缺失，请重新安装最新版 DeepSeek Harness')
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function reserveLocalPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close((error) => error ? reject(error) : resolve(port))
    })
  })
}

function runExtractor(archive, target) {
  return new Promise((resolve, reject) => {
    const tar = process.platform === 'win32' ? 'tar.exe' : 'tar'
    const extractor = spawn(tar, ['-xzf', archive, '-C', target], {
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let errorOutput = ''
    extractor.stderr.on('data', (chunk) => { errorOutput += String(chunk) })
    extractor.once('error', reject)
    extractor.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(errorOutput.trim() || `本地运行时解压失败（退出码 ${code}）`))
    })
  })
}

function runtimeRequiredFiles(root) {
  return [
    path.join(root, 'apps', 'cli', 'lib', 'bin.js'),
    path.join(root, 'apps', 'web', 'dist', 'index.html'),
    path.join(root, 'node_modules', 'model-router-galgame', 'package.json'),
    path.join(root, 'node_modules', 'dshmarket', 'package.json'),
    path.join(root, 'node_modules', 'dshmarket', 'lib', 'index.js'),
    path.join(root, 'node_modules', 'dshmarket', 'client', 'client.js'),
    path.join(root, 'node_modules', '@linxin666', 'dsh-web-ui-all', 'package.json'),
    path.join(root, 'node_modules', '@linxin666', 'dsh-web-ui-all', 'lib', 'index.js'),
    path.join(root, 'node_modules', '@linxin666', 'dsh-web-ui-all', 'lib', 'client.js'),
    path.join(root, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
    path.join(root, 'vendor', 'cordis', 'lib', 'index.js'),
  ]
}

function validateExtractedRuntime(root) {
  const missing = runtimeRequiredFiles(root).filter((candidate) => !fs.existsSync(candidate))
  if (missing.length > 0) {
    throw new Error(`安装包解压不完整，缺少：${missing.map((candidate) => path.relative(root, candidate)).join('、')}`)
  }
  const marketPackage = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'dshmarket', 'package.json'), 'utf8'))
  if (marketPackage.version !== MARKET_VERSION) {
    throw new Error(`插件市场版本不匹配：需要 ${MARKET_VERSION}，实际为 ${marketPackage.version || '未知'}`)
  }
  const webUiPackage = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', '@linxin666', 'dsh-web-ui-all', 'package.json'), 'utf8'))
  if (webUiPackage.version !== WEB_UI_VERSION) {
    throw new Error(`dsh-web-ui 版本不匹配：需要 ${WEB_UI_VERSION}，实际为 ${webUiPackage.version || '未知'}`)
  }
}

/**
 * Profile bundles are resolved from the per-user DSH_HOME tree.  The shipped
 * Model Router package lives in the extracted application runtime, so mirror
 * it into the profile fallback before the first boot.  A real directory is
 * used instead of a junction: this also works on Windows installations where
 * the user has not enabled developer mode.
 */
async function installEffectivePlugin(runtimeRoot, home) {
  const source = updater.selectPluginSource(
    runtimeRoot,
    app.getPath('userData'),
    LOCAL_RUNTIME_VERSION,
    PLUGIN_VERSION,
  )
  const target = await updater.syncPluginToProfile(source, home)
  debugLog(`Using ${source.source} Model Router plugin ${source.version}: ${source.directory}`)
  return target
}

async function installPluginMarket(runtimeRoot, home) {
  const target = await updater.syncRuntimePackageToProfile(runtimeRoot, home, 'dshmarket', MARKET_VERSION)
  debugLog(`Using independent plugin market ${MARKET_VERSION}: ${target}`)
  return target
}

async function installWebUi(runtimeRoot, home) {
  const target = await updater.syncRuntimePackageToProfile(
    runtimeRoot,
    home,
    '@linxin666/dsh-web-ui-all',
    WEB_UI_VERSION,
  )
  debugLog(`Using bundled dsh-web-ui suite ${WEB_UI_VERSION}: ${target}`)
  return target
}

function isReadyRuntime(root) {
  try {
    if (fs.readFileSync(path.join(root, '.runtime-version'), 'utf8').trim() !== LOCAL_RUNTIME_VERSION) return false
    validateExtractedRuntime(root)
    return true
  } catch {
    return false
  }
}

async function retryFilesystemOperation(label, operation) {
  let lastError
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const code = error && typeof error === 'object' ? error.code : undefined
      if (!RETRYABLE_FILESYSTEM_ERRORS.has(code) || attempt === 7) throw error
      const wait = Math.min(1600, 100 * (2 ** attempt))
      debugLog(`${label} retry ${attempt + 1}/8 after ${code}: ${error.message}`)
      await delay(wait)
    }
  }
  throw lastError
}

function removeRuntimeResidue(candidate, label) {
  void fs.promises.rm(candidate, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 250,
  }).then(() => {
    debugLog(`Removed ${label}: ${candidate}`)
  }, (error) => {
    debugLog(`Could not remove ${label}; it will be ignored: ${error.message}`)
  })
}

function findReadyRuntime(runtimeParent, canonicalTarget) {
  const candidates = [canonicalTarget]
  try {
    const recoveryNames = fs.readdirSync(runtimeParent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${LOCAL_RUNTIME_VERSION}-recovery-`))
      .map((entry) => path.join(runtimeParent, entry.name))
    candidates.push(...recoveryNames)
  } catch {
    // A missing runtime parent has no reusable installation.
  }
  return candidates.find(isReadyRuntime)
}

async function activateExtractedRuntime(staging, canonicalTarget) {
  if (isReadyRuntime(canonicalTarget)) {
    removeRuntimeResidue(staging, 'duplicate extracted runtime')
    return canonicalTarget
  }

  if (fs.existsSync(canonicalTarget)) {
    const incomplete = `${canonicalTarget}.incomplete-${process.pid}-${Date.now()}`
    try {
      await retryFilesystemOperation('Quarantine incomplete local runtime', () => fs.promises.rename(canonicalTarget, incomplete))
      removeRuntimeResidue(incomplete, 'incomplete local runtime')
    } catch (error) {
      const recoveryTarget = `${canonicalTarget}-recovery-${process.pid}-${Date.now()}`
      debugLog(`Canonical runtime is unavailable; activating recovery directory: ${error.message}`)
      await retryFilesystemOperation('Activate recovery local runtime', () => fs.promises.rename(staging, recoveryTarget))
      return recoveryTarget
    }
  }

  await retryFilesystemOperation('Activate local runtime', () => fs.promises.rename(staging, canonicalTarget))
  return canonicalTarget
}

function cleanupLegacyRuntimeResidue(activeRoot) {
  const userData = app.getPath('userData')
  let entries = []
  try {
    entries = fs.readdirSync(userData, { withFileTypes: true })
  } catch (error) {
    debugLog(`Could not inspect legacy runtimes: ${error.message}`)
    return
  }

  const active = path.resolve(activeRoot)
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name !== 'local-runtime' && !entry.name.startsWith('local-runtime.extracting-')) continue
    const candidate = path.resolve(userData, entry.name)
    if (candidate === active || path.dirname(candidate) !== path.resolve(userData)) continue
    removeRuntimeResidue(candidate, 'legacy local runtime')
  }

  const runtimeParent = path.join(userData, 'local-runtimes')
  try {
    for (const entry of fs.readdirSync(runtimeParent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const isManagedRuntime = /^\d+\.\d+\.\d+$/.test(entry.name)
        || entry.name.startsWith('.extracting-')
        || entry.name.includes('.incomplete-')
        || entry.name.includes('-recovery-')
      if (!isManagedRuntime) continue
      const candidate = path.resolve(runtimeParent, entry.name)
      if (candidate === active || path.dirname(candidate) !== path.resolve(runtimeParent)) continue
      removeRuntimeResidue(candidate, 'obsolete local runtime')
    }
  } catch (error) {
    debugLog(`Could not inspect versioned runtimes: ${error.message}`)
  }
}

async function ensureLocalRuntime() {
  const configuredRoot = process.env.DEEPSEEK_HARNESS_RUNTIME_ROOT
  if (configuredRoot && fs.existsSync(path.join(configuredRoot, 'apps', 'cli', 'lib', 'bin.js'))) {
    return configuredRoot
  }

  const archive = process.env.DEEPSEEK_HARNESS_RUNTIME_ARCHIVE
    || bundledResource('harness-runtime.tar.gz')
  if (!fs.existsSync(archive)) {
    throw new Error('安装包中没有本地 Harness 运行时，请重新下载包含本地运行环境的安装包')
  }

  const runtimeParent = path.join(app.getPath('userData'), 'local-runtimes')
  const canonicalTarget = path.join(runtimeParent, LOCAL_RUNTIME_VERSION)
  fs.mkdirSync(runtimeParent, { recursive: true })
  const reusable = findReadyRuntime(runtimeParent, canonicalTarget)
  if (reusable) {
    debugLog(`Reusing local runtime ${LOCAL_RUNTIME_VERSION}: ${reusable}`)
    return reusable
  }

  const staging = path.join(
    runtimeParent,
    `.extracting-${LOCAL_RUNTIME_VERSION}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  )
  fs.mkdirSync(staging)
  debugLog(`Extracting local runtime ${LOCAL_RUNTIME_VERSION}: ${staging}`)
  try {
    await runExtractor(archive, staging)
    validateExtractedRuntime(staging)
    fs.writeFileSync(path.join(staging, '.runtime-version'), LOCAL_RUNTIME_VERSION, 'utf8')
    const activeRuntime = await activateExtractedRuntime(staging, canonicalTarget)
    debugLog(`Activated local runtime ${LOCAL_RUNTIME_VERSION}: ${activeRuntime}`)
    return activeRuntime
  } catch (error) {
    removeRuntimeResidue(staging, 'failed runtime extraction')
    const message = error instanceof Error ? error.message : String(error)
    debugLog(`Local runtime installation failed: ${message}`)
    throw new Error(`本地运行环境安装失败：${message}`)
  }
}

function localNodePath() {
  const configured = process.env.DEEPSEEK_HARNESS_NODE_PATH
  if (configured) return configured
  const bundled = bundledResource(path.join('harness-node', process.platform === 'win32' ? 'node.exe' : 'node'))
  if (fs.existsSync(bundled)) return bundled
  return process.platform === 'win32' ? 'node.exe' : 'node'
}

function localHarnessPath(runtimeRoot) {
  const separator = process.platform === 'win32' ? ';' : ':'
  const candidates = [
    bundledResource('harness-tools'),
    path.dirname(localNodePath()),
    path.join(runtimeRoot, 'node_modules', '.bin'),
  ].filter((candidate) => fs.existsSync(candidate))
  const inherited = (process.env.PATH || '').split(separator).filter(Boolean)
  return [...new Set([...candidates, ...inherited])].join(separator)
}

async function waitForLocalWorkspace(url, child) {
  const deadline = Date.now() + 90_000
  let lastError = '服务尚未就绪'
  while (Date.now() < deadline) {
    if (child.harnessStartupError) throw child.harnessStartupError
    if (child.exitCode !== null) {
      throw new Error(`本地 Harness 已退出（${child.exitCode}），请查看客户端日志`)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
      await response.arrayBuffer()
      if (response.status >= 200 && response.status < 500) {
        // A partially mounted plugin tree can answer once and then terminate.
        // Require a short stable period before navigating the renderer to it.
        await delay(700)
        if (child.harnessStartupError) throw child.harnessStartupError
        if (child.exitCode !== null) {
          throw new Error(`本地 Harness 启动后立即退出（${child.exitCode}），请查看客户端日志`)
        }
        return
      }
      lastError = `本地服务返回 HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await delay(350)
  }
  throw new Error(`${lastError}（等待本地服务超过 90 秒）`)
}

async function startLocalHarness() {
  if (localHarnessProcess && localHarnessProcess.exitCode === null && currentConfig?.endpoint) {
    return currentConfig.endpoint
  }

  const runtimeRoot = await ensureLocalRuntime()
  const port = await reserveLocalPort()
  const node = localNodePath()
  const entry = path.join(runtimeRoot, 'apps', 'cli', 'lib', 'bin.js')
  if (!fs.existsSync(entry)) throw new Error('本地运行时缺少 Harness 启动入口')

  const home = path.join(app.getPath('userData'), 'harness-home')
  fs.mkdirSync(home, { recursive: true })
  await installEffectivePlugin(runtimeRoot, home)
  await installPluginMarket(runtimeRoot, home)
  await installWebUi(runtimeRoot, home)
  const patch = localPatchPath()
  // The web command passes unknown options through to the web app. Keep the
  // launcher-owned patch option before --port so it is consumed by dsh.
  const child = spawn(node, [entry, 'web', '--patch', patch, '--port', String(port)], {
    cwd: runtimeRoot,
    env: {
      ...process.env,
      DSH_HOME: home,
      DSH_TELEMETRY_DISABLED: '1',
      PATH: localHarnessPath(runtimeRoot),
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  debugLog(`Local Harness patch: ${patch}`)
  localHarnessProcess = child
  child.once('error', (error) => {
    child.harnessStartupError = error
    debugLog(`Local Harness spawn failed: ${error.message}`)
  })
  child.stdout.on('data', (chunk) => debugLog(`Local Harness: ${String(chunk).trim()}`))
  child.stderr.on('data', (chunk) => debugLog(`Local Harness error: ${String(chunk).trim()}`))
  child.once('exit', (code, signal) => {
    debugLog(`Local Harness exited: code=${code} signal=${signal || ''}`)
    if (localHarnessProcess === child) localHarnessProcess = null
  })

  const endpoint = `http://127.0.0.1:${port}`
  await waitForLocalWorkspace(endpoint, child)
  cleanupLegacyRuntimeResidue(runtimeRoot)
  return endpoint
}

async function stopLocalHarness() {
  const child = localHarnessProcess
  localHarnessProcess = null
  if (!child || child.exitCode !== null) return
  const exited = new Promise(resolve => {
    const onExit = () => {
      clearTimeout(timeout)
      resolve(true)
    }
    const timeout = setTimeout(() => {
      child.removeListener('exit', onExit)
      debugLog(`Local Harness did not exit within 10 seconds: pid=${child.pid ?? 'unknown'}`)
      resolve(false)
    }, 10_000)
    child.once('exit', onExit)
  })
  child.kill()
  if (process.platform === 'win32' && child.pid) {
    const terminator = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      windowsHide: true,
      stdio: 'ignore',
    })
    terminator.unref()
  }
  const graceful = await exited
  if (!graceful && process.platform !== 'win32' && child.exitCode === null) {
    debugLog(`Force stopping local Harness: pid=${child.pid ?? 'unknown'}`)
    child.kill('SIGKILL')
  }
}

function currentUpdateVersions() {
  return {
    pluginVersion: updater.effectivePluginVersion(
      app.getPath('userData'),
      PLUGIN_VERSION,
      LOCAL_RUNTIME_VERSION,
    ),
    desktopVersion: app.getVersion(),
    runtimeVersion: LOCAL_RUNTIME_VERSION,
  }
}

async function latestRelease(force = false) {
  if (!force && releaseCache !== null && Date.now() - releaseCache.checkedAt < RELEASE_CACHE_MS) {
    return releaseCache.bundle
  }
  const bundle = await updater.fetchLatestRelease()
  releaseCache = { checkedAt: Date.now(), bundle }
  return bundle
}

function publishUpdateProgress(kind, progress) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('harness-update:progress', { kind, ...progress })
}

async function exclusiveUpdate(kind, operation) {
  if (updateOperation !== null) throw new Error(`正在${updateOperation === 'plugin' ? '更新插件' : '更新完整客户端'}，请等待当前操作完成`)
  updateOperation = kind
  try {
    return await operation()
  } finally {
    updateOperation = null
  }
}

async function restartLocalWorkspaceAfterPluginUpdate() {
  try {
    await stopLocalHarness()
    currentConfig = { endpoint: 'http://127.0.0.1:0', local: true, mode: 'local' }
    currentConfig.endpoint = await startLocalHarness()
    writeConfig(currentConfig)
    await loadWorkspace()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    debugLog(`Plugin update restart failed: ${message}`)
    await showConnectionPage(`插件已更新，但本地服务重启失败：${message}`)
  }
}

async function installPluginUpdate() {
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['更新插件', '取消'],
    defaultId: 0,
    cancelId: 1,
    title: '更新 Model Router + GALGame',
    message: '从 ljwei-stak/deepseek-harness 下载并安装最新版插件？',
    detail: '下载内容会经过 SHA256 与兼容性校验。当前插件版本会保留，更新失败不会替换正在使用的版本。',
    noLink: true,
  })
  if (confirmation.response !== 0) return { cancelled: true }
  return exclusiveUpdate('plugin', async () => {
    const bundle = await latestRelease(true)
    const versions = currentUpdateVersions()
    const status = updater.assessUpdates(bundle, versions)
    if (!status.plugin.available) throw new Error(status.plugin.reason || '插件已是最新版')
    if (!status.plugin.installable) throw new Error(status.plugin.reason || '该插件版本与当前客户端不兼容')
    const directory = path.join(app.getPath('userData'), 'updates', bundle.release.version, 'plugin')
    publishUpdateProgress('plugin', { phase: 'start', percent: 0, message: '正在下载插件更新...' })
    const prepared = await updater.preparePluginArchive(bundle, directory, {
      onProgress: progress => publishUpdateProgress('plugin', progress),
    })
    const installed = await updater.installPluginArchive(
      prepared.filename,
      prepared.descriptor,
      app.getPath('userData'),
      versions,
    )
    publishUpdateProgress('plugin', { phase: 'done', percent: 100, version: installed.version, message: `插件 ${installed.version} 已安装` })
    const restartScheduled = currentConfig?.mode === 'local'
    if (restartScheduled) setTimeout(() => { void restartLocalWorkspaceAfterPluginUpdate() }, 750)
    return {
      version: installed.version,
      restartScheduled,
      message: restartScheduled
        ? '插件已更新，正在重启本地工作台...'
        : '本地插件已更新；下次进入本地模式时生效。服务器端插件由服务器部署版本决定。',
    }
  })
}

function launchInstaller(filename) {
  return new Promise((resolve, reject) => {
    const child = spawn(filename, [], {
      detached: true,
      windowsHide: false,
      stdio: 'ignore',
    })
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolve()
    })
  })
}

async function installDesktopUpdate() {
  if (process.platform !== 'win32') {
    const confirmation = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['打开发布页', '取消'],
      defaultId: 0,
      cancelId: 1,
      title: '更新 DeepSeek Harness',
      message: 'Linux 客户端由系统包管理器更新',
      detail: '请从项目发布页下载新版 DEB 或 RPM 安装包，再使用系统的软件安装器完成升级。用户配置和历史任务会保留在用户目录。',
      noLink: true,
    })
    if (confirmation.response !== 0) return { cancelled: true }
    await shell.openExternal(updater.RELEASES_URL)
    return { manual: true, message: '已打开项目发布页。' }
  }
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['下载并安装', '取消'],
    defaultId: 0,
    cancelId: 1,
    title: '更新 DeepSeek Harness',
    message: '下载并安装最新版完整客户端？',
    detail: '安装包可能较大。所有分片合并并通过 SHA256 校验后才会启动安装程序，用户配置和历史任务保留在用户目录。',
    noLink: true,
  })
  if (confirmation.response !== 0) return { cancelled: true }
  return exclusiveUpdate('desktop', async () => {
    const bundle = await latestRelease(true)
    const status = updater.assessUpdates(bundle, currentUpdateVersions())
    if (!status.desktop.available) throw new Error(status.desktop.reason || '完整客户端已是最新版')
    if (!status.desktop.installable) throw new Error(status.desktop.reason || '该 Release 没有可安装的客户端')
    const directory = path.join(app.getPath('userData'), 'updates', bundle.release.version, 'desktop')
    publishUpdateProgress('desktop', { phase: 'start', percent: 0, message: '正在下载完整客户端...' })
    const prepared = await updater.prepareDesktopInstaller(bundle, directory, {
      onProgress: progress => publishUpdateProgress('desktop', progress),
    })
    await launchInstaller(prepared.filename)
    publishUpdateProgress('desktop', { phase: 'done', percent: 100, version: prepared.descriptor.version, message: '安装程序已启动' })
    setTimeout(() => app.quit(), 1200)
    return { version: prepared.descriptor.version, message: '安装程序已启动，当前客户端将退出。' }
  })
}

function connectionPage(errorMessage = '') {
  const config = currentConfig || readConfig()
  const endpoint = escapeHtml(config.endpoint)
  const error = errorMessage
    ? `<div class="error" role="alert">${escapeHtml(errorMessage)}</div>`
    : ''
  const icon = nativeImage
    .createFromPath(path.join(__dirname, 'assets', 'app-icon.png'))
    .resize({ width: 96, height: 96, quality: 'best' })
    .toPNG()
    .toString('base64')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline'">
    <title>DeepSeek Harness</title><style>
      *{box-sizing:border-box}body{margin:0;background:#f6f7f4;color:#20231f;font-family:"Segoe UI","Microsoft YaHei",sans-serif}
      main{min-height:100vh;display:grid;place-items:center;padding:28px}.panel{width:min(560px,100%);background:#fff;border:1px solid #dedfd9;border-radius:12px;padding:34px;box-shadow:0 12px 36px #1f27130d}
      .brand{display:flex;align-items:center;gap:13px;margin-bottom:25px}.brand img{width:42px;height:42px;border-radius:8px;object-fit:cover}.brand strong{display:block;font-size:20px}.brand small{display:block;color:#73766f;margin-top:3px}
      h1{font-size:22px;line-height:1.3;margin:0 0 9px}p{color:#62665e;line-height:1.7;margin:0 0 22px}.label{display:block;font-size:13px;font-weight:600;margin:18px 0 8px}input{width:100%;height:42px;border:1px solid #cdd0c8;border-radius:6px;padding:0 12px;font-size:14px;outline:none}input:focus{border-color:#626a55;box-shadow:0 0 0 3px #626a5518}
      .mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin:20px 0 13px}.mode{min-height:120px;text-align:left;padding:17px;border:1px solid #cdd0c8;border-radius:8px;background:#fff}.mode strong{display:block;font-size:16px;margin-bottom:7px}.mode small{display:block;color:#73766f;line-height:1.55}.mode:hover,.mode.selected{border-color:#53654d;box-shadow:0 0 0 3px #53654d18}.mode.selected{background:#f6faf3}
      .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}button{height:40px;border:1px solid #c4c8bd;border-radius:6px;background:#fff;padding:0 17px;font-size:14px;cursor:pointer;color:#30342f}button.primary{background:#2f392d;color:#fff;border-color:#2f392d}button:hover{filter:brightness(.96)}button:disabled{cursor:wait;opacity:.65}.error{margin:15px 0;padding:11px 13px;border-radius:6px;background:#fff1ed;color:#a43e2d;font-size:13px;line-height:1.5}.hint{font-size:12px;color:#83867e;margin-top:17px}.advanced{margin-top:22px;border-top:1px solid #e7e8e3;padding-top:15px}.advanced summary{color:#73766f;font-size:12px;cursor:pointer}.advanced .actions{margin-top:12px}
    </style></head><body><main><section class="panel"><div class="brand"><img src="data:image/png;base64,${icon}" alt=""><span><strong>DeepSeek Harness</strong><small>工程智能体工作台</small></span></div>
      <h1>选择运行方式</h1><p>服务器端适合直接使用线上工作台；本地运行会自动启动随安装包提供的 Harness，不需要手动打开命令行。</p>
      ${error}<div class="mode-grid"><button class="mode ${config.mode === 'server' ? 'selected' : ''}" id="server" type="button"><strong>服务器端</strong><small>使用线上账户、历史任务和云端配置。</small></button><button class="mode ${config.mode === 'local' ? 'selected' : ''}" id="local" type="button"><strong>本地运行</strong><small>在本机启动服务，数据和模型密钥保存在本机。</small></button></div>
      <div class="actions"><button class="primary" id="start" type="button">${config.mode === 'local' ? '启动本地服务' : '连接服务器端'}</button><span id="status" class="hint"></span></div>
      <details class="advanced"><summary>高级：连接已有工作台地址</summary><label class="label" for="endpoint">工作台地址</label><input id="endpoint" value="${endpoint}" autocomplete="url"><div class="actions"><button id="custom" type="button">连接此地址</button></div></details>
      <div class="hint">本地模式首次启动会解压运行环境，之后会复用本机缓存。</div></section></main>
      <script>let mode=${JSON.stringify(config.mode === 'local' ? 'local' : 'server')};const server=document.getElementById('server');const local=document.getElementById('local');const start=document.getElementById('start');const status=document.getElementById('status');const setMode=(next)=>{mode=next;server.classList.toggle('selected',mode==='server');local.classList.toggle('selected',mode==='local');start.textContent=mode==='local'?'启动本地服务':'连接服务器端';};server.onclick=()=>setMode('server');local.onclick=()=>setMode('local');start.onclick=async()=>{start.disabled=true;server.disabled=true;local.disabled=true;status.textContent=mode==='local'?'正在准备本地运行环境...':'正在连接服务器端...';try{await window.deepSeekHarnessDesktop.startMode(mode);}catch(error){status.textContent=error instanceof Error?error.message:String(error);start.disabled=false;server.disabled=false;local.disabled=false;}};document.getElementById('custom').onclick=async()=>{const endpoint=document.getElementById('endpoint').value;start.disabled=true;status.textContent='正在连接...';try{await window.deepSeekHarnessDesktop.saveConfig({endpoint,mode:'custom'});await window.deepSeekHarnessDesktop.retry();}catch(error){status.textContent=error instanceof Error?error.message:String(error);start.disabled=false;}};</script></body></html>`
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#f6f7f4',
    icon: path.join(__dirname, 'assets', 'app-icon.png'),
    autoHideMenuBar: true,
    title: 'DeepSeek Harness',
    webPreferences: {
      preload: path.join(__dirname, 'harness-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) debugLog(`Renderer load failed: ${errorCode} ${errorDescription} ${validatedURL}`)
  })
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    debugLog(`Renderer console level=${level}: ${message} (${sourceId || 'unknown'}:${line || 0})`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    debugLog(`Renderer process gone: reason=${details.reason} exitCode=${details.exitCode}`)
    if (details.reason !== 'clean-exit') {
      void showConnectionPage(`界面进程异常退出（${details.reason}），请重试；若仍失败请重新安装最新版。`)
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.once('ready-to-show', () => mainWindow.show())
}

async function showConnectionPage(errorMessage = '') {
  if (!mainWindow || mainWindow.isDestroyed()) return
  debugLog(`Showing connection page: ${errorMessage}`)
  mainWindow.webContents.stop()
  await new Promise((resolve) => setTimeout(resolve, 120))
  await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(connectionPage(errorMessage))}`)
  mainWindow.show()
}

function loadWorkspaceUrl(url) {
  debugLog(`Loading workspace URL: ${url}`)
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error) => {
      if (settled) return
      settled = true
      mainWindow.webContents.removeListener('did-fail-load', onFail)
      mainWindow.webContents.removeListener('did-finish-load', onFinish)
      if (error) reject(error)
      else resolve()
    }
    const onFail = (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return
      debugLog(`Workspace load failed: ${errorCode} ${errorDescription} ${validatedURL}`)
      finish(new Error(`${errorDescription || '网页加载失败'} (${errorCode})\n${validatedURL}`))
    }
    const onFinish = async () => {
      try {
        const deadline = Date.now() + 5_000
        while (Date.now() < deadline) {
          const hasContent = await mainWindow.webContents.executeJavaScript(`(() => {
            const root = document.getElementById('root')
            if (root) return root.childElementCount > 0 || Boolean(root.textContent && root.textContent.trim())
            const body = document.body
            return Boolean(body && ((body.innerText && body.innerText.trim()) || body.childElementCount > 0))
          })()`)
          if (hasContent) {
            finish()
            return
          }
          await delay(150)
        }
        finish(new Error('工作台页面加载完成但没有可显示的内容'))
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)))
      }
    }
    mainWindow.webContents.once('did-fail-load', onFail)
    mainWindow.webContents.once('did-finish-load', onFinish)
    mainWindow.loadURL(url).catch(finish)
  })
}

async function loadWorkspace() {
  currentConfig = readConfig()
  if (currentConfig.mode === 'local' && (!currentConfig.endpoint || !localHarnessProcess)) {
    currentConfig.endpoint = await startLocalHarness()
    currentConfig.local = true
    writeConfig(currentConfig)
  }
  debugLog(`Using endpoint: ${currentConfig.endpoint}`)
  try {
    await loadWorkspaceUrl(workspaceUrl(currentConfig))
    if (isDefaultCloud(currentConfig)) {
      const loadedUrl = new URL(mainWindow.webContents.getURL())
      if (loadedUrl.pathname.replace(/\/$/, '') === '/products' && loadedUrl.searchParams.get('login') === 'required') {
        loadedUrl.searchParams.set('return', DEFAULT_REMOTE_PATH)
        debugLog(`Preparing cloud login redirect: ${loadedUrl}`)
        await loadWorkspaceUrl(loadedUrl.toString())
      }
    }
    mainWindow.show()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    debugLog(`Workspace exception: ${message}`)
    await showConnectionPage(`连接失败：${message}`)
  }
}

function registerHandlers() {
  ipcMain.handle('harness-config:get', () => currentConfig || readConfig())
  ipcMain.handle('harness-config:save', (_event, payload) => {
    const endpoint = normalizeEndpoint(payload?.endpoint)
    const mode = payload?.mode === 'server'
      ? 'server'
      : payload?.mode === 'local'
        ? 'local'
        : 'custom'
    currentConfig = { endpoint, local: mode !== 'server', mode }
    writeConfig(currentConfig)
    return currentConfig
  })
  ipcMain.handle('harness-mode:start', async (_event, mode) => {
    if (mode === 'local') {
      currentConfig = { endpoint: 'http://127.0.0.1:0', local: true, mode: 'local' }
      try {
        currentConfig.endpoint = await startLocalHarness()
        writeConfig(currentConfig)
        await loadWorkspace()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await showConnectionPage(`本地服务启动失败：${message}`)
        throw error
      }
    } else {
      await stopLocalHarness()
      currentConfig = { endpoint: DEFAULT_REMOTE_ORIGIN, local: false, mode: 'server' }
      writeConfig(currentConfig)
      await loadWorkspace()
    }
    return currentConfig
  })
  ipcMain.handle('harness-connection:retry', () => loadWorkspace())
  ipcMain.handle('harness-update:check', async () => updater.assessUpdates(await latestRelease(true), currentUpdateVersions()))
  ipcMain.handle('harness-update:install-plugin', () => installPluginUpdate())
  ipcMain.handle('harness-update:install-desktop', () => installDesktopUpdate())
  ipcMain.handle('harness-update:open-project', () => shell.openExternal(updater.PROJECT_URL))
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.setAppUserModelId('cn.deepseek.harness.desktop')
  app.whenReady().then(async () => {
    debugLog('Application ready')
    registerHandlers()
    createWindow()
    await showConnectionPage()
  })
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  app.on('window-all-closed', () => app.quit())
  app.on('before-quit', () => { void stopLocalHarness() })
}
