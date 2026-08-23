# dsh-web-ui 完整适配层

[English](README.md) | 中文

该目录把 [`ljwei-stak/dsh-web-ui`](https://github.com/ljwei-stak/dsh-web-ui) 的完整聚合包固定到 DeepSeek Harness 源码与桌面客户端。它与 `model-router-galgame`、`dshmarket` 相互独立，不修改这些插件的业务逻辑。

## 为什么内置

`dsh-web-ui` 包含 `cloudflared`、`node-pty`、`ssh2` 等需要安装脚本或平台原生文件的依赖。桌面端插件市场默认拦截第三方构建脚本，因此从市场临时安装全家桶可能停在“构建脚本被 pnpm 阻止”。本适配层在安装包构建阶段审核并安装这些依赖，再随本地 Harness 运行时分发；最终用户无需再次通过市场安装全家桶。

## 内置能力

- 梁神模式、任务看板、会话恢复与 Skill 中心；
- 移动端/PC 远程配对、SSH 运维和图像理解；
- 右侧面板、Git 图谱、归档管理和插件管理器；
- 鲸鱼娘宠物、创意工坊、皮肤中心和 Wallpaper Engine 壁纸；
- 自定义主题编辑、皮肤试穿以及按需安装社区皮肤。

桌面端启动本地模式时，会把聚合包和所有子插件同步到用户 profile 的顶层 `node_modules`，随后通过 `desktop/harness-local.patch.yml` 挂载。该处理既避免嵌套依赖解析失败，也不依赖用户系统已安装 npm 或 pnpm。

## 更新上游快照

维护者先将 fork 的 `dev` 分支检出到本仓库同级的 `dsh-web-ui` 目录并完成依赖安装，然后运行：

```powershell
node plugins/dsh-web-ui-adapter/scripts/sync-upstream.mjs --source ..\dsh-web-ui
node --test plugins/dsh-web-ui-adapter/tests/*.test.mjs
pnpm install
```

脚本只接受 `ljwei-stak/dsh-web-ui` 远程和干净工作树，运行类型检查、聚合一致性检查及构建，最后生成带 SHA256 的 `upstream-lock.json` 和本地 `.tgz` 包。这样 GitHub 源码、Windows 安装包与 Linux 安装包使用同一上游提交。

## 来源与许可

适配层不改变上游包的许可证。各插件、皮肤和资产继续采用其包内许可证；社区皮肤或宠物可能有额外的非商业或署名要求，安装前应查看对应条目。
