# Build: bump patch version, compile, package VSIX, install locally.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# bump patch version in package.json (UTF-8 without BOM, no mojibake)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$pkgPath = Join-Path $PSScriptRoot "package.json"
$raw = [System.IO.File]::ReadAllText($pkgPath, $utf8NoBom)
$pkg = $raw | ConvertFrom-Json
$parts = $pkg.version.Split(".")
$parts[2] = [string]([int]$parts[2] + 1)
$newVersion = $parts -join "."
$raw = $raw -replace ('"version": "' + [regex]::Escape($pkg.version) + '"'), ('"version": "' + $newVersion + '"')
[System.IO.File]::WriteAllText($pkgPath, $raw, $utf8NoBom)

Write-Host "=== Nheengeta build v$newVersion ==="

npm run compile
if ($LASTEXITCODE -ne 0) { throw "compile failed" }

npx --yes @vscode/vsce package --allow-missing-repository
if ($LASTEXITCODE -ne 0) { throw "vsce package failed" }

code --install-extension ".\nheengeta-$newVersion.vsix"
if ($LASTEXITCODE -ne 0) { throw "install failed" }

# keep only the newest vsix
Get-ChildItem *.vsix | Where-Object { $_.Name -ne "nheengeta-$newVersion.vsix" } | Remove-Item

Write-Host ""
Write-Host "Installed nheengeta v$newVersion - reload the VS Code window (Developer: Reload Window)."
