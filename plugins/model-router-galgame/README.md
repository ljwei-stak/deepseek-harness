# Model Router + GALGame

English | [中文](README.zh.md)

This plugin package can be installed on an original DeepSeek Harness checkout. It adds a `GAL view` to the Web conversation area and enables adaptive Host-side model routing.

## Features

- Collective mode ranks candidates using task type, complexity, LiveBench-initialized quality, specialties, cost, latency, and risk.
- Complex work uses real model calls for problem modelling, evidence/code processing, and DeepSeek V4 Pro synthesis, with auditable stage reports and fallback records.
- Single-model mode preserves the native Harness model selection and lets the user pin one model.
- Every GAL line retains the actual provider/model, so its portrait, nameplate, and color follow the working model. Routing summaries use the DeepSeek Harness character.
- The plan summary shows complexity, task type, weights, candidate ranking, assignments, and estimated cost.
- Harness `MarkdownText` renders Markdown, tables, code, links, and KaTeX. Wide content scrolls inside the dialogue box, and player input remains plain text.
- OpenCode Zen official website overrides are repaired to catalog-owned `/zen` or `/zen/v1` endpoints; custom gateways remain untouched.
- Stage costs are accumulated for complex work, and the interface shows the actual fallback model when synthesis cannot use its preferred route.
- The routing plan and collaboration progress share a collapsible task bar that automatically hides when idle.
- Images use the native multimodal pipeline, text-like files are extracted, and binary documents keep a visible parsing status.
- GAL dialogue and log typography are enlarged while retaining the native Markdown/KaTeX renderer.
- The persona layer affects final wording only and is excluded from routing, decomposition, tools, and engineering execution.

## Installation

Install this directory into the original Harness Web profile:

```text
dsh plugin --profile web add <plugin-directory>
```

Restart Harness after installation. If no model is available, the plugin preserves native model selection and does not block the conversation.

## Commands

- `/router mode collective`
- `/router mode single`
- `/router plan`

`collective` is the default mode. The router exposes an auditable scoring summary, not private model chain-of-thought.

### OpenCode Zen settings

Choose `opencode` or `opencode-go` in model settings and enter the API key. Official routes do not need a manual API URL. On restart, the plugin clears official website overrides such as `https://opencode.ai` while leaving custom domains unchanged.

## Routing score

The plugin combines LiveBench-derived quality, task specialty, input/output price, latency, and risk into a reproducible utility score:

```text
U(m | x) = wq(c) Qm + wc(c) Cm + wl(c) (1 - Lm)
           + 0.12 (1 - wr(c)) Sm,t - wr(c) Rm
```

Weights change with complexity: simple requests favor cost and latency, balanced requests trade quality against cost, and complex requests prioritize quality and specialty. Complex requests create three auditable stages, each with an actual route and cost estimate. DeepSeek V4 Pro is preferred for synthesis and ranked fallback handles failures. The quality catalog is a replaceable experimental baseline, not a claim of a live leaderboard fetch.

## Inspiration, characters, and licensing

The GAL interaction is inspired by [`Ayase34/gal-view`](https://github.com/Ayase34/gal-view). Character artwork and its concept are attributed to [Bilibili space 4168597](https://space.bilibili.com/4168597). The plugin does not claim an official partnership. Images in `aipicture/` and screenshots containing them are not automatically covered by the root MIT license; check the source terms and obtain permission before commercial use or redistribution.

## Desktop application

The root `desktop/` directory provides server/local mode selection and Windows packaging. Built installers are published through the [Model Router + GALGame 0.4.7 release](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.7), while Git retains source and reproducible build configuration.
