# DeepSeek Harness Plugin Market

English | [中文](README.zh.md)

This directory is an independent DeepSeek Harness plugin. It carries the Host source, built Host entry, Web client bundle, and bundle patch from [`dsh-market/dsh-market`](https://github.com/dsh-market/dsh-market) version `1.18.0`. It does not import, patch, or share an update package with Model Router + GALGame.

## Install from this repository

Run the following command from a built DeepSeek Harness checkout, then restart the Web profile:

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-market
```

Open **Settings -> Plugin Market**. The market can browse the curated catalog, inspect package metadata, install and update community plugins, enable or disable compatible entries, manage load order, create profile backups, and export diagnostics.

## Desktop integration

The Windows and Linux desktop runtimes load this plugin as a separate Web profile bundle beside Model Router + GALGame. Desktop `0.4.13` atomically installs the market and its recursive production dependencies into the user profile before local Harness boots. It carries platform-native Node.js and `pnpm@11.7.0`, so local mode can install market packages on a clean computer without a system Node toolchain. Plugins installed through the market remain dependencies of the user's Web profile and are not written into either bundled plugin directory.

## Updating the snapshot

The source and built files in this directory match the upstream npm artifact recorded in [UPSTREAM.md](UPSTREAM.md). Refresh the complete snapshot together, rerun the standalone plugin test and desktop E2E, and keep the upstream version, commit, integrity, notices, and lockfile consistent.

## Security

Market packages execute with the Harness process's permissions. Review the repository, npm identity, build scripts, requested permissions, and license before installation. Install only trusted sources and back up the Web profile before testing unfamiliar code. Catalog inclusion is discovery metadata, not a security endorsement.

The plugin code is distributed under the upstream MIT license in [LICENSE](LICENSE).
