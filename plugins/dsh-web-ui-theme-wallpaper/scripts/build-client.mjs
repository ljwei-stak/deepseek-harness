import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = resolve(import.meta.dirname, '..')
const CHECKOUT = resolve(ROOT, '../..')
const ENTRY = '.dsh-plugin/client/index.mjs'
const OUTPUT = join(ROOT, '.dsh-plugin', 'client.js')
const PLUGIN_ID = 'dsh-web-ui-theme-wallpaper'

function resolveEsbuild() {
  const candidates = [
    join(CHECKOUT, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.exe' : 'esbuild'),
    join(CHECKOUT, 'node_modules', 'esbuild', 'bin', 'esbuild'),
  ]
  for (const candidate of candidates) {
    try { if (statSync(candidate).isFile()) return candidate } catch { /* continue */ }
  }
  return null
}

export function generate({ check = false } = {}) {
  const esbuild = resolveEsbuild()
  if (esbuild === null) return { ok: true, skipped: 'esbuild 不可用' }
  const temp = mkdtempSync(join(tmpdir(), 'dsh-web-ui-theme-wallpaper-'))
  const tempOut = join(temp, 'client.js')
  const result = spawnSync(esbuild, [
    ENTRY, '--bundle', '--format=cjs', '--platform=browser', '--target=es2020',
    '--external:react', '--outfile=' + tempOut,
  ], { cwd: ROOT, stdio: 'inherit' })
  if (result.status !== 0) return { ok: false, errors: ['esbuild 失败（exit ' + String(result.status) + '）'] }
  const body = readFileSync(tempOut, 'utf8').replace(/\n$/, '')
  const code = Buffer.from(
    'window.__ModuleLoader__.load({\n'
    + '\tid: ' + JSON.stringify(PLUGIN_ID) + ',\n'
    + '\tfactory: (require) => {\n'
    + '\t\tvar module = { exports: {} };\n'
    + '\t\tvar exports = module.exports;\n'
    + body + '\n'
    + '\t\treturn module.exports;\n'
    + '\t}\n'
    + '});\n',
  )
  if (!check) {
    writeFileSync(OUTPUT, code)
    return { ok: true }
  }
  let committed
  try { committed = readFileSync(OUTPUT) } catch { return { ok: false, errors: ['client.js 不存在'] } }
  return Buffer.compare(committed, code) === 0
    ? { ok: true }
    : { ok: false, errors: ['client.js 与源码不一致'] }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = generate({ check: process.argv.includes('--check') })
  if (result.skipped) console.log('[build-client] SKIP：' + result.skipped)
  if (!result.ok) {
    for (const error of result.errors ?? []) console.error('[build-client] ' + error)
    process.exit(1)
  } else if (!result.skipped) {
    console.log(process.argv.includes('--check') ? '[build-client] OK' : '[build-client] client.js 已生成')
  }
}
