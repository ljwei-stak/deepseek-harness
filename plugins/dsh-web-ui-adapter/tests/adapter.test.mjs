import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const adapterRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(adapterRoot, '..', '..')
const lock = JSON.parse(readFileSync(join(adapterRoot, 'upstream-lock.json'), 'utf8'))
const rootPackage = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'))

test('pins the complete dsh-web-ui aggregate from the selected fork', () => {
  assert.equal(lock.schema, 'deepseek-harness/dsh-web-ui-adapter/v1')
  assert.equal(lock.upstream, 'https://github.com/ljwei-stak/dsh-web-ui')
  assert.match(lock.commit, /^[0-9a-f]{40}$/)
  assert.equal(lock.packages.length, 18)
  assert.ok(lock.packages.some((entry) => entry.name === '@linxin666/dsh-web-ui-all'))
  assert.ok(lock.packages.some((entry) => entry.name === '@linxin666/dsh-client-ui-skin-center'))
  assert.ok(lock.packages.some((entry) => entry.name === '@linxin666/dsh-tool-describe-image'))
})

test('ships verified archives and references every package from the root install', () => {
  for (const entry of lock.packages) {
    const filename = join(adapterRoot, entry.archive)
    assert.equal(existsSync(filename), true, `${entry.archive} is missing`)
    const digest = createHash('sha256').update(readFileSync(filename)).digest('hex')
    assert.equal(digest, entry.sha256, `${entry.archive} checksum differs`)
    assert.equal(rootPackage.dependencies[entry.name], `file:plugins/dsh-web-ui-adapter/${entry.archive}`)
  }
  for (const [name, version] of Object.entries(lock.externalPackages)) {
    assert.equal(rootPackage.dependencies[name], version)
  }
})

test('keeps the desktop bundle integration in its isolated adapter directory', () => {
  const adapter = readFileSync(join(adapterRoot, 'desktop', 'runtime-integration.cjs'), 'utf8')
  assert.match(adapter, /@linxin666\/dsh-web-ui-all/)
  assert.match(adapter, /ensureProfileBundles/)
  const builder = readFileSync(join(repositoryRoot, 'desktop', 'harness-builder.yml'), 'utf8')
  assert.match(builder, /dsh-web-ui-adapter\/desktop\/runtime-integration\.cjs/)
})
