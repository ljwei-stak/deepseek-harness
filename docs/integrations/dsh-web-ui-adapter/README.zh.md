# dsh-web-ui 适配说明

[English](README.md) | 中文

本文说明 DeepSeek Harness 对 [`ljwei-stak/dsh-web-ui`](https://github.com/ljwei-stak/dsh-web-ui) 完整功能集的适配。适配源代码、固定版本的插件压缩包和测试位于 [`plugins/dsh-web-ui-adapter`](../../../plugins/dsh-web-ui-adapter/README.zh.md)。

## 内置内容

桌面端本地运行时挂载 `@linxin666/dsh-web-ui-all` 聚合包，并把它的生产依赖闭包复制到 Web profile。完整套件包含任务看板、Git 图谱、远程配对、SSH、图像理解、右侧面板、宠物框架、皮肤中心、Wallpaper Engine 接入、创意工坊、插件与 Skill 管理、会话恢复和梁神模式。Model Router + GALGame 与独立的 `dshmarket` 仍然是分开的 profile bundle。

## 为什么插件市场安装会失败

套件依赖 `cloudflared`、`node-pty`、`ssh2` 和 `cpu-features` 等原生或平台相关包。插件市场在执行依赖构建脚本前会要求明确放行，这是它的安全策略。由本项目构建的桌面安装包会在根工作区审核这些脚本，并在打包前生成匹配 Windows 或 Linux 的依赖，因此用户不需要再从市场放行构建脚本。

## 源码安装

在 Harness 根目录运行 `pnpm install --frozen-lockfile`。锁文件把每个 `@linxin666/*` 子包映射到 [`plugins/dsh-web-ui-adapter/vendor`](../../../plugins/dsh-web-ui-adapter/vendor/) 中的固定压缩包，桌面本地补丁通过 [`desktop/harness-local.patch.yml`](../../../desktop/harness-local.patch.yml) 挂载聚合包。完成审核构建后，也可以通过项目插件市场安装适配包集合。

## 更新 fork 快照

将 fork 的干净工作树放在项目同级目录，运行：

```powershell
node plugins/dsh-web-ui-adapter/scripts/sync-upstream.mjs --source ..\dsh-web-ui
node --test plugins/dsh-web-ui-adapter/tests/*.test.mjs
pnpm install --lockfile-only
```

脚本会在 [`upstream-lock.json`](../../../plugins/dsh-web-ui-adapter/upstream-lock.json) 中记录上游提交和每个压缩包的 SHA256。只有锁文件、根锁文件和适配测试都通过后才应构建安装包。

## 桌面安装包

所有桌面目标使用同一套运行时构建：

```powershell
pnpm run build
pwsh ./scripts/build_desktop.ps1
bash ./scripts/build_desktop_linux.sh
```

Windows 安装包、Debian 包、RPM 包和校验文件写入 [`desktop/dist`](../../../desktop/dist/)。发布工作流会把它们与适配层源代码包一起上传。
