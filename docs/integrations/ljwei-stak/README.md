# Fork-specific documentation

English | [中文](README.zh.md)

This directory contains documentation owned by the `ljwei-stak/deepseek-harness` fork. Keeping fork-only files below a unique path limits file-level overlap when the fork synchronizes with `deepseek-ai/deepseek-harness`.

## Directory layout

| Directory | Scope |
| --- | --- |
| [`dsh-web-ui-adapter`](../dsh-web-ui-adapter/README.md) | The vendored and desktop-integrated `dsh-web-ui` suite. |
| `model-router-galgame/` | New guides, experiment notes, release notes, and research supplements for Model Router + GALGame. |
| `dsh-market/` | New guides and release notes for the independent plugin market. |
| `shared/` | Fork-wide procedures, compatibility notes, and update policy. |

Feature-specific documents should be added under a child directory instead of being added to an upstream cookbook or root documentation file. A child directory may contain its own `README.md`, `README.zh.md`, assets, and versioned release notes.

## Existing compatibility documents

Some earlier fork documents remain at their original paths so existing links continue to work. They are compatibility entries, not the location for new material. New edits should either update the owning document in this directory or add a new versioned document here and link to it.

## Sync-fork workflow

1. Create or update a file below `docs/integrations/ljwei-stak/<feature>/`.
2. Link source and package documentation rather than copying upstream implementation details.
3. Run the documentation link and wrapping checks before committing.
4. Sync the fork and resolve only files that belong to the upstream tree; fork-specific files should remain in this directory.

The current integration map is available in [`document-map.md`](shared/document-map.md).
