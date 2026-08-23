# Complete dsh-web-ui adapter

English | [中文](README.zh.md)

This directory pins the complete aggregate from [`ljwei-stak/dsh-web-ui`](https://github.com/ljwei-stak/dsh-web-ui) into the DeepSeek Harness source tree and desktop client. It remains independent from `model-router-galgame` and `dshmarket` and does not change their behavior.

## Why it is bundled

The suite depends on packages such as `cloudflared`, `node-pty`, and `ssh2` that need install scripts or platform-native files. The desktop plugin market blocks unapproved third-party build scripts by default, so an ad-hoc market installation can stop at pnpm's build-script approval prompt. This adapter reviews and installs those dependencies while building each installer, then ships them in the local Harness runtime. End users do not need to install the suite again from the market.

## Included capabilities

- Liangshen mode, task board, chat recovery, and Skill Explorer;
- paired mobile/desktop remote access, SSH operations, and image understanding;
- right panel, Git graph, archive manager, and plugin manager;
- pet framework, Workshop, Skin Center, and Wallpaper Engine integration;
- custom theme editing, skin previews, and on-demand community skin installation.

When local mode starts, the desktop launcher synchronizes the aggregate and every child plugin into the user profile's top-level `node_modules`, then mounts the suite through `desktop/harness-local.patch.yml`. This avoids nested bundle resolution failures and does not require a system npm or pnpm installation.

## Refreshing the pinned snapshot

Check out the fork's clean `dev` branch next to this repository, install its dependencies, and run:

```powershell
node plugins/dsh-web-ui-adapter/scripts/sync-upstream.mjs --source ..\dsh-web-ui
node --test plugins/dsh-web-ui-adapter/tests/*.test.mjs
pnpm install
```

The script accepts only the `ljwei-stak/dsh-web-ui` remote, runs type checking, the aggregate consistency gate, and the build, then writes verified local archives and `upstream-lock.json`. Source installs and Windows/Linux installers therefore use the same upstream commit.

## Source and licensing

The adapter does not replace upstream licenses. Each plugin, skin, and asset retains the license shipped in its package. Community skins and pets may add attribution or non-commercial terms; review the relevant Workshop entry before installing them.
