#!/usr/bin/env bash
set -euo pipefail

project_root="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
build_root="$project_root/build"
archive_path="$build_root/harness-runtime.tar.gz"
node_target_directory="$build_root/harness-node"
node_target="$node_target_directory/node"
tools_target_directory="$build_root/harness-tools"
pnpm_source="$project_root/node_modules/pnpm"
pnpm_target="$tools_target_directory/pnpm-package"
pnpm_launcher="$tools_target_directory/pnpm"
market_source="$project_root/plugins/dsh-market"
router_source="$project_root/plugins/model-router-galgame"
router_runtime="$project_root/node_modules/model-router-galgame"

require_file() {
  local filename="$1"
  local description="$2"
  if [[ ! -f "$filename" ]]; then
    echo "Missing $description: $filename" >&2
    exit 1
  fi
}

require_file "$project_root/apps/cli/lib/bin.js" "built Harness CLI"
require_file "$project_root/apps/web/dist/index.html" "built Web frontend"
require_file "$market_source/package.json" "independent plugin market source"
require_file "$project_root/node_modules/dshmarket/lib/index.js" "installed dshmarket Host bundle"
require_file "$project_root/node_modules/dshmarket/client/client.js" "installed dshmarket Web bundle"
require_file "$pnpm_source/bin/pnpm.cjs" "packaged pnpm runtime"

for relative_path in package.json .dsh-plugin/index.mjs .dsh-plugin/client.js; do
  require_file "$router_source/$relative_path" "Model Router source file"
done

# Model Router is repository-only. Materialize it under node_modules while
# leaving dshmarket in pnpm's installed dependency closure.
rm -rf -- "$router_runtime"
mkdir -p -- "$router_runtime"
cp -a -- "$router_source/." "$router_runtime/"

node_source="${DEEPSEEK_HARNESS_NODE_SOURCE:-}"
if [[ -z "$node_source" ]]; then
  node_source="$(command -v node)"
fi
require_file "$node_source" "Node executable"
mkdir -p -- "$build_root" "$node_target_directory"
install -m 755 -- "$node_source" "$node_target"

# Package pnpm beside the embedded Node executable so market operations work
# without npm, Corepack, or a system pnpm installation.
rm -rf -- "$tools_target_directory"
mkdir -p -- "$pnpm_target"
cp -a -- "$pnpm_source/." "$pnpm_target/"
cat > "$pnpm_launcher" <<'LAUNCHER'
#!/bin/sh
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$script_dir/../harness-node/node" "$script_dir/pnpm-package/bin/pnpm.cjs" "$@"
LAUNCHER
chmod 755 -- "$pnpm_launcher"

rm -f -- "$archive_path"
echo 'Creating the local Harness runtime archive ...'
tar -czf "$archive_path" \
  --exclude=.git \
  --exclude=.agents \
  --exclude=.claude \
  --exclude=desktop \
  --exclude=docs \
  --exclude=website \
  --exclude=examples \
  --exclude='**/node_modules/.cache' \
  --exclude='**/*.tsbuildinfo' \
  -C "$project_root" \
  apps packages vendor native node_modules package.json pnpm-workspace.yaml

archive_size=$(stat -c '%s' -- "$archive_path")
if (( archive_size < 100 * 1024 * 1024 )); then
  echo "The runtime archive is unexpectedly small: $archive_size bytes." >&2
  exit 1
fi

"$node_target" --version
"$pnpm_launcher" --version
echo "Runtime archive: $archive_path ($((archive_size / 1024 / 1024)) MiB)"
echo "Bundled Node: $node_target"
echo "Bundled pnpm: $pnpm_launcher"
