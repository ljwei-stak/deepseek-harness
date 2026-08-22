# DeepSeek Harness 插件市场

[English](README.md) | 中文

本目录是一个独立的 DeepSeek Harness 插件，包含 [`dsh-market/dsh-market`](https://github.com/dsh-market/dsh-market) `1.18.0` 版本的 Host 源码、Host 构建入口、Web 客户端 bundle 与插件层补丁。它不导入、不修改 Model Router + GALGame，也不与 Model Router 共用独立插件更新包。

## 从本仓库安装

在已经完成构建的 DeepSeek Harness 源码目录运行下列命令，然后重启 Web profile：

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-market
```

打开“设置 -> 插件市场”。市场可以浏览精选目录、检查包信息、安装和更新社区插件、启用或禁用兼容入口、管理加载顺序、创建 profile 备份并导出诊断信息。

## 桌面端适配

Windows 桌面本地运行时把本插件作为独立 Web profile bundle，与 Model Router + GALGame 并列加载。桌面端 `0.4.12` 会在本地 Harness 启动前，以原子方式把市场及其递归生产依赖安装到用户 profile。桌面端同时携带 Node.js 和 `pnpm@11.7.0`，因此全新电脑不需要系统预装 Node 工具链，也能在本地模式安装市场插件。市场安装的插件仍作为用户 Web profile 的依赖保存，不会写入任一内置插件目录。

## 更新快照

本目录的源码和构建文件与 [UPSTREAM.md](UPSTREAM.md) 记录的上游 npm 产物一致。更新时应整体刷新快照，重新运行独立插件测试与桌面 E2E，并同步更新上游版本、提交、完整性值、第三方声明和锁文件。

## 安全说明

市场程序包会以 Harness 进程权限执行。安装前应检查代码仓库、npm 包身份、构建脚本、申请的权限和许可证，只安装可信来源，并在测试陌生代码前备份 Web profile。进入市场目录只代表可被发现，不构成安全背书。

插件代码采用上游 [MIT 许可证](LICENSE)。
