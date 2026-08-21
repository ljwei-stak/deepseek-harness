# Model Router + GALGame fork extension

English | [中文](README.zh.md)

This directory is the conflict-resistant entry point for the Model Router + GALGame distribution maintained by [`ljwei-stak/deepseek-harness`](https://github.com/ljwei-stak/deepseek-harness). The repository root README follows upstream DeepSeek Harness unchanged so routine fork synchronization does not collide with product documentation.

> Current plugin and desktop release: [`0.4.9`](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.9)

## Preview

<p>
  <img src="../../docs/images/model-router-galgame/gal-view-deepseek.png" alt="GAL view with the DeepSeek character" width="49%">
  <img src="../../docs/images/model-router-galgame/gal-view-claude.png" alt="GAL view with the Claude character" width="49%">
</p>
<p>
  <img src="../../docs/images/model-router-galgame/collective-route-plan.png" alt="Collective routing plan and stage summary" width="49%">
  <img src="../../docs/images/model-router-galgame/gal-view-qwen.png" alt="GAL view with the Qwen character" width="49%">
</p>

## Components

| Path | Purpose |
| --- | --- |
| [`plugins/model-router-galgame`](../../plugins/model-router-galgame/README.md) | Installable router, collaboration orchestration, GAL client, character assets, and focused tests |
| [`desktop`](../../desktop) | Electron launcher, server/local mode selection, packaging, native updater, and desktop tests |
| [`scripts/build_harness_runtime.ps1`](../../scripts/build_harness_runtime.ps1) | Self-contained local Harness runtime build |
| [`scripts/build_desktop.ps1`](../../scripts/build_desktop.ps1) | Windows installer build |
| [`scripts/build_update_assets.ps1`](../../scripts/build_update_assets.ps1) | Plugin/client archives, installer parts, update manifest, and checksums |

## Product behavior

- Collective mode classifies task type and complexity, ranks available routes, decomposes complex work, and displays assignments, estimated cost, stage reports, and observed fallback behavior.
- Single-model mode preserves the user's explicit Harness model choice for direct follow-up work in the same session.
- The active provider and model control the GAL portrait, nameplate, and accent color. New conversations act as save slots and history remains available in the log.
- Assistant responses reuse Harness `MarkdownText` for Markdown, code, tables, links, and KaTeX. Player input remains plain text.
- Images use the native multimodal path; text-like files are extracted into the request and binary-document parsing status remains visible.
- Persona changes final expression only. It cannot change routing, decomposition, tools, permissions, code, formulas, citations, or evidence.
- OpenCode Zen routes are discovered from the provider catalog and official website URLs are repaired to the catalog-owned API endpoint without changing custom gateways.

## Routing model

For request `x`, task type `t`, complexity band `c`, and candidate model `m`, the auditable utility score is:

```text
U(m | x) = wq(c) Qm + wc(c) Cm + wl(c) (1 - Lm)
           + 0.12 (1 - wr(c)) Sm,t - wr(c) Rm
```

The terms represent benchmark-derived quality, normalized price, latency, task-specialty match, and execution risk. Simple requests favor cost and latency; balanced requests trade quality against cost; complex requests emphasize quality and specialty. Complex work creates staged calls and prefers DeepSeek V4 Pro for synthesis, with ranked fallback when it is unavailable. The interface exposes scoring inputs and observed execution records, not private chain-of-thought.

## Install and update

Install the plugin directory into an original Harness Web profile:

```text
dsh plugin --profile web add <repository-path>/plugins/model-router-galgame
```

The desktop client and standalone plugin archive are published in the [latest Model Router + GALGame Release](https://github.com/ljwei-stak/deepseek-harness/releases/latest). The unified update action checks both products:

- If the desktop client is outdated, it installs the full client, which already contains the matching plugin.
- If the client is current but the plugin is outdated, it updates only the plugin.
- Separate plugin-only and full-client actions remain available.

Every plugin update validates version compatibility, archive structure, and SHA256 before activation. A full-client update downloads resumable installer parts, reconstructs the installer, validates SHA256, and only then starts the native installer. Provider settings, API keys, sessions, and rollback versions stay in the user-data directory.

## Attribution and licensing

The GAL interaction is inspired by [`Ayase34/gal-view`](https://github.com/Ayase34/gal-view). Character artwork and its concept are attributed to [Bilibili space 4168597](https://space.bilibili.com/4168597). The extension does not claim an official partnership. Images and screenshots containing them are not automatically covered by the repository MIT license; check the source terms and obtain permission before commercial use or redistribution.

Upstream project: [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness). This fork extension is independently maintained and does not represent an official DeepSeek AI release.
