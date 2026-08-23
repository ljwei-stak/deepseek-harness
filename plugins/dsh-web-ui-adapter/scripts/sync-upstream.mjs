import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const adapterRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = resolve(adapterRoot, '..', '..')
const vendorRoot = join(adapterRoot, 'vendor')
const packagePaths = [
  'packages/dsh-web-ui-all',
  'packages/dsh-web-ui-settings',
  'packages/dsh-plugin-manager',
  'packages/dsh-community-plugins',
  'packages/dsh-market',
  'packages/dsh-aionui-panel',
  'packages/dsh-task-board',
  'packages/dsh-git-graph',
  'packages/dsh-remote-web-ui',
  'packages/dsh-pet',
  'packages/dsh-ssh',
  'packages/dsh-tool-describe-image',
  'packages/dsh-chat-recovery',
  'packages/dsh-liangshen',
  'packages/dsh-skill-explorer',
  'packages/dsh-desktop-launcher',
  'packages/dsh-doctor',
  'packages/skins/skin-center',
]

function argument(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

function archiveName(name, version) {
  return `${name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`
}

function sha256(filename) {
  return createHash('sha256').update(readFileSync(filename)).digest('hex')
}

const defaultSource = resolve(repositoryRoot, '..', 'dsh-web-ui')
const sourceRoot = resolve(argument('--source') ?? process.env.DSH_WEB_UI_SOURCE ?? defaultSource)
const pnpmCli = join(repositoryRoot, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')
if (!existsSync(join(sourceRoot, 'packages', 'dsh-web-ui-all', 'package.json'))) {
  throw new Error(`dsh-web-ui source checkout not found: ${sourceRoot}`)
}
if (!existsSync(pnpmCli)) throw new Error(`Run pnpm install in the Harness repository first: ${pnpmCli}`)

function runPnpm(args, cwd) {
  return run(process.execPath, [pnpmCli, ...args], cwd)
}

const remote = run('git', ['remote', 'get-url', 'origin'], sourceRoot)
if (!/^https:\/\/github\.com\/ljwei-stak\/dsh-web-ui(?:\.git)?$/i.test(remote)) {
  throw new Error(`Expected the ljwei-stak/dsh-web-ui fork, received: ${remote}`)
}
const commit = run('git', ['rev-parse', 'HEAD'], sourceRoot)
const branch = run('git', ['branch', '--show-current'], sourceRoot)
const dirty = run('git', ['status', '--porcelain'], sourceRoot)
if (dirty !== '') throw new Error('Refusing to package a dirty dsh-web-ui checkout.')

if (!process.argv.includes('--skip-checks')) {
  runPnpm(['typecheck'], sourceRoot)
  runPnpm(['aggregate:check'], sourceRoot)
}
runPnpm(['build'], sourceRoot)

mkdirSync(vendorRoot, { recursive: true })
for (const entry of readdirSync(vendorRoot)) {
  if (entry.endsWith('.tgz')) rmSync(join(vendorRoot, entry))
}

const packages = []
for (const packagePath of packagePaths) {
  const directory = join(sourceRoot, packagePath)
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
  const filename = archiveName(manifest.name, manifest.version)
  runPnpm(['pack', '--pack-destination', vendorRoot], directory)
  const archive = join(vendorRoot, filename)
  if (!existsSync(archive)) throw new Error(`pnpm pack did not create ${filename}`)
  packages.push({
    name: manifest.name,
    version: manifest.version,
    source: packagePath.replaceAll('\\', '/'),
    archive: `vendor/${filename}`,
    bytes: statSync(archive).size,
    sha256: sha256(archive),
  })
}

const lock = {
  schema: 'deepseek-harness/dsh-web-ui-adapter/v1',
  upstream: 'https://github.com/ljwei-stak/dsh-web-ui',
  branch,
  commit,
  packages,
  externalPackages: {
    '@mlgbnb/dsh-archive-manager': '1.0.7',
    'dsh-better-sidebar': '0.15.2',
  },
}
writeFileSync(join(adapterRoot, 'upstream-lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
console.log(`Packed ${packages.length} dsh-web-ui packages from ${commit}.`)
console.log(`Adapter: ${relative(repositoryRoot, adapterRoot)}`)
