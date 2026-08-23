# Agent Note: Fork-owned document layout

Status: implemented

English | [中文](2026-08-23-fork-owned-document-layout.zh.md)

## Problem

Fork-specific guides and research supplements placed in generic upstream documentation paths can overlap with files added by the upstream project during a later fork synchronization.

## Decision

New documentation owned by `ljwei-stak/deepseek-harness` is placed below `docs/integrations/ljwei-stak/`, with one child directory per integration or feature. The directory contains its own index and placement rules. Existing fork documents outside this boundary remain compatibility entries so published links do not break; they are not the destination for new fork-only content.

## Alternatives considered

**Continue adding files to `docs/cookbook/` and the root `docs/` directory.** This keeps the current tree familiar but increases the chance of file-level conflicts during sync.

**Move every historical document immediately.** This would reduce duplicate locations but would break published links and create a large, unrelated migration diff.

## Consequences

The fork has a stable, unique ownership boundary for future documentation. Maintainers must update the local document map when adding a new integration directory and must preserve compatibility entries until their links are retired. The boundary does not protect source-code paths or package names; those remain governed by their owning package and build rules.
