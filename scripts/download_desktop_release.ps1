[CmdletBinding()]
param(
  [string]$Destination = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads'),
  [switch]$RunInstaller
)

$ErrorActionPreference = 'Stop'
$tag = 'model-router-galgame-0.4.7'
$baseUrl = "https://github.com/ljwei-stak/deepseek-harness/releases/download/$tag"
$exeName = 'DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.7-Windows-x64.exe'
$expectedHash = '75DCF3D4B4D21CB01F89672C0E275017160E37B4F8A186E5742BB40D8937C264'
$partCount = 12
$staging = Join-Path $Destination '.deepseek-harness-model-router-0.4.7-parts'
$output = Join-Path $Destination $exeName

New-Item -ItemType Directory -Force -Path $Destination,$staging | Out-Null
for ($index = 1; $index -le $partCount; $index++) {
  $partName = '{0}.part{1:D2}' -f $exeName, $index
  $partPath = Join-Path $staging $partName
  $partUrl = "$baseUrl/$partName"
  if (-not (Test-Path -LiteralPath $partPath)) {
    Write-Host "Downloading $partName ..."
    $curlArgs = @('--fail', '--location', '--retry', '3', '--retry-delay', '3', '--connect-timeout', '30', '--output', $partPath)
    & curl.exe @curlArgs $partUrl
    if ($LASTEXITCODE -ne 0 -and ($env:HTTP_PROXY -or $env:HTTPS_PROXY)) {
      Write-Host 'Proxy download failed; retrying without a proxy ...'
      & curl.exe --proxy "" @curlArgs $partUrl
    }
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $partName." }
  }
}

Write-Host "Combining installer ..."
$inputStreams = @()
$outputStream = [IO.File]::Create($output)
try {
  for ($index = 1; $index -le $partCount; $index++) {
    $partName = '{0}.part{1:D2}' -f $exeName, $index
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
  throw "SHA256 mismatch. Expected $expectedHash, got $actualHash."
}
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Host "Installer ready: $output"
Write-Host "SHA256: $actualHash"
if ($RunInstaller) { Start-Process -FilePath $output }
