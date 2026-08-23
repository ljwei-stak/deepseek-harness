# dsh-web-ui Adapter

English | [中文](README.zh.md)

This reference defines the DeepSeek Harness integration for the complete [`ljwei-stak/dsh-web-ui`](https://github.com/ljwei-stak/dsh-web-ui) suite. The adapter source, pinned package archives, and tests live in [`plugins/dsh-web-ui-adapter`](../../../plugins/dsh-web-ui-adapter/README.md).

## What is bundled

The desktop local runtime mounts the `@linxin666/dsh-web-ui-all` aggregate and copies its production dependency closure into the Web profile. The suite provides task board, Git graph, remote pairing, SSH, image understanding, right panel, pet framework, Skin Center, Wallpaper Engine integration, Workshop, plugin and Skill management, session recovery, and Liangshen mode. Model Router + GALGame and the independent `dshmarket` plugin remain separate profile bundles.

## Why market installation failed

The suite includes native or platform-bound dependencies (`cloudflared`, `node-pty`, `ssh2`, and `cpu-features`). The market intentionally requires explicit approval before it runs dependency build scripts. A desktop installer built from this repository reviews those scripts in the root workspace and installs the matching Windows or Linux artifacts before packaging, so a user does not need to approve them from the market.

## Source installation

For a source checkout, run `pnpm install --frozen-lockfile` in the Harness root. The lockfile maps each `@linxin666/*` child to the checked-in archive under [`plugins/dsh-web-ui-adapter/vendor`](../../../plugins/dsh-web-ui-adapter/vendor/), and the local patch mounts the aggregate through [`desktop/harness-local.patch.yml`](../../../desktop/harness-local.patch.yml). The normal Web profile installer can also install the adapter package set from the repository's plugin market after the reviewed build dependencies have been enabled.

## Refreshing the fork snapshot

Use the adapter script with a clean checkout of the fork:

```powershell
node plugins/dsh-web-ui-adapter/scripts/sync-upstream.mjs --source ..\dsh-web-ui
node --test plugins/dsh-web-ui-adapter/tests/*.test.mjs
pnpm install --lockfile-only
```

The script records the upstream commit and SHA256 for every archive in [`upstream-lock.json`](../../../plugins/dsh-web-ui-adapter/upstream-lock.json). Build installers only after this lock, the root lockfile, and the package tests pass.

## Desktop artifacts

The desktop build scripts package the same runtime for all supported targets:

```powershell
pnpm run build
pwsh ./scripts/build_desktop.ps1
bash ./scripts/build_desktop_linux.sh
```

The generated Windows installer, Debian package, RPM package, and checksum files are written to [`desktop/dist`](../../../desktop/dist/). The release workflow uploads them together with the source adapter archives.
