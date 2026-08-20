# Agent Note: Model Router GALGame plugin and desktop distribution

Status: implemented

English | [中文](2026-08-20-model-router-galgame.zh.md)

## Problem

Users who connect several language-model providers need a visible and auditable way to select a cost-effective model for each request, distribute complex work across models, and continue the same sessions from a desktop client. The original Harness conversation surface does not represent model assignment as a GAL-style session or package the local runtime for one-click Windows installation.

## Decision

The repository ships `plugins/model-router-galgame` as a removable Harness plugin. The Host extension classifies task type and complexity, ranks discovered model routes with benchmark quality, task specialty, price, latency, and risk terms, and stages complex work as analysis, execution, and synthesis. The client extension projects the logged assignments into a GAL view with dynamic characters, save slots, logs, attachments, Markdown/KaTeX rendering, cost estimates, and collective or single-model modes.

The plugin records a concise routing explanation and stage reports through normal session messages. It does not request or display private chain-of-thought. Persona instructions are added only to the final answer stage and cannot alter routing, tools, permissions, code, formulas, or evidence handling.

The Electron client in `desktop/` selects a hosted workspace or unpacks a bundled local Harness runtime. Build scripts create the runtime archive and Windows installer locally. Generated runtimes and installers stay outside Git history and are published as release assets.

Third-party inspiration and character-art sources are attributed in the root and plugin READMEs. Character images are not represented as MIT-licensed project code and require a separate rights check before commercial use or redistribution.

## Alternatives considered

**Modify the core agent loop.** This would couple experimental routing and presentation behavior to every Harness profile. A plugin keeps the behavior removable and uses the existing model and session extension points.

**Select one fixed model for collective mode.** This would hide task-specialty and cost differences and would not exercise multi-model collaboration. The ranked staged plan makes each assignment and fallback visible.

**Commit the installer and local runtime archive.** These generated files are large and would permanently expand repository history. Release assets preserve downloadable binaries without making source clones carry every build.

**Display model reasoning traces.** Private chain-of-thought is neither required for auditability nor a stable interface. The plugin exposes inputs to the routing formula, assignments, costs, stage reports, and observed failures instead.

## Consequences

The plugin can evolve independently from the Harness core and can be installed or removed per profile. Routing is reproducible from the catalog and request, while a live provider directory determines which routes can actually run. The desktop installer is convenient but must be rebuilt and uploaded for each plugin/runtime version. Benchmark quality and pricing data remain explicit catalog inputs and must be refreshed when their sources change. Third-party visual assets retain their own licensing requirements.
