param(
    [string]$NodeExecutable = $env:DEEPSEEK_HARNESS_NODE_SOURCE
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$desktopRoot = Join-Path $projectRoot 'desktop'
$pluginRoot = Join-Path $projectRoot 'plugins\model-router-galgame'

& npm.cmd --prefix $pluginRoot run build:client
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to build the Model Router client bundle.'
}

& (Join-Path $PSScriptRoot 'build_harness_runtime.ps1') -NodeExecutable $NodeExecutable

# Electron and electron-builder are desktop-only dependencies.  Keep their
# installation scoped to desktop/ so the Harness workspace remains unchanged.
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
& npm.cmd --prefix $desktopRoot install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to install desktop packaging dependencies.'
}

# npm may skip Electron's postinstall script on CI.  Download the matching
# Electron runtime explicitly so electron-builder can package the application.
$electronInstall = Join-Path $desktopRoot 'node_modules\electron\install.js'
if (-not (Test-Path -LiteralPath (Join-Path $desktopRoot 'node_modules\electron\dist\electron.exe'))) {
    & node $electronInstall
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to download the Electron runtime.'
    }
}

& npm.cmd --prefix $desktopRoot run dist:harness:win
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to build the Windows installer.'
}

$installer = Get-ChildItem -LiteralPath (Join-Path $desktopRoot 'dist') -Filter '*.exe' -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if ($null -eq $installer) {
    throw 'The desktop build completed without producing an installer.'
}
Write-Host "Desktop installer: $($installer.FullName)"

$version = [string]((Get-Content -Raw (Join-Path $desktopRoot 'package.json') | ConvertFrom-Json).version)
& (Join-Path $PSScriptRoot 'build_update_assets.ps1') -Version $version
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to build updater release assets.'
}
