#!/usr/bin/env bash
set -euo pipefail

project_root="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
desktop_root="$project_root/desktop"
plugin_root="$project_root/plugins/model-router-galgame"
version=$(node -p "require('$desktop_root/package.json').version")
deb="$desktop_root/dist/DeepSeek-Harness-ModelRouter-GALGame-$version-Linux-amd64.deb"
rpm="$desktop_root/dist/DeepSeek-Harness-ModelRouter-GALGame-$version-Linux-x86_64.rpm"

npm --prefix "$plugin_root" run build:client
bash "$project_root/scripts/build_harness_runtime_linux.sh"

# Electron packaging dependencies stay scoped to desktop/.
npm --prefix "$desktop_root" ci --no-audit --no-fund
if [[ ! -x "$desktop_root/node_modules/electron/dist/electron" ]]; then
  node "$desktop_root/node_modules/electron/install.js"
fi
npm --prefix "$desktop_root" run dist:harness:linux

for package in "$deb" "$rpm"; do
  if [[ ! -f "$package" ]]; then
    echo "The desktop build did not produce $package." >&2
    exit 1
  fi
done

sha256sum "$deb" "$rpm" > "$desktop_root/dist/SHA256SUMS-Linux.txt"
echo "Debian package: $deb"
echo "RPM package: $rpm"
cat "$desktop_root/dist/SHA256SUMS-Linux.txt"
