const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const REPOSITORY = 'ljwei-stak/deepseek-harness'
const PROJECT_URL = `https://github.com/${REPOSITORY}`
const RELEASES_URL = `${PROJECT_URL}/releases`
const LATEST_RELEASE_API = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=30`
const RELEASE_DOWNLOAD_PREFIX = `${PROJECT_URL}/releases/download/`
const PLUGIN_NAME = 'model-router-galgame'
const UPDATE_MANIFEST_ASSET = 'model-router-galgame-update.json'
const CHECKSUM_ASSET = 'SHA256SUMS.txt'
const MAX_METADATA_BYTES = 2 * 1024 * 1024
const RETRYABLE_FILESYSTEM_ERRORS = new Set(['EACCES', 'EBUSY', 'ENOTEMPTY', 'EPERM'])

function parseVersion(value) {
  const match = String(value ?? '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
  if (match === null) throw new Error(`无效版本号：${String(value ?? '')}`)
  return {
    raw: `${match[1]}.${match[2]}.${match[3]}${match[4] ? `-${match[4]}` : ''}`,
    parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] ?? '',
  }
}

function compareVersions(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)
  for (let index = 0; index < a.parts.length; index += 1) {
    if (a.parts[index] !== b.parts[index]) return a.parts[index] > b.parts[index] ? 1 : -1
  }
  if (a.prerelease === b.prerelease) return 0
  if (a.prerelease === '') return 1
  if (b.prerelease === '') return -1
  return a.prerelease.localeCompare(b.prerelease, 'en', { numeric: true })
}

function safeAssetName(value) {
  const name = String(value ?? '')
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(name) || path.basename(name) !== name) {
    throw new Error(`Release 包含不安全的文件名：${name}`)
  }
  return name
}

function normalizeAsset(asset) {
  const name = safeAssetName(asset?.name)
  const url = String(asset?.browser_download_url ?? '')
  if (!url.startsWith(RELEASE_DOWNLOAD_PREFIX)) {
    throw new Error(`Release 文件 ${name} 不属于 ${REPOSITORY}`)
  }
  const size = Number(asset?.size)
  if (!Number.isSafeInteger(size) || size < 0) throw new Error(`Release 文件 ${name} 的大小无效`)
  return { name, url, size }
}

function normalizeRelease(raw) {
  if (raw?.draft === true || raw?.prerelease === true) throw new Error('最新 Release 不是稳定版本')
  const tag = String(raw?.tag_name ?? '')
  const match = tag.match(/^model-router-galgame-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/)
  if (match === null) throw new Error(`最新 Release 标签无法识别：${tag}`)
  const version = parseVersion(match[1]).raw
  const htmlUrl = String(raw?.html_url ?? '')
  if (!htmlUrl.startsWith(`${RELEASES_URL}/tag/`)) throw new Error('最新 Release 链接不属于项目仓库')
  const assets = new Map()
  for (const rawAsset of Array.isArray(raw?.assets) ? raw.assets : []) {
    const asset = normalizeAsset(rawAsset)
    assets.set(asset.name, asset)
  }
  return { tag, version, htmlUrl, assets }
}

async function fetchLimitedText(url, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DeepSeek-Harness-Updater',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    const remaining = response.headers?.get?.('x-ratelimit-remaining')
    const suffix = remaining === '0' ? '，GitHub 匿名请求额度已用完，请稍后再试' : ''
    throw new Error(`GitHub 更新请求失败（HTTP ${response.status}${suffix}）`)
  }
  const length = Number(response.headers?.get?.('content-length') ?? 0)
  if (Number.isFinite(length) && length > MAX_METADATA_BYTES) throw new Error('Release 元数据超过大小限制')
  const text = await response.text()
  if (Buffer.byteLength(text) > MAX_METADATA_BYTES) throw new Error('Release 元数据超过大小限制')
  return text
}

function parseJsonText(text, label) {
  try {
    return JSON.parse(String(text).replace(/^\uFEFF/, ''))
  } catch (error) {
    throw new Error(`${label} 不是有效 JSON：${error.message}`, { cause: error })
  }
}

function releaseAsset(release, name) {
  const asset = release.assets.get(name)
  if (asset === undefined) throw new Error(`Release 缺少文件：${name}`)
  return asset
}

function normalizeManifest(raw, release) {
  if (raw?.schemaVersion !== 1) throw new Error('更新清单版本不受支持')
  const releaseVersion = parseVersion(raw?.releaseVersion).raw
  if (releaseVersion !== release.version) throw new Error('更新清单与 Release 版本不一致')

  const plugin = raw?.plugin
  if (typeof plugin !== 'object' || plugin === null) throw new Error('更新清单缺少插件信息')
  const pluginVersion = parseVersion(plugin.version).raw
  const pluginAsset = safeAssetName(plugin.asset)
  releaseAsset(release, pluginAsset)
  const pluginSha256 = String(plugin.sha256 ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(pluginSha256)) throw new Error('更新清单中的插件 SHA256 无效')

  const desktop = raw?.desktop
  if (typeof desktop !== 'object' || desktop === null) throw new Error('更新清单缺少客户端信息')
  const desktopVersion = parseVersion(desktop.version).raw
  const installer = safeAssetName(desktop.installer)
  const parts = Array.isArray(desktop.parts) ? desktop.parts.map(safeAssetName) : []
  if (parts.length === 0) releaseAsset(release, installer)
  else for (const part of parts) releaseAsset(release, part)
  const desktopSha256 = String(desktop.sha256 ?? '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(desktopSha256)) throw new Error('更新清单中的客户端 SHA256 无效')

  return {
    schemaVersion: 1,
    releaseVersion,
    plugin: {
      version: pluginVersion,
      asset: pluginAsset,
      sha256: pluginSha256,
      minDesktopVersion: parseVersion(plugin.minDesktopVersion).raw,
      minRuntimeVersion: parseVersion(plugin.minRuntimeVersion).raw,
    },
    desktop: {
      version: desktopVersion,
      installer,
      parts,
      sha256: desktopSha256,
    },
  }
}

async function fetchLatestRelease(fetchImpl = globalThis.fetch) {
  const payload = parseJsonText(await fetchLimitedText(LATEST_RELEASE_API, fetchImpl), 'GitHub Release 响应')
  const rawRelease = Array.isArray(payload)
    ? payload.find(candidate => (
        candidate?.draft !== true
        && candidate?.prerelease !== true
        && /^model-router-galgame-\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(candidate?.tag_name ?? ''))
      ))
    : payload
  if (rawRelease === undefined) throw new Error('项目仓库中没有 Model Router + GALGame 稳定 Release')
  const release = normalizeRelease(rawRelease)
  const manifestAsset = release.assets.get(UPDATE_MANIFEST_ASSET)
  let manifest = null
  if (manifestAsset !== undefined) {
    manifest = normalizeManifest(parseJsonText(await fetchLimitedText(manifestAsset.url, fetchImpl), '更新清单'), release)
  }
  return { release, manifest }
}

function inferDesktopDescriptor(release) {
  const direct = [...release.assets.values()].find(asset => (
    asset.name.endsWith(`-${release.version}-Windows-x64.exe`)
  ))
  if (direct !== undefined) {
    return { version: release.version, installer: direct.name, parts: [], sha256: '' }
  }
  const partPattern = new RegExp(`^(.*-${release.version.replaceAll('.', '\\.')}\-Windows-x64\\.exe)\\.part(\\d+)$`)
  const matches = [...release.assets.values()]
    .map(asset => ({ asset, match: asset.name.match(partPattern) }))
    .filter(entry => entry.match !== null)
    .sort((left, right) => Number(left.match[2]) - Number(right.match[2]))
  if (matches.length === 0) return null
  const installer = matches[0].match[1]
  if (matches.some(entry => entry.match[1] !== installer)) return null
  for (let index = 0; index < matches.length; index += 1) {
    if (Number(matches[index].match[2]) !== index + 1) return null
  }
  return { version: release.version, installer, parts: matches.map(entry => entry.asset.name), sha256: '' }
}

function assessUpdates(bundle, versions) {
  const { release, manifest } = bundle
  const plugin = manifest?.plugin ?? null
  const desktop = manifest?.desktop ?? inferDesktopDescriptor(release)
  const pluginCurrent = parseVersion(versions.pluginVersion).raw
  const desktopCurrent = parseVersion(versions.desktopVersion).raw
  const runtimeCurrent = parseVersion(versions.runtimeVersion).raw
  const pluginNewer = plugin !== null && compareVersions(plugin.version, pluginCurrent) > 0
  const pluginCompatible = plugin !== null
    && compareVersions(desktopCurrent, plugin.minDesktopVersion) >= 0
    && compareVersions(runtimeCurrent, plugin.minRuntimeVersion) >= 0
  const desktopNewer = desktop !== null && compareVersions(desktop.version, desktopCurrent) > 0

  return {
    repositoryUrl: PROJECT_URL,
    releasesUrl: RELEASES_URL,
    releaseUrl: release.htmlUrl,
    releaseVersion: release.version,
    plugin: {
      currentVersion: pluginCurrent,
      latestVersion: plugin?.version ?? release.version,
      available: pluginNewer,
      installable: pluginNewer && pluginCompatible,
      reason: plugin === null
        ? compareVersions(release.version, pluginCurrent) <= 0
          ? '已是最新版'
          : '该 Release 没有独立插件包或兼容性清单'
        : pluginNewer && !pluginCompatible
          ? `插件需要客户端 >= ${plugin.minDesktopVersion}、本地运行时 >= ${plugin.minRuntimeVersion}`
          : pluginNewer ? '' : '已是最新版',
    },
    desktop: {
      currentVersion: desktopCurrent,
      latestVersion: desktop?.version ?? release.version,
      available: desktopNewer,
      installable: desktopNewer && desktop !== null,
      reason: desktop === null ? '该 Release 没有 Windows 客户端安装包' : desktopNewer ? '' : '已是最新版',
    },
  }
}

function parseChecksums(text) {
  const checksums = new Map()
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.trim().match(/^([0-9a-fA-F]{64})\s+\*?([^\\/]+)$/)
    if (match !== null) checksums.set(safeAssetName(match[2]), match[1].toLowerCase())
  }
  return checksums
}

async function expectedChecksum(bundle, filename, provided, fetchImpl = globalThis.fetch) {
  if (/^[0-9a-f]{64}$/.test(provided)) return provided
  const checksumAsset = releaseAsset(bundle.release, CHECKSUM_ASSET)
  const checksum = parseChecksums(await fetchLimitedText(checksumAsset.url, fetchImpl)).get(filename)
  if (checksum === undefined) throw new Error(`SHA256SUMS.txt 缺少 ${filename}`)
  return checksum
}

function sha256File(filename) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filename)
    stream.on('error', reject)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function randomSibling(filename, suffix) {
  return `${filename}.${suffix}-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
}

async function writeAll(handle, chunk) {
  let offset = 0
  while (offset < chunk.length) {
    const result = await handle.write(chunk, offset, chunk.length - offset)
    if (result.bytesWritten <= 0) throw new Error('写入更新文件时没有取得进展')
    offset += result.bytesWritten
  }
}

async function retryFilesystemOperation(label, operation) {
  let lastError
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!RETRYABLE_FILESYSTEM_ERRORS.has(error?.code) || attempt === 7) throw error
      await new Promise(resolve => setTimeout(resolve, Math.min(1600, 100 * (2 ** attempt))))
    }
  }
  throw new Error(`${label} 失败：${String(lastError)}`)
}

async function safeRemoveTree(target) {
  let stat
  try {
    stat = await fs.promises.lstat(target)
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    await retryFilesystemOperation('删除文件', () => fs.promises.unlink(target))
    return
  }
  for (const entry of await fs.promises.readdir(target)) {
    await safeRemoveTree(path.join(target, entry))
  }
  await retryFilesystemOperation('删除目录', () => fs.promises.rmdir(target))
}

async function bestEffortClose(handle) {
  try {
    await handle.close()
  } catch {
    // The download or combine error remains the actionable failure.
  }
}

async function bestEffortRemove(target) {
  try {
    await safeRemoveTree(target)
  } catch {
    // Inactive random-name residue cannot replace a verified update.
  }
}

async function downloadAsset(asset, destination, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  try {
    const existing = await fs.promises.stat(destination)
    if (existing.isFile() && existing.size === asset.size) return { path: destination, bytes: existing.size, reused: true }
    await safeRemoveTree(destination)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  await fs.promises.mkdir(path.dirname(destination), { recursive: true })
  const partial = randomSibling(destination, 'partial')
  const handle = await fs.promises.open(partial, 'wx', 0o600)
  let received = 0
  try {
    const response = await fetchImpl(asset.url, {
      headers: { 'User-Agent': 'DeepSeek-Harness-Updater' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10 * 60_000),
    })
    if (!response.ok || response.body === null) throw new Error(`下载 ${asset.name} 失败（HTTP ${response.status}）`)
    for await (const rawChunk of response.body) {
      const chunk = Buffer.from(rawChunk)
      await writeAll(handle, chunk)
      received += chunk.length
      options.onBytes?.(chunk.length, received, asset.size)
    }
    await handle.sync()
  } catch (error) {
    await bestEffortClose(handle)
    await bestEffortRemove(partial)
    throw error
  }
  await handle.close()
  if (received !== asset.size) {
    await safeRemoveTree(partial)
    throw new Error(`${asset.name} 下载不完整：应为 ${asset.size} 字节，实际 ${received} 字节`)
  }
  await retryFilesystemOperation('保存下载文件', () => fs.promises.rename(partial, destination))
  return { path: destination, bytes: received, reused: false }
}

async function downloadAssets(release, names, directory, onProgress, fetchImpl) {
  const assets = names.map(name => releaseAsset(release, name))
  const total = assets.reduce((sum, asset) => sum + asset.size, 0)
  let completed = 0
  for (const asset of assets) {
    const destination = path.join(directory, asset.name)
    let existing = 0
    try {
      const stat = await fs.promises.stat(destination)
      if (stat.isFile() && stat.size === asset.size) existing = stat.size
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    if (existing > 0) {
      completed += existing
      onProgress?.({ phase: 'download', received: completed, total, percent: total === 0 ? 100 : Math.round(completed * 100 / total), file: asset.name })
      continue
    }
    await downloadAsset(asset, destination, {
      fetchImpl,
      onBytes: delta => {
        completed += delta
        onProgress?.({ phase: 'download', received: completed, total, percent: total === 0 ? 100 : Math.round(completed * 100 / total), file: asset.name })
      },
    })
  }
  return assets.map(asset => path.join(directory, asset.name))
}

async function combineParts(parts, output) {
  const partial = randomSibling(output, 'combining')
  const handle = await fs.promises.open(partial, 'wx', 0o600)
  try {
    for (const part of parts) {
      const stream = fs.createReadStream(part)
      for await (const chunk of stream) await writeAll(handle, chunk)
    }
    await handle.sync()
  } catch (error) {
    await bestEffortClose(handle)
    await bestEffortRemove(partial)
    throw error
  }
  await handle.close()
  await safeRemoveTree(output).catch(error => {
    if (error?.code !== 'ENOENT') throw error
  })
  await retryFilesystemOperation('合并客户端安装包', () => fs.promises.rename(partial, output))
}

async function verifyDownload(filename, expected) {
  const actual = await sha256File(filename)
  if (actual !== expected.toLowerCase()) {
    await safeRemoveTree(filename)
    throw new Error(`SHA256 校验失败：${path.basename(filename)}`)
  }
  return actual
}

async function preparePluginArchive(bundle, directory, options = {}) {
  const descriptor = bundle.manifest?.plugin
  if (descriptor === undefined) throw new Error('最新 Release 没有可一键安装的插件包')
  const archive = releaseAsset(bundle.release, descriptor.asset)
  const [filename] = await downloadAssets(bundle.release, [archive.name], directory, options.onProgress, options.fetchImpl)
  options.onProgress?.({ phase: 'verify', percent: 100, file: archive.name })
  const expected = await expectedChecksum(bundle, archive.name, descriptor.sha256, options.fetchImpl)
  await verifyDownload(filename, expected)
  return { filename, descriptor }
}

async function prepareDesktopInstaller(bundle, directory, options = {}) {
  const descriptor = bundle.manifest?.desktop ?? inferDesktopDescriptor(bundle.release)
  if (descriptor === null || descriptor === undefined) throw new Error('最新 Release 没有 Windows 客户端安装包')
  await fs.promises.mkdir(directory, { recursive: true })
  const output = path.join(directory, descriptor.installer)
  const expected = await expectedChecksum(bundle, descriptor.installer, descriptor.sha256, options.fetchImpl)
  try {
    if ((await fs.promises.stat(output)).isFile() && await sha256File(output) === expected) return { filename: output, descriptor, reused: true }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  if (descriptor.parts.length === 0) {
    await downloadAssets(bundle.release, [descriptor.installer], directory, options.onProgress, options.fetchImpl)
  } else {
    const parts = await downloadAssets(bundle.release, descriptor.parts, directory, options.onProgress, options.fetchImpl)
    options.onProgress?.({ phase: 'combine', percent: 100, file: descriptor.installer })
    await combineParts(parts, output)
  }
  options.onProgress?.({ phase: 'verify', percent: 100, file: descriptor.installer })
  try {
    await verifyDownload(output, expected)
  } catch (error) {
    if (descriptor.parts.length > 0) {
      await Promise.all(descriptor.parts.map(name => bestEffortRemove(path.join(directory, name))))
    }
    throw error
  }
  return { filename: output, descriptor, reused: false }
}

function scrubbedEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) => !/(?:KEY|SECRET|TOKEN|PASSWORD)/i.test(key)))
}

function runTar(arguments_) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === 'win32' ? 'tar.exe' : 'tar'
    const child = spawn(executable, arguments_, {
      windowsHide: true,
      env: scrubbedEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => {
      stdout += String(chunk)
      if (stdout.length > 4 * 1024 * 1024) child.kill()
    })
    child.stderr.on('data', chunk => { stderr += String(chunk) })
    child.once('error', reject)
    child.once('exit', code => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr.trim() || `tar 退出码 ${code}`))
    })
  })
}

function assertSafeArchiveEntries(listing) {
  for (const rawEntry of String(listing).split(/\r?\n/)) {
    const entry = rawEntry.trim().replaceAll('\\', '/')
    if (entry === '' || entry === '.') continue
    if (entry.startsWith('/') || /^[A-Za-z]:/.test(entry) || entry.includes('\0')) {
      throw new Error(`插件包包含不安全路径：${entry}`)
    }
    const parts = entry.split('/').filter(part => part !== '' && part !== '.')
    if (parts.includes('..')) throw new Error(`插件包包含目录穿越路径：${entry}`)
  }
}

async function rejectLinks(root) {
  for (const entry of await fs.promises.readdir(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name)
    const stat = await fs.promises.lstat(candidate)
    if (stat.isSymbolicLink()) throw new Error(`插件包不能包含符号链接：${entry.name}`)
    if (stat.isDirectory()) await rejectLinks(candidate)
  }
}

function readPluginPackage(root) {
  const parsed = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (parsed?.name !== PLUGIN_NAME) throw new Error(`插件包名称必须是 ${PLUGIN_NAME}`)
  const version = parseVersion(parsed.version).raw
  const updater = parsed?.dshUpdater
  if (typeof updater !== 'object' || updater === null) throw new Error('插件包缺少 dshUpdater 兼容性信息')
  const minDesktopVersion = parseVersion(updater.minDesktopVersion).raw
  const minRuntimeVersion = parseVersion(updater.minRuntimeVersion).raw
  for (const required of [
    path.join(root, '.dsh-plugin', 'index.mjs'),
    path.join(root, '.dsh-plugin', 'client.js'),
    path.join(root, 'cordis.patch.yml'),
  ]) {
    if (!fs.existsSync(required)) throw new Error(`插件包缺少 ${path.relative(root, required)}`)
  }
  return { version, minDesktopVersion, minRuntimeVersion, parsed }
}

function assertPluginCompatibility(plugin, versions) {
  if (compareVersions(versions.desktopVersion, plugin.minDesktopVersion) < 0) {
    throw new Error(`插件 ${plugin.version} 需要桌面客户端 ${plugin.minDesktopVersion} 或更高版本`)
  }
  if (compareVersions(versions.runtimeVersion, plugin.minRuntimeVersion) < 0) {
    throw new Error(`插件 ${plugin.version} 需要本地运行时 ${plugin.minRuntimeVersion} 或更高版本`)
  }
}

function pluginUpdateRoot(userData) {
  return path.join(userData, 'plugin-updates', PLUGIN_NAME)
}

function activePluginRecord(userData) {
  try {
    const root = pluginUpdateRoot(userData)
    const record = JSON.parse(fs.readFileSync(path.join(root, 'active.json'), 'utf8'))
    const version = parseVersion(record?.version).raw
    const directory = path.join(root, 'versions', version)
    const plugin = readPluginPackage(directory)
    if (plugin.version !== version) throw new Error('活动插件版本记录不一致')
    return { directory, ...plugin }
  } catch {
    return null
  }
}

async function installPluginArchive(archive, descriptor, userData, versions) {
  const root = pluginUpdateRoot(userData)
  const versionsRoot = path.join(root, 'versions')
  await fs.promises.mkdir(versionsRoot, { recursive: true })
  const staging = await fs.promises.mkdtemp(path.join(root, '.installing-'))
  try {
    assertSafeArchiveEntries(await runTar(['-tzf', archive]))
    await runTar(['-xzf', archive, '-C', staging])
    await rejectLinks(staging)
    let packageRoot = staging
    if (!fs.existsSync(path.join(packageRoot, 'package.json'))) {
      const entries = await fs.promises.readdir(staging, { withFileTypes: true })
      if (entries.length === 1 && entries[0].isDirectory()) packageRoot = path.join(staging, entries[0].name)
    }
    const plugin = readPluginPackage(packageRoot)
    if (plugin.version !== descriptor.version) throw new Error('插件包版本与更新清单不一致')
    if (plugin.minDesktopVersion !== descriptor.minDesktopVersion || plugin.minRuntimeVersion !== descriptor.minRuntimeVersion) {
      throw new Error('插件包兼容性信息与更新清单不一致')
    }
    assertPluginCompatibility(plugin, versions)
    const destination = path.join(versionsRoot, plugin.version)
    try {
      const existing = readPluginPackage(destination)
      if (existing.version !== plugin.version) throw new Error('已下载的插件版本目录无效')
    } catch {
      await safeRemoveTree(destination)
      await retryFilesystemOperation('保存插件版本', () => fs.promises.rename(packageRoot, destination))
    }
    const pointer = path.join(root, 'active.json')
    const temporaryPointer = randomSibling(pointer, 'writing')
    const backupPointer = randomSibling(pointer, 'backup')
    await fs.promises.writeFile(temporaryPointer, `${JSON.stringify({ version: plugin.version }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    let hasPointerBackup = false
    try {
      try {
        await retryFilesystemOperation('备份插件版本指针', () => fs.promises.rename(pointer, backupPointer))
        hasPointerBackup = true
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }
      await retryFilesystemOperation('启用插件版本', () => fs.promises.rename(temporaryPointer, pointer))
    } catch (error) {
      await bestEffortRemove(temporaryPointer)
      if (hasPointerBackup) {
        try {
          await retryFilesystemOperation('恢复插件版本指针', () => fs.promises.rename(backupPointer, pointer))
        } catch (restoreError) {
          throw new Error(`启用插件版本失败，且无法恢复原版本指针：${restoreError.message}`, { cause: error })
        }
      }
      throw error
    }
    if (hasPointerBackup) {
      try {
        await safeRemoveTree(backupPointer)
      } catch {
        // A stale backup pointer is inert; the new active pointer is already durable.
      }
    }
    return { version: plugin.version, directory: destination }
  } finally {
    await bestEffortRemove(staging)
  }
}

function selectPluginSource(runtimeRoot, userData, runtimeVersion, bundledVersion) {
  const bundled = path.join(runtimeRoot, 'node_modules', PLUGIN_NAME)
  const bundledPlugin = readPluginPackage(bundled)
  if (bundledPlugin.version !== parseVersion(bundledVersion).raw) throw new Error('内置插件版本与客户端版本不一致')
  const active = activePluginRecord(userData)
  if (active === null || compareVersions(active.version, bundledPlugin.version) <= 0) return { directory: bundled, ...bundledPlugin, source: 'bundled' }
  if (compareVersions(runtimeVersion, active.minRuntimeVersion) < 0) return { directory: bundled, ...bundledPlugin, source: 'bundled' }
  return { ...active, source: 'update' }
}

async function syncPluginToProfile(source, home) {
  const targetParent = path.join(home, 'profiles', 'node_modules')
  const target = path.join(targetParent, PLUGIN_NAME)
  await fs.promises.mkdir(targetParent, { recursive: true })
  try {
    if (readPluginPackage(target).version === source.version) return target
  } catch {
    // An absent or incomplete profile package is replaced atomically below.
  }

  const staging = randomSibling(target, 'installing')
  const backup = randomSibling(target, 'backup')
  let hasBackup = false
  try {
    await fs.promises.cp(source.directory, staging, { recursive: true, force: false, errorOnExist: true })
    if (readPluginPackage(staging).version !== source.version) throw new Error('复制后的插件版本不一致')
    try {
      await fs.promises.lstat(target)
      await retryFilesystemOperation('备份当前插件', () => fs.promises.rename(target, backup))
      hasBackup = true
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    await retryFilesystemOperation('启用插件', () => fs.promises.rename(staging, target))
  } catch (error) {
    await bestEffortRemove(staging)
    if (hasBackup) {
      await bestEffortRemove(target)
      try {
        await retryFilesystemOperation('恢复原插件', () => fs.promises.rename(backup, target))
      } catch (restoreError) {
        throw new Error(`启用插件失败，且无法恢复原插件：${restoreError.message}`, { cause: error })
      }
    }
    throw error
  }
  if (hasBackup) {
    try {
      await safeRemoveTree(backup)
    } catch {
      // A stale profile backup is inert; the new package is already active.
    }
  }
  return target
}

function packageManifest(directory) {
  const filename = path.join(directory, 'package.json')
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(filename, 'utf8'))
  } catch (error) {
    throw new Error(`无法读取运行时程序包：${filename}：${error.message}`, { cause: error })
  }
  if (typeof manifest?.name !== 'string' || typeof manifest?.version !== 'string') {
    throw new Error(`运行时程序包清单缺少名称或版本：${filename}`)
  }
  return manifest
}

function assertPackageName(name) {
  if (!/^(?:@[0-9A-Za-z._-]+\/)?[0-9A-Za-z._-]+$/.test(name)) {
    throw new Error(`运行时程序包名称无效：${name}`)
  }
}

function isInsideDirectory(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate))
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function findPackageDirectory(entry, expectedName) {
  let current = path.dirname(entry)
  while (true) {
    const filename = path.join(current, 'package.json')
    if (fs.existsSync(filename)) {
      try {
        if (JSON.parse(fs.readFileSync(filename, 'utf8'))?.name === expectedName) return current
      } catch {
        // Continue upward; an unrelated malformed package cannot own this dependency.
      }
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  throw new Error(`无法定位运行时依赖 ${expectedName} 的程序包目录`)
}

function resolveDependencyDirectory(source, name, allowedRoot, optional) {
  assertPackageName(name)
  try {
    const entry = require.resolve(name, { paths: [source] })
    const directory = fs.realpathSync(findPackageDirectory(entry, name))
    if (!isInsideDirectory(allowedRoot, directory)) {
      throw new Error(`依赖 ${name} 解析到了运行时之外：${directory}`)
    }
    return directory
  } catch (error) {
    if (optional && error?.code === 'MODULE_NOT_FOUND') return null
    throw new Error(`无法解析运行时依赖 ${name}：${error.message}`, { cause: error })
  }
}

async function copyPackageClosure(source, target, allowedSourceRoot, ancestry = new Set()) {
  const realSource = fs.realpathSync(source)
  if (!isInsideDirectory(allowedSourceRoot, realSource)) {
    throw new Error(`拒绝复制运行时之外的程序包：${realSource}`)
  }
  const manifest = packageManifest(realSource)
  const identity = `${manifest.name}@${manifest.version}:${realSource}`
  await fs.promises.cp(realSource, target, {
    recursive: true,
    force: false,
    errorOnExist: true,
    dereference: true,
    filter(candidate) {
      const relative = path.relative(realSource, candidate)
      return relative === '' && candidate === realSource
        || relative.split(path.sep)[0] !== 'node_modules'
    },
  })
  if (ancestry.has(identity)) return

  const nextAncestry = new Set(ancestry).add(identity)
  const required = Object.keys(manifest.dependencies ?? {})
  const optional = Object.keys(manifest.optionalDependencies ?? {})
  for (const name of [...new Set([...required, ...optional])].sort()) {
    const dependency = resolveDependencyDirectory(realSource, name, allowedSourceRoot, optional.includes(name))
    if (dependency === null) continue
    const destination = path.join(target, 'node_modules', ...name.split('/'))
    await fs.promises.mkdir(path.dirname(destination), { recursive: true })
    await copyPackageClosure(dependency, destination, allowedSourceRoot, nextAncestry)
  }
}

function assertPackageClosure(directory, allowedRoot, ancestry = new Set()) {
  const realDirectory = fs.realpathSync(directory)
  if (!isInsideDirectory(allowedRoot, realDirectory)) {
    throw new Error(`程序包解析到了 profile 之外：${realDirectory}`)
  }
  const manifest = packageManifest(realDirectory)
  const identity = `${manifest.name}@${manifest.version}:${realDirectory}`
  if (ancestry.has(identity)) return manifest
  const nextAncestry = new Set(ancestry).add(identity)
  const required = Object.keys(manifest.dependencies ?? {})
  const optional = Object.keys(manifest.optionalDependencies ?? {})
  for (const name of [...new Set([...required, ...optional])].sort()) {
    const dependency = resolveDependencyDirectory(realDirectory, name, allowedRoot, optional.includes(name))
    if (dependency !== null) assertPackageClosure(dependency, allowedRoot, nextAncestry)
  }
  return manifest
}

async function syncRuntimePackageToProfile(runtimeRoot, home, name, expectedVersion) {
  assertPackageName(name)
  const runtimeNodeModules = fs.realpathSync(path.join(runtimeRoot, 'node_modules'))
  const source = path.join(runtimeRoot, 'node_modules', ...name.split('/'))
  const sourceManifest = packageManifest(source)
  if (sourceManifest.name !== name || sourceManifest.version !== parseVersion(expectedVersion).raw) {
    throw new Error(`内置 ${name} 版本不匹配：需要 ${expectedVersion}，实际为 ${sourceManifest.version || '未知'}`)
  }

  const targetParent = path.join(home, 'profiles', 'node_modules')
  const target = path.join(targetParent, ...name.split('/'))
  await fs.promises.mkdir(targetParent, { recursive: true })
  try {
    const installed = assertPackageClosure(target, targetParent)
    if (installed.name === name && compareVersions(installed.version, sourceManifest.version) >= 0) return target
  } catch {
    // An absent, incomplete, or externally resolved package is replaced atomically below.
  }

  const staging = randomSibling(target, 'installing')
  const backup = randomSibling(target, 'backup')
  let hasBackup = false
  try {
    await copyPackageClosure(source, staging, runtimeNodeModules)
    const installed = assertPackageClosure(staging, path.dirname(staging))
    if (installed.name !== name || installed.version !== sourceManifest.version) {
      throw new Error(`复制后的 ${name} 版本不一致`)
    }
    try {
      await fs.promises.lstat(target)
      await retryFilesystemOperation(`备份当前 ${name}`, () => fs.promises.rename(target, backup))
      hasBackup = true
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
    await retryFilesystemOperation(`启用 ${name}`, () => fs.promises.rename(staging, target))
  } catch (error) {
    await bestEffortRemove(staging)
    if (hasBackup) {
      await bestEffortRemove(target)
      try {
        await retryFilesystemOperation(`恢复原 ${name}`, () => fs.promises.rename(backup, target))
      } catch (restoreError) {
        throw new Error(`启用 ${name} 失败，且无法恢复原程序包：${restoreError.message}`, { cause: error })
      }
    }
    throw error
  }
  if (hasBackup) await bestEffortRemove(backup)
  return target
}

function effectivePluginVersion(userData, bundledVersion, runtimeVersion) {
  const active = activePluginRecord(userData)
  if (active === null) return parseVersion(bundledVersion).raw
  if (compareVersions(active.version, bundledVersion) <= 0) return parseVersion(bundledVersion).raw
  if (compareVersions(runtimeVersion, active.minRuntimeVersion) < 0) return parseVersion(bundledVersion).raw
  return active.version
}

module.exports = {
  CHECKSUM_ASSET,
  LATEST_RELEASE_API,
  PLUGIN_NAME,
  PROJECT_URL,
  RELEASES_URL,
  UPDATE_MANIFEST_ASSET,
  activePluginRecord,
  assessUpdates,
  compareVersions,
  effectivePluginVersion,
  fetchLatestRelease,
  inferDesktopDescriptor,
  installPluginArchive,
  normalizeManifest,
  normalizeRelease,
  parseJsonText,
  parseChecksums,
  parseVersion,
  prepareDesktopInstaller,
  preparePluginArchive,
  readPluginPackage,
  safeRemoveTree,
  selectPluginSource,
  sha256File,
  syncPluginToProfile,
  syncRuntimePackageToProfile,
}
