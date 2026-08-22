# Agent Note: Independent Plugin Market

Status: implemented

English | [中文](2026-08-22-independent-plugin-market.zh.md)

## Problem

The desktop client needs a discoverable plugin market and a package manager that works on clean Windows and Linux installations. Treating that market as a Model Router feature couples unrelated plugin versions, documentation, updates, and failure states.

## Decision

`plugins/dsh-market` is an independent `dshmarket@1.18.0` runtime snapshot sourced from commit `b9323cc85d0148013384a5aca5215be1922eea36`. It retains the upstream package identity, Host entry, Web bundle, production dependencies, peer requirements, and profile patch. Its local manifest omits upstream development-only scripts and records the source artifact and integrity value.

The repository keeps the reviewable snapshot in `plugins/dsh-market` and pins the matching registry package in the root runtime dependency closure. The desktop Web profile inserts `dshmarket` in its own patch row beside `model-router-galgame`; neither package imports the other. Runtime assembly materializes the repository-only Model Router package, preserves dshmarket's pnpm dependency closure, and verifies both packages' required Host and Web files.

Desktop `0.4.13` carries platform-native Node.js, `pnpm@11.7.0`, and a Windows or POSIX launcher placed before the inherited `PATH`. Before boot, it atomically materializes dshmarket and its recursive production dependency closure under the user profile instead of relying on package resolution from the extracted application directory. Existing complete market installations at the bundled version or newer remain active. Market operations therefore work without a system Node toolchain. Community dependencies and market state remain in the user's Web profile. Model Router remains version `0.4.10`; its independent updater does not replace the market package.

The [installation tutorial](../../../../docs/cookbook/dsh-market-installation.md) owns native and desktop procedures. The market catalog provides discovery metadata, while users remain responsible for reviewing executable third-party packages.

## Alternatives considered

**Document the registry package without a repository plugin directory.** This keeps the source tree smaller but does not provide a reviewable, independently archived plugin artifact tied to the desktop tests.

**Add market behavior to Model Router + GALGame.** This reduces one profile row but forces routing and marketplace changes into one version and update package, so a market failure can affect an unrelated conversation plugin.

**Copy the market catalog into the client.** The upstream plugin already separates the market application from its curated registry. A copied catalog becomes stale and makes registry refreshes depend on desktop releases.

## Consequences

Native Harness users can install, remove, or update the market without installing Model Router. Desktop users receive both plugins in one installer while their runtime identities, source directories, settings, and update ownership remain separate. Profile materialization duplicates the small market dependency closure but prevents ESM resolution from depending on the installation directory or a development checkout. The local snapshot adds repository size and requires a deliberate upstream refresh that updates source, built files, provenance, lock data, tests, and notices together. Portable pnpm increases the installer size. Market-installed code expands the trusted computing base and requires explicit user review.
