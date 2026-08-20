param(
    [string]$NodeExecutable = $env:DEEPSEEK_HARNESS_NODE_SOURCE
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $projectRoot 'build'
$archivePath = Join-Path $buildRoot 'harness-runtime.tar.gz'
$nodeTargetDirectory = Join-Path $buildRoot 'harness-node'
$nodeTarget = Join-Path $nodeTargetDirectory 'node.exe'
$pluginSource = Join-Path $projectRoot 'plugins\model-router-galgame'
$pluginRuntime = Join-Path $projectRoot 'node_modules\model-router-galgame'

function Require-Path([string]$Path, [string]$Description) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing ${Description}: $Path"
    }
}

Require-Path (Join-Path $projectRoot 'apps\cli\lib\bin.js') 'built Harness CLI'
Require-Path (Join-Path $projectRoot 'apps\web\dist\index.html') 'built Web frontend'
Require-Path (Join-Path $pluginSource 'package.json') 'Model Router plugin source'

# Keep a real directory in the runtime's top-level node_modules.  The profile
# is created under DSH_HOME at first launch, so the desktop shell mirrors this
# package there before booting the loader.
New-Item -ItemType Directory -Force -Path $pluginRuntime | Out-Null
Get-ChildItem -LiteralPath $pluginSource -Force | Copy-Item -Destination $pluginRuntime -Recurse -Force
Require-Path (Join-Path $pluginRuntime 'package.json') 'runtime Model Router plugin'

if (-not $NodeExecutable) {
    $NodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
}
Require-Path $NodeExecutable 'Node executable'
New-Item -ItemType Directory -Force -Path $buildRoot, $nodeTargetDirectory | Out-Null
Copy-Item -LiteralPath $NodeExecutable -Destination $nodeTarget -Force

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
