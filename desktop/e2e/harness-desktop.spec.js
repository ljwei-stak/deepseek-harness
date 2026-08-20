const http = require('node:http')
const fs = require('node:fs')
const net = require('node:net')
const path = require('node:path')
const { _electron: electron, expect, test } = require('@playwright/test')

const HARNESS_RUNTIME_VERSION = '0.4.7'

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

test('Harness desktop starts the bundled local runtime with one choice', async ({}, testInfo) => {
  const desktopRoot = path.resolve(__dirname, '..')
  const projectRoot = path.resolve(desktopRoot, '..')
  const profile = testInfo.outputPath('local-profile')
  const electronApp = await launchHarness(desktopRoot, profile, {
    DEEPSEEK_HARNESS_RUNTIME_ROOT: projectRoot,
    DEEPSEEK_HARNESS_NODE_PATH: process.execPath,
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
  } finally {
    await electronApp.close()
  }

  await waitForPortClosed(localPort)
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

test('packaged Harness extracts and starts its embedded local runtime', async ({}, testInfo) => {
  test.setTimeout(180_000)
  const desktopRoot = path.resolve(__dirname, '..')
  const executablePath = path.join(desktopRoot, 'dist', 'win-unpacked', 'DeepSeek Harness.exe')
  const profile = testInfo.outputPath('packaged-profile')
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
    },
  })

  let localPort
  try {
    const window = await electronApp.firstWindow()
    await expect(window.getByRole('heading', { name: '选择运行方式' })).toBeVisible()
    await window.getByRole('button', { name: /本地运行/ }).click()
    await window.getByRole('button', { name: '启动本地服务' }).click()
    await window.waitForURL(/^http:\/\/127\.0\.0\.1:\d+\//, { timeout: 150_000 })
    await expect(window.locator('#root')).not.toBeEmpty({ timeout: 15_000 })
    localPort = Number(new URL(window.url()).port)
    expect(localPort).toBeGreaterThan(0)
    expect(fs.existsSync(path.join(profile, 'local-runtimes', HARNESS_RUNTIME_VERSION, 'node_modules', 'model-router-galgame', 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(profile, 'harness-home', 'profiles', 'node_modules', 'model-router-galgame', 'package.json'))).toBe(true)
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain('Cannot find package model-router-galgame')
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).not.toContain('ENOTEMPTY')
    expect(fs.readFileSync(path.join(profile, 'client.log'), 'utf8')).toContain(`Activated local runtime ${HARNESS_RUNTIME_VERSION}`)
  } finally {
    await electronApp.close()
  }

  await waitForPortClosed(localPort)
})
