# 安装独立插件市场

[English](dsh-market-installation.md) | 中文

本教程将仓库内独立的 `dshmarket@1.18.0` 快照安装到原生 DeepSeek Harness Web profile，并核验 Host 与 Web 两个入口。安装过程不依赖 Model Router + GALGame 插件。

## 前置条件

- DeepSeek Harness 源码目录可以完成 `pnpm install` 与 `pnpm run build`。
- 原生源码安装需要 Node.js `^22.19` 或 `>=24` 以及 pnpm。
- 当前网络能够访问已经配置的市场目录和社区插件使用的 npm 来源。

## 从本仓库安装

1. 在 DeepSeek Harness 仓库根目录打开 PowerShell。
2. 把独立插件目录添加到 Web profile：

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-market
```

3. 重启 Web profile：

```powershell
pnpm dsh web
```

4. 打开“设置 -> 插件市场”，确认页面显示版本 `1.18.0`。
5. 在同一台电脑核验 Host 路由：

```powershell
Invoke-RestMethod http://127.0.0.1:3080/dsh-market/status
```

响应必须返回 HTTP `200`，其中 `version` 应为 `1.18.0`；`pnpm: true` 表示市场能够管理 profile 依赖。

## 直接安装上游程序包

适配快照保留上游包身份。不包含本仓库插件目录的 Harness 源码可以直接安装相同的固定上游版本：

```powershell
pnpm dsh plugin --profile web add dshmarket@1.18.0
```

本地快照增加了来源记录和本 fork 的验证文件，同时保持 Host 运行时、Web bundle、包身份和 profile 补丁与上游版本兼容。

## 使用 Windows 桌面客户端

桌面端 `0.4.12` 包含独立市场快照、Model Router + GALGame、内置 Node.js 与便携版 `pnpm@11.7.0`。本地 Harness 启动前，客户端会检查用户 profile 中的市场程序包，并以原子方式安装缺失的递归生产依赖。在旧版本上覆盖安装该客户端会保留任务历史、模型凭据和社区插件状态。选择本地模式后打开“设置 -> 插件市场”即可使用，不需要系统安装 Node.js 或 pnpm。市场安装的社区插件仍保存在用户的 Web profile 中；更新或禁用这些插件不会替换 Model Router 包。

桌面运行时内置的市场快照随完整客户端更新。Model Router 独立更新器只修改 Model Router，不会覆盖市场或社区插件依赖。

## 删除原生安装

运行 profile 插件管理命令，然后重启 Harness：

```powershell
pnpm dsh plugin --profile web remove dshmarket
```

删除市场创建的社区插件状态或备份前，应先检查 Web profile 中仍需保留的内容。

## 安全说明

市场程序包会获得 Harness 组合允许的文件系统、网络、凭据服务和子进程访问能力。安装前应检查代码仓库、包身份、构建脚本、权限和许可证，只安装可信来源，并在测试陌生代码前创建 profile 备份。进入市场目录不构成安全背书。
