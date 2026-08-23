# Fork document map

English | [中文](document-map.zh.md)

This page is the single index for fork-owned documentation. It deliberately lives under a fork-specific directory so updating the upstream repository does not require editing an upstream index.

## Integrations

- [`dsh-web-ui-adapter`](../../dsh-web-ui-adapter/README.md): the pinned `ljwei-stak/dsh-web-ui` snapshot, dependency approval, and desktop runtime materialization.
- [`model-router-galgame/`](../model-router-galgame/README.md): reserved for new Model Router + GALGame documentation.
- [`dsh-market/`](../dsh-market/README.md): reserved for new independent market documentation.

## Placement rules

- A new fork-only document gets a path below this directory and a feature-specific child directory.
- A release document includes the release tag in its filename or in a versioned `releases/` child directory.
- Research material keeps its generated images and scripts close to the owning integration, while source code remains in the plugin or script directory.
- Existing links outside this directory are kept as compatibility entries. They are not edited only to move content.
