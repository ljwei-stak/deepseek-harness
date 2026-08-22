# Agent Note: Model Router GALGame plugin and desktop distribution

Status: implemented

English | [中文](2026-08-20-model-router-galgame.zh.md)

## Problem

Users who connect several language-model providers need a visible and auditable way to select a cost-effective model for each request, distribute complex work across models, and continue the same sessions from a desktop client. The original Harness conversation surface does not represent model assignment as a GAL-style session or package the local runtime for one-click Windows installation.

## Decision

The repository ships `plugins/model-router-galgame` as a removable Harness plugin. The Host extension classifies task type and complexity, ranks discovered model routes with benchmark quality, task specialty, price, latency, and risk terms, and stages complex work as analysis, execution, and synthesis. The client extension projects the logged assignments into a GAL view with dynamic characters, save slots, logs, attachments, Markdown/KaTeX rendering, cost estimates, and collective or single-model modes.

The plugin records a concise routing explanation and stage reports through normal session messages. It does not request or display private chain-of-thought. Persona instructions are added only to the final answer stage and cannot alter routing, tools, permissions, code, formulas, or evidence handling.

The Electron client in `desktop/` selects a hosted workspace or unpacks a bundled local Harness runtime. The local Web profile mounts the pinned `dshmarket` Host and client bundle alongside Model Router, and the application resources carry a portable `pnpm` launcher and package so market operations work without a system Node toolchain. Community plugins installed through the market remain dependencies of the user's Web profile. Build scripts create the runtime archive, Windows installer, independent Model Router archive, release manifest, installer parts, and SHA256 list locally. Generated runtimes and installers stay outside Git history and are published as release assets.

The plugin settings page checks only stable Releases from `ljwei-stak/deepseek-harness`. Its one-click action chooses the full-client update when available because that installer includes the matching plugin; if the client is current, it chooses the plugin-only update. Separate manual actions remain available, and every native operation requires confirmation. A plugin update verifies its hash, package identity, required files, and declared minimum desktop/runtime versions before storing it under a versioned user-data directory; an atomic `active.json` pointer selects the completed version. Local startup selects the newer compatible version between that pointer and the bundled plugin, then atomically mirrors it into the Harness profile, so a bundled older copy cannot overwrite an online update. A failed validation or profile copy leaves the prior active version usable.

A full-client update downloads or reuses the manifest-named Release parts, reconstructs the installer, verifies the complete installer SHA256, and launches it only after all checks pass. API keys, provider settings, sessions, and plugin versions remain outside the application installation directory. Web-only deployments can inspect the project and Releases pages but cannot mutate local files.

Third-party inspiration and character-art sources are attributed in the root and plugin READMEs. Character images are not represented as MIT-licensed project code and require a separate rights check before commercial use or redistribution.

The market is a pinned npm dependency rather than copied source. A complete-client release updates the bundled market and portable package manager together, while the independent Model Router updater changes only the Model Router profile package. The market's catalog provides discovery metadata, not trust: its documentation tells users that installed packages execute with Harness permissions and require repository, package identity, build-script, and license review.

## Alternatives considered

**Modify the core agent loop.** This would couple experimental routing and presentation behavior to every Harness profile. A plugin keeps the behavior removable and uses the existing model and session extension points.

**Select one fixed model for collective mode.** This would hide task-specialty and cost differences and would not exercise multi-model collaboration. The ranked staged plan makes each assignment and fallback visible.

**Commit the installer and local runtime archive.** These generated files are large and would permanently expand repository history. Release assets preserve downloadable binaries without making source clones carry every build.

**Copy the plugin market source into Model Router.** This would combine two independently versioned plugins, obscure upstream provenance, and make market security fixes depend on a Model Router source merge. A fixed package dependency preserves the market's own bundle interface and version lifecycle.

**Run `git pull` or Sync Fork inside an installed client.** A source update does not define a compatible plugin/runtime/desktop tuple and would require shipping repository credentials and build tools. Versioned Release assets make the maintainer's synchronized fork the publication point without turning end-user clients into Git worktrees.

**Replace only the profile plugin directory.** The desktop runtime used to mirror its bundled plugin on startup, so a profile-only replacement could be overwritten and could load against an incompatible Harness runtime. The persistent version store, compatibility fields, and atomic profile activation make plugin-only updates durable and reversible.

**Display model reasoning traces.** Private chain-of-thought is neither required for auditability nor a stable interface. The plugin exposes inputs to the routing formula, assignments, costs, stage reports, and observed failures instead.

## Consequences

The plugin can evolve independently from the Harness core and can be installed or removed per profile. Routing is reproducible from the catalog and request, while a live provider directory determines which routes can actually run. Plugin-only publication remains limited by its declared minimum desktop and runtime versions; an incompatible plugin or a bundled market update requires the full client first. Every public version requires one internally consistent Release manifest and assets, while failed or interrupted downloads consume user-data disk space but do not replace a working installation. The portable package manager increases the installer size and must remain compatible with the profile format. Market-installed code extends the trusted computing base and remains the user's explicit decision. Benchmark quality and pricing data remain explicit catalog inputs and must be refreshed when their sources change. Third-party visual assets retain their own licensing requirements.
