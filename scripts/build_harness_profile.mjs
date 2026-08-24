import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const updater = require('../desktop/harness-updater.js')
const webUiDesktop = require('../plugins/dsh-web-ui-adapter/desktop/runtime-integration.cjs')
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildRoot = path.join(projectRoot, 'build')
const seedRoot = path.join(buildRoot, 'harness-profile')

await fs.rm(seedRoot, { recursive: true, force: true })
await fs.mkdir(seedRoot, { recursive: true })

const pluginSource = updater.selectPluginSource(projectRoot, seedRoot, '0.5.1', '0.4.10')
const home = seedRoot
await updater.syncPluginToProfile(pluginSource, home)
await updater.syncRuntimePackageToProfile(projectRoot, home, 'dshmarket', '1.18.0')
const marketTarget = path.join(home, 'profiles', 'node_modules', 'dshmarket')
webUiDesktop.disableDuplicateClientFace(marketTarget)
for (const [name, version] of webUiDesktop.WEB_UI_PACKAGES) {
  await updater.syncRuntimePackageToProfile(projectRoot, home, name, version)
}
webUiDesktop.ensureProfileBundles(home)
await fs.writeFile(
  path.join(seedRoot, 'seed-version.json'),
  `${JSON.stringify({ runtime: '0.5.1', plugin: '0.4.10', market: '1.18.0', webUi: '0.2.9' }, null, 2)}\n`,
  'utf8',
)
console.log(`Harness profile seed: ${seedRoot}`)
