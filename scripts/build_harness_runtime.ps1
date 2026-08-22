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
$marketSource = Join-Path $projectRoot 'plugins\dsh-market'
$nodeModulesRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules'))
$runtimePackages = @(
    @{
        Description = 'Model Router plugin'
        Source = Join-Path $projectRoot 'plugins\model-router-galgame'
        Runtime = Join-Path $projectRoot 'node_modules\model-router-galgame'
        Required = @('package.json', '.dsh-plugin\index.mjs', '.dsh-plugin\client.js')
    }
)

function Require-Path([string]$Path, [string]$Description) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing ${Description}: $Path"
    }
}

Require-Path (Join-Path $projectRoot 'apps\cli\lib\bin.js') 'built Harness CLI'
Require-Path (Join-Path $projectRoot 'apps\web\dist\index.html') 'built Web frontend'
Require-Path (Join-Path $marketSource 'package.json') 'independent plugin market source'
Require-Path (Join-Path $projectRoot 'node_modules\dshmarket\lib\index.js') 'installed dshmarket Host bundle'
Require-Path (Join-Path $projectRoot 'node_modules\dshmarket\client\client.js') 'installed dshmarket Web bundle'
Require-Path (Join-Path $pnpmSource 'bin\pnpm.cjs') 'packaged pnpm runtime'

# Model Router is a repository-only package, so materialize it as a real
# directory. dshmarket stays in pnpm's installed dependency closure so its
# production dependencies remain resolvable after runtime extraction.
foreach ($package in $runtimePackages) {
    $runtimeFull = [IO.Path]::GetFullPath($package.Runtime)
    if (-not $runtimeFull.StartsWith("$nodeModulesRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to replace a runtime package outside node_modules: $runtimeFull"
    }
    foreach ($relativePath in $package.Required) {
        Require-Path (Join-Path $package.Source $relativePath) "$($package.Description) source file"
    }
    if (Test-Path -LiteralPath $runtimeFull) {
        Remove-Item -LiteralPath $runtimeFull -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $runtimeFull | Out-Null
    Get-ChildItem -LiteralPath $package.Source -Force | Copy-Item -Destination $runtimeFull -Recurse -Force
    foreach ($relativePath in $package.Required) {
        Require-Path (Join-Path $runtimeFull $relativePath) "$($package.Description) runtime file"
    }
}

if (-not $NodeExecutable) {
    $NodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
}
Require-Path $NodeExecutable 'Node executable'
New-Item -ItemType Directory -Force -Path $buildRoot, $nodeTargetDirectory | Out-Null
Copy-Item -LiteralPath $NodeExecutable -Destination $nodeTarget -Force

# Package pnpm beside the embedded Node executable so market operations work
# on a clean Windows host without npm, Corepack, or a system pnpm installation.
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
