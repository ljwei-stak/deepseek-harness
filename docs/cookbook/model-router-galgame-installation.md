# Install Model Router + GALGame on a native DeepSeek Harness

English | [中文](model-router-galgame-installation.zh.md)

This tutorial installs the Model Router + GALGame plugin into a checkout of the upstream DeepSeek Harness. It covers the Web profile, local desktop use, provider settings, collective routing, single-model sessions, updates, and removal.

## Prerequisites

You need a supported Node.js version, pnpm, a working DeepSeek Harness checkout, and at least one configured model provider. Keep API keys in Harness settings or its credential provider; do not place them in the plugin directory or commit them to Git.

## Install from a plugin directory

1. Clone the native Harness repository and install its dependencies.

   ```powershell
   git clone https://github.com/deepseek-ai/deepseek-harness.git
   cd deepseek-harness
   pnpm install --frozen-lockfile
   ```

2. Obtain the `model-router-galgame` directory from the Model Router + GALGame repository or from the matching `Model-Router-GALGame-Plugin-<version>.tar.gz` release asset, and extract it to a local path.

3. Add the plugin to the native Web profile. Replace the placeholder with the absolute extracted directory path.

   ```powershell
   pnpm dsh plugin --profile web add "C:\path\to\model-router-galgame"
   ```

   The equivalent installed CLI command is:

   ```text
   dsh plugin --profile web add <plugin-directory>
   ```

4. Restart the Harness Web profile. Open the plugin settings page and confirm that `Model Router + GALGame` appears in the installed plugin list.

## Configure providers and routing data

1. Configure one or more providers in the native Harness model settings and verify that each provider can answer a small request.
2. In the plugin settings, open **Model costs and routing budget** and enter the input, output, cache-read, and cache-write prices in USD per one million tokens. A `provider/model` entry can override a model-specific price for a gateway.
3. Set the LiveBench endpoint and refresh interval. The default endpoint discovers the latest official release; a JSON or CSV mirror can be supplied for an air-gapped installation. If refresh fails, the last successful snapshot is retained, then the checked-in experimental baseline is used and the route summary says that network verification was not completed.
4. Set an optional per-task budget and cache ratios. Leave cache ratios at zero unless the provider explicitly enables prompt caching.

## Use collective collaboration

Collective mode is the default. It evaluates complexity and task directions, creates work packages, assigns feasible models under quality floors, repairs a plan that exceeds the budget, and routes synthesis to the preferred final model when available.

```text
/router mode collective
/router plan
```

Submit a request in the conversation view. Expand **Session mode**, **Collaboration flow**, and **Route analysis** to inspect the task categories, quality scores, assignments, estimated cost, quality floors, budget status, and fallback reasons. The view exposes an auditable routing summary; it does not expose private model chain-of-thought.

The implementation can be inspected at [`router.mjs`](../../plugins/model-router-galgame/.dsh-plugin/shared/router.mjs), [`livebench.mjs`](../../plugins/model-router-galgame/.dsh-plugin/shared/livebench.mjs), and [`index.mjs`](../../plugins/model-router-galgame/.dsh-plugin/index.mjs). Keyless regression coverage is in [`router.test.mjs`](../../plugins/model-router-galgame/tests/router.test.mjs) and [`collaboration.test.mjs`](../../plugins/model-router-galgame/tests/collaboration.test.mjs).

## Use a single model

Switch to single-session mode when a follow-up must be handled by one explicitly selected model. The optimizer does not replace the model chosen in the native selector.

```text
/router mode single
```

Select the provider and model in the Harness model selector, then send the request. Return to collective mode with `/router mode collective` when you want automatic decomposition and assignment again.

## Desktop application

The desktop packages contain the Harness runtime, the Web client, and the matching plugin bundle. Windows uses `DeepSeek-Harness-ModelRouter-GALGame-Setup-<version>-Windows-x64.exe`; Debian and Ubuntu use `DeepSeek-Harness-ModelRouter-GALGame-<version>-Linux-amd64.deb`; Fedora, RHEL, and openEuler use `DeepSeek-Harness-ModelRouter-GALGame-<version>-Linux-x86_64.rpm`. Start the application after installation, then choose **Server** to connect to a remote Harness or **Local** to use the bundled platform-native Node.js runtime.

Install a downloaded Debian package with `sudo apt install ./<package>.deb`, or an RPM package with `sudo dnf install ./<package>.rpm`. Both formats install a desktop application entry. The Windows update control can start a verified full-client installer. Linux opens the project Releases page so the user can install the signed or checksum-verified package through the system package manager; it does not request administrator privileges from inside the application. Plugin-only updates remain available on every desktop platform.

The installer is not required for native Web profile installation. A plugin installed with `dsh plugin --profile web add` is owned by that Harness profile and is updated independently from a desktop installation.

## Update or remove the plugin

To update a native installation, download the newer plugin directory or release archive, run the same `dsh plugin --profile web add` command for that directory, and restart Harness. The plugin settings update control can open the project Releases page when the Web profile cannot write local files.

To remove the plugin, use the native plugin manager for the Web profile, or remove its profile entry and restart Harness. Do not delete provider credentials or model prices unless you intend to reset those settings.

## Troubleshooting

- **The plugin is not listed:** confirm that the path passed to `dsh plugin --profile web add` contains `package.json` and `.dsh-plugin/index.mjs`, then restart the same profile that received the plugin.
- **A plan shows no LiveBench data:** check the endpoint and network access. The router remains usable with the previous snapshot or experimental baseline, and the summary explicitly marks the missing network verification.
- **A model is not selected:** verify that its provider is enabled, its model identifier matches the native catalog, and its manual price entry uses the exact `provider/model` key when a gateway is involved.
- **A desktop update fails:** close running Harness windows, retry the update, or install the newest complete package. On Linux, download the matching DEB or RPM from Releases and update it with the system package manager. Preserve the user data directory when uninstalling so session archives and settings remain available.
- **An image request fails:** use a provider that advertises vision capability in the native catalog and attach the image through the Harness attachment control; unsupported binary formats remain marked as unparsed instead of being silently sent as text.

## Security and reproducibility

Review provider URLs and prices before enabling routing. Prices are user-provided reference data for estimates, not a permanent statement of vendor pricing. Keep API keys in the Harness credential store, and verify release checksums before distributing an installer or plugin archive.
