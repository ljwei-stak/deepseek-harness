[CmdletBinding()]
param(
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads'),
  [string]$Version = '0.4.13',
  [switch]$RunInstaller
)

$ErrorActionPreference = 'Stop'
$tag = "model-router-galgame-$Version"
$baseUrl = "https://github.com/ljwei-stak/deepseek-harness/releases/download/$tag"
$manifestName = 'model-router-galgame-update.json'
$manifestTemp = Join-Path ([IO.Path]::GetTempPath()) ("deepseek-harness-update-{0}-{1}.json" -f $Version, [guid]::NewGuid().ToString('N'))

function Download-File([string]$Url, [string]$Path) {
  $curlArgs = @('--fail', '--location', '--retry', '3', '--retry-delay', '3', '--connect-timeout', '30', '--output', $Path)
  & curl.exe @curlArgs $Url
  if ($LASTEXITCODE -ne 0 -and ($env:HTTP_PROXY -or $env:HTTPS_PROXY)) {
    Write-Host 'Proxy download failed; retrying without a proxy ...'
    & curl.exe --proxy "" @curlArgs $Url
  }
  if ($LASTEXITCODE -ne 0) { throw "Failed to download $Url." }
}

try {
  Download-File "$baseUrl/$manifestName" $manifestTemp
  $manifest = Get-Content -Raw -LiteralPath $manifestTemp | ConvertFrom-Json
} finally {
  Remove-Item -LiteralPath $manifestTemp -Force -ErrorAction SilentlyContinue
}
if ([string]$manifest.releaseVersion -ne $Version) { throw 'Release manifest version does not match the requested version.' }
$exeName = [string]$manifest.desktop.installer
$expectedHash = ([string]$manifest.desktop.sha256).ToUpperInvariant()
if ($exeName -notmatch '^[0-9A-Za-z][0-9A-Za-z._-]+\.exe$') { throw "Unsafe installer name in release manifest: $exeName" }
if ($expectedHash -notmatch '^[0-9A-F]{64}$') { throw 'Release manifest contains an invalid installer SHA256.' }
$parts = @($manifest.desktop.parts)
if ($parts.Count -eq 0) { throw 'Release manifest does not contain installer parts.' }
$staging = Join-Path $Destination ".deepseek-harness-model-router-$Version-parts"
$output = Join-Path $Destination $exeName
$destinationFull = [IO.Path]::GetFullPath($Destination).TrimEnd([IO.Path]::DirectorySeparatorChar)
$stagingFull = [IO.Path]::GetFullPath($staging)
if ([IO.Path]::GetDirectoryName($stagingFull) -ne $destinationFull) { throw 'Refusing to use a staging directory outside the download destination.' }

New-Item -ItemType Directory -Force -Path $Destination,$staging | Out-Null
foreach ($partNameValue in $parts) {
  $partName = [string]$partNameValue
  if ($partName -notmatch '^[0-9A-Za-z][0-9A-Za-z._-]+$') { throw "Unsafe part name in release manifest: $partName" }
  $partPath = Join-Path $staging $partName
  $partUrl = "$baseUrl/$partName"
  if (-not (Test-Path -LiteralPath $partPath)) {
    Write-Host "Downloading $partName ..."
    Download-File $partUrl $partPath
  }
}

Write-Host "Combining installer ..."
$inputStreams = @()
$outputStream = [IO.File]::Create($output)
try {
  foreach ($partNameValue in $parts) {
    $partName = [string]$partNameValue
    $stream = [IO.File]::OpenRead((Join-Path $staging $partName))
    $inputStreams += $stream
    $stream.CopyTo($outputStream)
  }
} finally {
  foreach ($stream in $inputStreams) { $stream.Dispose() }
  $outputStream.Dispose()
}

$actualHash = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToUpperInvariant()
if ($actualHash -ne $expectedHash) {
  Remove-Item -LiteralPath $output -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $stagingFull -Recurse -Force -ErrorAction SilentlyContinue
  throw "SHA256 mismatch. Expected $expectedHash, got $actualHash."
}
Remove-Item -LiteralPath $stagingFull -Recurse -Force
Write-Host "Installer ready: $output"
Write-Host "SHA256: $actualHash"
if ($RunInstaller) { Start-Process -FilePath $output }
