const http = require('node:http')
const fs = require('node:fs')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron, expect, test } = require('@playwright/test')

const HARNESS_RUNTIME_VERSION = '0.5.2'
const WINDOWS_SYSTEM_PATH = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32')

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const open = await new Promise((resolve) => {
      const socket = net.createConnection({ host: '127.0.0.1', port })
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('error', () => resolve(false))
    })
    if (!open) return
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Local Harness still listens on port ${port}`)
}

function launchHarness(desktopRoot, profile, extraEnv = {}) {
  return electron.launch({
    executablePath: path.join(desktopRoot, 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [path.join(desktopRoot, 'harness-main.js')],
    cwd: desktopRoot,
    env: {
      ...process.env,
      DEEPSEEK_HARNESS_USER_DATA_DIR: profile,
      ...extraEnv,
    },
  })
}

async function readMarketStatus(window) {
  return window.evaluate(async () => {
    const response = await fetch('/dsh-market/status')
    return { status: response.status, body: await response.json() }
  })
}

async function expectMarketSettingsSection(window) {
  const notice = window.getByRole('dialog', { name: /^(内测声明|Internal Testing Notice)$/ })
  await notice.getByRole('button', { name: /^(继续|Continue)$/ }).click()
  await notice.waitFor({ state: 'detached', timeout: 15_000 })
  const credential = window.getByRole('dialog', { name: /^(添加一个 API Key 开始使用|Add an API key to get started)$/ })
  const configureLater = credential.getByRole('button', { name: /^(稍后配置|Configure later)$/ })
  const hasCredentialOnboarding = await configureLater.waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true, () => false)
  if (hasCredentialOnboarding) {
    await configureLater.click()
    await credential.waitFor({ state: 'detached', timeout: 15_000 })
  }
  await window.getByRole('button', { name: /^(设置|Settings)$/ }).click()
  const settings = window.getByRole('dialog', { name: /^(设置|Settings)$/ })
  // dsh-web-ui 0.2.9 labels the market section “创意工坊”; older snapshots
  // used “插件市场”. Either label is the same bundled market feature.
  await expect(settings.getByText(/^(插件市场|Plugin Market|创意工坊|Workshop)$/)).toBeVisible()
}

test('Harness desktop starts the bundled local runtime with one choice', async ({}) => {
  const desktopRoot = path.resolve(__dirname, '..')
  const projectRoot = path.resolve(desktopRoot, '..')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'deepseek-harness-source-'))
  const electronApp = await launchHarness(desktopRoot, profile, {
    DEEPSEEK_HARNESS_RUNTIME_ROOT: projectRoot,
    DEEPSEEK_HARNESS_NODE_PATH: process.execPath,
    PATH: WINDOWS_SYSTEM_PATH,
  })

  let localPort
  try {
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
    await window.getByRole('button', { name: /本地运行/ }).click()
    await window.getByRole('button', { name: '启动本地服务' }).click()
    await window.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\//, { timeout: 120_000 })
    await expect(window.locator('#root')).not.toBeEmpty({ timeout: 15_000 })
    localPort = Number(new URL(window.url()).port)
    expect(localPort).toBeGreaterThan(0)
    expect(await window.evaluate(() => window.deepSeekHarnessDesktop?.isDesktop)).toBe(true)
    expect(await window.evaluate(() => typeof window.deepSeekHarnessDesktop?.checkForUpdates)).toBe('function')
    expect(await window.evaluate(() => typeof window.deepSeekHarnessDesktop?.installPluginUpdate)).toBe('function')
    expect(await window.evaluate(() => typeof window.deepSeekHarnessDesktop?.installDesktopUpdate)).toBe('function')
    const market = await readMarketStatus(window)
    expect(market.status).toBe(200)
    expect(market.body.version).toBe('1.18.0')
    expect(market.body.pnpm).toBe(true)
    const bootIds = await window.evaluate(() => window.__DSH_BOOT__?.entries?.map(entry => entry.id) ?? [])
    expect(bootIds).toContain('@linxin666/dsh-client-ui-web-ui-settings')
    expect(bootIds).toContain('@linxin666/dsh-client-ui-market')
    expect(bootIds).toContain('@linxin666/dsh-client-ui-skin-center')
    expect(bootIds).toContain('@linxin666/dsh-client-ui-task-board')
    expect(bootIds).toContain('@linxin666/dsh-client-ui-plugin-manager')
    await expectMarketSettingsSection(window)
  } finally {
    await electronApp.close()
  }

  await waitForPortClosed(localPort)
  fs.rmSync(profile, { recursive: true, force: true })
})

test('Harness repairs an incomplete dsh-web-ui child dependency on upgrade', async ({}) => {
  test.setTimeout(240_000)
  const desktopRoot = path.resolve(__dirname, '..')
  const projectRoot = path.resolve(desktopRoot, '..')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'deepseek-harness-upgrade-'))
  const stalePackage = path.join(
    profile,
    'harness-home',
    'profiles',
    'node_modules',
    '@linxin666',
    'dsh-client-ui-market',
  )
  fs.mkdirSync(path.dirname(stalePackage), { recursive: true })
  fs.cpSync(
    path.join(projectRoot, 'node_modules', '@linxin666', 'dsh-client-ui-market'),
    stalePackage,
    { recursive: true, dereference: true },
  )
  fs.rmSync(path.join(stalePackage, 'node_modules'), { recursive: true, force: true })

  const electronApp = await launchHarness(desktopRoot, profile, {
    DEEPSEEK_HARNESS_RUNTIME_ROOT: projectRoot,
    DEEPSEEK_HARNESS_NODE_PATH: process.execPath,
    PATH: WINDOWS_SYSTEM_PATH,
  })

  let localPort
  try {
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
    await window.getByRole('button', { name: /本地运行/ }).click()
    await window.getByRole('button', { name: '启动本地服务' }).click()
    await window.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\//, { timeout: 180_000 })
    await expect(window.locator('#root')).not.toBeEmpty({ timeout: 15_000 })
    localPort = Number(new URL(window.url()).port)
    await expectMarketSettingsSection(window)
    expect(fs.existsSync(path.join(stalePackage, 'node_modules', 'schemastery', 'package.json'))).toBe(true)
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain("Cannot find package 'schemastery'")
  } finally {
    await electronApp.close()
  }

  await waitForPortClosed(localPort)
  fs.rmSync(profile, { recursive: true, force: true })
})

test('Harness desktop connects to the selected server workspace', async ({}, testInfo) => {
  const desktopRoot = path.resolve(__dirname, '..')
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<!doctype html><html><body><h1>Server workspace</h1></body></html>')
  })
  const port = await listen(server)
  const electronApp = await launchHarness(desktopRoot, testInfo.outputPath('server-profile'), {
    DEEPSEEK_HARNESS_REMOTE_ORIGIN: `http://127.0.0.1:${port}`,
  })

  try {
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
    await window.locator('#server').click()
    await window.getByRole('button', { name: '连接服务器端' }).click()
    await expect(window.getByRole('heading', { name: 'Server workspace' })).toBeVisible()
    expect(window.url()).toBe(`http://127.0.0.1:${port}/harness/`)
  } finally {
    await electronApp.close()
    await closeServer(server)
  }
})

test('Harness desktop replaces an empty workspace with a readable connection error', async ({}, testInfo) => {
  const desktopRoot = path.resolve(__dirname, '..')
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<!doctype html><html><body><div id="root"></div></body></html>')
  })
  const port = await listen(server)
  const electronApp = await launchHarness(desktopRoot, testInfo.outputPath('empty-profile'), {
    DEEPSEEK_HARNESS_REMOTE_ORIGIN: `http://127.0.0.1:${port}`,
  })

  try {
    const window = await electronApp.firstWindow()
    await window.locator('#server').click()
    await window.getByRole('button', { name: '连接服务器端' }).click()
    await expect(window.getByRole('alert')).toContainText('工作台页面加载完成但没有可显示的内容', { timeout: 15_000 })
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
  } finally {
    await electronApp.close()
    await closeServer(server)
  }
})

test('packaged Harness extracts and starts its embedded local runtime', async ({}) => {
  // The first packaged launch extracts the complete local runtime and profile
  // seed (about 1 GB compressed); allow slower disks while keeping the test
  // bounded and deterministic.
  test.setTimeout(360_000)
  const desktopRoot = path.resolve(__dirname, '..')
  const executablePath = path.join(desktopRoot, 'dist', 'win-unpacked', 'DeepSeek Harness.exe')
  // Keep the profile outside the repository so package resolution cannot
  // accidentally fall through to the development checkout's node_modules.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'deepseek-harness-packaged-'))
  const legacyRuntime = path.join(profile, 'local-runtime')
  const incompleteVersionedRuntime = path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION)
  fs.mkdirSync(path.join(legacyRuntime, 'partially-removed'), { recursive: true })
  fs.writeFileSync(path.join(legacyRuntime, 'partially-removed', 'residue.txt'), 'legacy residue')
  fs.mkdirSync(incompleteVersionedRuntime, { recursive: true })
  fs.writeFileSync(path.join(incompleteVersionedRuntime, 'residue.txt'), 'incomplete versioned runtime')
  const electronApp = await electron.launch({
    executablePath,
    cwd: path.dirname(executablePath),
    env: {
      ...process.env,
      DEEPSEEK_HARNESS_USER_DATA_DIR: profile,
      PATH: WINDOWS_SYSTEM_PATH,
    },
  })

  let localPort
  try {
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
    await window.getByRole('button', { name: /本地运行/ }).click()
    await window.getByRole('button', { name: '启动本地服务' }).click()
    await window.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\//, { timeout: 300_000 })
    await expect(window.locator('#root')).not.toBeEmpty({ timeout: 15_000 })
    localPort = Number(new URL(window.url()).port)
    expect(localPort).toBeGreaterThan(0)
    const market = await readMarketStatus(window)
    expect(market.status).toBe(200)
    expect(market.body.version).toBe('1.18.0')
    expect(market.body.pnpm).toBe(true)
    await expectMarketSettingsSection(window)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', 'model-router-galgame', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', 'dshmarket', 'lib', 'index.js'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', 'dshmarket', 'client', 'client.js'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', '@linxin666', 'dsh-web-ui-all', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', 'model-router-galgame', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', 'dshmarket', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', 'dshmarket', 'node_modules', 'js-yaml', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', '@linxin666', 'dsh-web-ui-all', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', '@linxin666', 'dsh-web-ui-all', 'node_modules', '@linxin666', 'dsh-client-ui-market', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', '@linxin666', 'dsh-web-ui-all', 'node_modules', '@linxin666', 'dsh-client-ui-skin-center', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', '@linxin666', 'dsh-client-ui-market', 'node_modules', 'schemastery', 'package.json'))).toBe(true)
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain('Cannot find package model-router-galgame')
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain('Cannot find package dshmarket')
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain("Cannot find package 'schemastery'")
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain('ENOTEMPTY')
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).toContain(`Activated local runtime ${HARNESS_RUNTIME_VERSION}`)
  } finally {
    await electronApp.close()
  }

  await waitForPortClosed(localPort)
  fs.rmSync(profile, { recursive: true, force: true })
})
