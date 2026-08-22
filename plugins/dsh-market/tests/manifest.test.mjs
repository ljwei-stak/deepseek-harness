import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

test('ships an independent loadable dsh-market bundle', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  const host = await readFile(new URL('../lib/index.js', import.meta.url), 'utf8')
  const client = await readFile(new URL('../client/client.js', import.meta.url))

  assert.equal(manifest.name, 'dshmarket')
  assert.equal(manifest.version, '1.18.0')
  assert.equal(manifest.deepseekHarnessAdapter.upstreamVersion, manifest.version)
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.match(patch, /id:\s*dsh-market/)
  assert.match(patch, /name:\s*['"]?dshmarket/)
  assert.match(host, /export const name = ['"]dsh-market['"];/)
  assert.match(host, /export function apply\(ctx, config\)/)
  assert.ok(client.byteLength > 100_000)
  assert.ok(root.endsWith('dsh-market\\') || root.endsWith('dsh-market/'))
})
