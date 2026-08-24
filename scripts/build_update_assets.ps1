[CmdletBinding()]
param(
    [string]$Version,
    [int]$PartSizeMiB = 50,
    [switch]$SplitInstaller
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pluginRoot = Join-Path $projectRoot 'plugins\model-router-galgame'
$desktopRoot = Join-Path $projectRoot 'desktop'
$pluginPackage = Get-Content -Raw (Join-Path $pluginRoot 'package.json') | ConvertFrom-Json
$desktopPackage = Get-Content -Raw (Join-Path $desktopRoot 'package.json') | ConvertFrom-Json

if (-not $Version) { $Version = [string]$desktopPackage.version }
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw "Version must use x.y.z format: $Version" }
if ([string]$desktopPackage.version -ne $Version) { throw "Desktop package version is $($desktopPackage.version), expected $Version." }
if ($SplitInstaller -and $PartSizeMiB -lt 5) { throw 'PartSizeMiB must be at least 5.' }

$pluginVersion = [string]$pluginPackage.version
$installerName = "DeepSeek-Harness-ModelRouter-GALGame-Setup-$Version-Windows-x64.exe"
$installer = Join-Path (Join-Path $desktopRoot 'dist') $installerName
$blockmap = "$installer.blockmap"
$pluginArchiveName = "Model-Router-GALGame-Plugin-$pluginVersion.tar.gz"
$manifestName = 'model-router-galgame-update.json'
$outputRoot = Join-Path (Join-Path $projectRoot 'build\release') $Version

foreach ($required in @(
    (Join-Path $pluginRoot '.dsh-plugin\client.js'),
    (Join-Path $pluginRoot '.dsh-plugin\index.mjs'),
    $installer,
    $blockmap
)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Missing release input: $required" }
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$pluginArchive = Join-Path $outputRoot $pluginArchiveName
if (Test-Path -LiteralPath $pluginArchive) { Remove-Item -LiteralPath $pluginArchive -Force }

Write-Host "Creating plugin archive $pluginArchiveName ..."
& tar.exe -czf $pluginArchive -C $pluginRoot .
if ($LASTEXITCODE -ne 0) { throw "Failed to create plugin archive (tar exit code $LASTEXITCODE)." }

$partPattern = "$installerName.part*"
Get-ChildItem -LiteralPath $outputRoot -Filter $partPattern -File | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Force
}

$partSize = $PartSizeMiB * 1MB
$buffer = New-Object byte[] (1MB)
$partNames = [System.Collections.Generic.List[string]]::new()
if ($SplitInstaller) {
    Write-Host "Splitting installer into $PartSizeMiB MiB parts ..."
    $inputStream = [IO.File]::OpenRead($installer)
    try {
        $partIndex = 1
        while ($inputStream.Position -lt $inputStream.Length) {
            $partName = '{0}.part{1:D2}' -f $installerName, $partIndex
            $partPath = Join-Path $outputRoot $partName
            $partStream = [IO.File]::Create($partPath)
            try {
                $written = 0L
                while ($written -lt $partSize -and $inputStream.Position -lt $inputStream.Length) {
                    $remaining = [Math]::Min($buffer.Length, $partSize - $written)
                    $read = $inputStream.Read($buffer, 0, [int]$remaining)
                    if ($read -le 0) { break }
                    $partStream.Write($buffer, 0, $read)
                    $written += $read
                }
            } finally {
                $partStream.Dispose()
            }
            $partNames.Add($partName)
            $partIndex += 1
        }
    } finally {
        $inputStream.Dispose()
    }
}

Copy-Item -LiteralPath $blockmap -Destination (Join-Path $outputRoot ([IO.Path]::GetFileName($blockmap))) -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'download_desktop_release.ps1') -Destination (Join-Path $outputRoot 'download_desktop_release.ps1') -Force

$installerHash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
$pluginHash = (Get-FileHash -LiteralPath $pluginArchive -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
    schemaVersion = 1
    releaseVersion = $Version
    plugin = [ordered]@{
        version = $pluginVersion
        asset = $pluginArchiveName
        sha256 = $pluginHash
        minDesktopVersion = [string]$pluginPackage.dshUpdater.minDesktopVersion
        minRuntimeVersion = [string]$pluginPackage.dshUpdater.minRuntimeVersion
    }
    desktop = [ordered]@{
        version = $Version
        installer = $installerName
        parts = @($partNames)
        sha256 = $installerHash
    }
}
$manifestJson = $manifest | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path $outputRoot $manifestName), "$manifestJson`n", [Text.UTF8Encoding]::new($false))

$checksumLines = [System.Collections.Generic.List[string]]::new()
$checksumLines.Add("$installerHash *$installerName")
$checksumLines.Add("$pluginHash *$pluginArchiveName")
foreach ($name in $partNames) {
    $hash = (Get-FileHash -LiteralPath (Join-Path $outputRoot $name) -Algorithm SHA256).Hash.ToLowerInvariant()
    $checksumLines.Add("$hash *$name")
}
foreach ($name in @([IO.Path]::GetFileName($blockmap), 'download_desktop_release.ps1', $manifestName)) {
    $hash = (Get-FileHash -LiteralPath (Join-Path $outputRoot $name) -Algorithm SHA256).Hash.ToLowerInvariant()
    $checksumLines.Add("$hash *$name")
}
$checksumLines | Set-Content -LiteralPath (Join-Path $outputRoot 'SHA256SUMS.txt') -Encoding ascii

Write-Host "Update assets: $outputRoot"
Write-Host "Plugin SHA256: $pluginHash"
Write-Host "Installer SHA256: $installerHash"
Write-Host "Installer parts: $($partNames.Count) (complete installer: $installerName)"
