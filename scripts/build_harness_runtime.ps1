param(
    [string]$NodeExecutable = $env:DEEPSEEK_HARNESS_NODE_SOURCE
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $projectRoot 'build'
$archivePath = Join-Path $buildRoot 'harness-runtime.tar.gz'
$nodeTargetDirectory = Join-Path $buildRoot 'harness-node'
$nodeTarget = Join-Path $nodeTargetDirectory 'node.exe'
$toolsTargetDirectory = Join-Path $buildRoot 'harness-tools'
$pnpmSource = Join-Path $projectRoot 'node_modules\pnpm'
$pnpmTarget = Join-Path $toolsTargetDirectory 'pnpm'
$pnpmLauncher = Join-Path $toolsTargetDirectory 'pnpm.cmd'
$pluginSource = Join-Path $projectRoot 'plugins\model-router-galgame'
$pluginRuntime = Join-Path $projectRoot 'node_modules\model-router-galgame'
$nodeModulesRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules'))
$pluginRuntimeFull = [IO.Path]::GetFullPath($pluginRuntime)

function Require-Path([string]$Path, [string]$Description) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing ${Description}: $Path"
    }
}

Require-Path (Join-Path $projectRoot 'apps\cli\lib\bin.js') 'built Harness CLI'
Require-Path (Join-Path $projectRoot 'apps\web\dist\index.html') 'built Web frontend'
Require-Path (Join-Path $pluginSource 'package.json') 'Model Router plugin source'
Require-Path (Join-Path $projectRoot 'node_modules\dshmarket\lib\index.js') 'dshmarket Host bundle'
Require-Path (Join-Path $projectRoot 'node_modules\dshmarket\client\client.js') 'dshmarket Web bundle'
Require-Path (Join-Path $pnpmSource 'bin\pnpm.cjs') 'packaged pnpm runtime'

# Keep a real directory in the runtime's top-level node_modules.  The profile
# is created under DSH_HOME at first launch, so the desktop shell mirrors this
# package there before booting the loader.
if (-not $pluginRuntimeFull.StartsWith("$nodeModulesRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to replace a plugin runtime outside node_modules: $pluginRuntimeFull"
}
if (Test-Path -LiteralPath $pluginRuntimeFull) {
    Remove-Item -LiteralPath $pluginRuntimeFull -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $pluginRuntimeFull | Out-Null
Get-ChildItem -LiteralPath $pluginSource -Force | Copy-Item -Destination $pluginRuntimeFull -Recurse -Force
Require-Path (Join-Path $pluginRuntime 'package.json') 'runtime Model Router plugin'

if (-not $NodeExecutable) {
    $NodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
}
Require-Path $NodeExecutable 'Node executable'
New-Item -ItemType Directory -Force -Path $buildRoot, $nodeTargetDirectory | Out-Null
Copy-Item -LiteralPath $NodeExecutable -Destination $nodeTarget -Force

# The Electron runtime intentionally ships only node.exe. Package a portable
# pnpm launcher beside it so the market can install profile plugins on a clean
# Windows machine without relying on npm, corepack, or the user's PATH.
if (Test-Path -LiteralPath $toolsTargetDirectory) {
    Remove-Item -LiteralPath $toolsTargetDirectory -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $pnpmTarget | Out-Null
Get-ChildItem -LiteralPath $pnpmSource -Force | Copy-Item -Destination $pnpmTarget -Recurse -Force
$launcherText = @'
@ECHO OFF
"%~dp0..\harness-node\node.exe" "%~dp0pnpm\bin\pnpm.cjs" %*
'@
[IO.File]::WriteAllText($pnpmLauncher, $launcherText, [Text.Encoding]::ASCII)
Require-Path $pnpmLauncher 'portable pnpm launcher'

if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}

Write-Host 'Creating the local Harness runtime archive ...'
$tarArguments = @(
    '-czf', $archivePath,
    '--exclude=.git',
    '--exclude=.agents',
    '--exclude=.claude',
    '--exclude=desktop',
    '--exclude=docs',
    '--exclude=website',
    '--exclude=examples',
    '--exclude=**/node_modules/.cache',
    '--exclude=**/*.tsbuildinfo',
    '-C', $projectRoot,
    'apps',
    'packages',
    'vendor',
    'native',
    'node_modules',
    'package.json',
    'pnpm-workspace.yaml'
)
& tar.exe @tarArguments
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create the runtime archive (tar exit code $LASTEXITCODE)."
}

$archive = Get-Item -LiteralPath $archivePath
if ($archive.Length -lt 100MB) {
    throw "The runtime archive is unexpectedly small: $($archive.Length) bytes."
}

Write-Host "Runtime archive: $archivePath ($([math]::Round($archive.Length / 1MB, 1)) MB)"
Write-Host "Bundled Node: $nodeTarget"
Write-Host "Bundled pnpm: $pnpmLauncher"
