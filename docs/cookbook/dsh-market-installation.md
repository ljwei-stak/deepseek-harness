# Install the Independent Plugin Market

English | [中文](dsh-market-installation.zh.md)

This tutorial installs the repository's independent `dshmarket@1.18.0` snapshot into a native DeepSeek Harness Web profile and verifies its Host and Web faces. The Model Router + GALGame plugin is not required.

## Prerequisites

- A DeepSeek Harness checkout that completes `pnpm install` and `pnpm run build`.
- Node.js `^22.19` or `>=24` and pnpm for a native source installation.
- Network access to the configured market registry and npm source used for community packages.

## Install from this repository

1. Open PowerShell in the DeepSeek Harness repository root.
2. Add the independent plugin directory to the Web profile:

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-market
```

3. Restart the Web profile:

```powershell
pnpm dsh web
```

4. Open **Settings -> Plugin Market** and confirm that the page reports version `1.18.0`.
5. Verify the Host route from the same machine:

```powershell
Invoke-RestMethod http://127.0.0.1:3080/dsh-market/status
```

The response must return HTTP `200`. Its `version` field must be `1.18.0`; `pnpm: true` confirms that the market can manage profile dependencies.

## Install the upstream package directly

The adapted snapshot retains the upstream package identity. A Harness checkout that does not contain this repository directory can install the same pinned upstream release:

```powershell
pnpm dsh plugin --profile web add dshmarket@1.18.0
```

The local snapshot adds provenance and fork-specific verification files but keeps the runtime Host, Web bundle, package identity, and profile patch compatible with the upstream release.

## Use the desktop client

Desktop `0.4.13` for Windows, Debian-family Linux, and RPM-family Linux includes the independent market snapshot, Model Router + GALGame, platform-native Node.js, and portable `pnpm@11.7.0`. Before local Harness boots, the client verifies the market package in the user profile and atomically installs any missing recursive production dependencies. Installing this client over an earlier version preserves task history, model credentials, and community plugin state. Choose local mode and open **Settings -> Plugin Market**; a system Node.js or pnpm installation is not required. Market-installed community plugins remain in the user's Web profile. Updating or disabling them does not replace the Model Router package.

The market snapshot bundled with the desktop runtime changes through a complete-client update. The standalone Model Router updater changes only Model Router and does not overwrite the market or community plugin dependencies.

## Remove the native installation

Run the profile plugin manager and restart Harness:

```powershell
pnpm dsh plugin --profile web remove dshmarket
```

Review the Web profile before deleting any community plugin state or backup created through the market.

## Security

Installed packages execute with the Harness process's filesystem, network, credential-service, and subprocess access allowed by their composition. Inspect the repository, package identity, build scripts, permissions, and license; install only trusted sources and create a profile backup before trying unfamiliar code. Market listing is not a security endorsement.
