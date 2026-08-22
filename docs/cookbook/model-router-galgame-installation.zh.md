# 在原生 DeepSeek Harness 上安装 Model Router + GALGame

[English](model-router-galgame-installation.md) | 中文

本教程说明如何把 Model Router + GALGame 插件安装到原版 DeepSeek Harness，包括 Web profile、桌面端本地使用、模型服务设置、集体协作、单独会话、更新和卸载。

## 前置条件

需要安装受支持的 Node.js、pnpm，一个可运行的 DeepSeek Harness 源码目录，以及至少一个已经配置好的模型服务。API Key 应保存在 Harness 设置或凭据服务中，不要写入插件目录，也不要提交到 Git。

## 从插件目录安装

1. 克隆原版 Harness 并安装依赖。

   ```powershell
   git clone https://github.com/deepseek-ai/deepseek-harness.git
   cd deepseek-harness
   pnpm install --frozen-lockfile
   ```

2. 从 Model Router + GALGame 项目取得 `model-router-galgame` 目录，或下载对应版本的 `Model-Router-GALGame-Plugin-<version>.tar.gz` Release 资源并解压到本地路径。

3. 将插件加入原生 Web profile，把占位路径替换为解压后的绝对路径。

   ```powershell
   pnpm dsh plugin --profile web add "C:\path\to\model-router-galgame"
   ```

   已安装 CLI 的等价命令是：

   ```text
   dsh plugin --profile web add <plugin-directory>
   ```

4. 重启 Harness Web profile，打开插件设置页面，确认已安装插件列表中出现 `Model Router + GALGame`。

## 安装插件市场

Windows 桌面客户端已经内置 `dshmarket@1.18.0` 和便携版 `pnpm`。选择本地运行后打开“设置 -> 插件市场”即可使用，不需要再次安装市场或系统包管理器。

原生 Harness 源码目录需要把市场安装到 Web profile，然后重启 Harness：

```powershell
pnpm dsh plugin --profile web add dshmarket@1.18.0
```

市场页面可以浏览社区目录、核验包信息、安装或更新插件、启用或禁用兼容入口、调整社区 bundle 顺序、创建备份和导出诊断。通过市场安装的插件及其状态归用户自己的 Web profile 管理，不写入 Model Router 插件目录。

## 配置模型服务与路由数据

1. 在原生 Harness 的模型设置中配置一个或多个模型服务，并先用简单请求验证每个服务可以正常回答。
2. 在插件设置中打开“模型费用与路由预算”，填写输入、输出、缓存读取和缓存写入价格，单位为每百万 Token 的美元价格。需要针对中转站覆盖价格时，可以使用 `provider/model` 条目。
3. 设置 LiveBench 地址和刷新周期。默认地址会发现最新官方版本；无网络环境可以填写 JSON 或 CSV 镜像。刷新失败时会保留上一次成功快照，再没有快照则使用项目内实验基线，并在路由摘要中标明“未完成联网核验”。
4. 可选填写单任务预算和缓存比例。只有模型服务明确启用提示词缓存时才填写缓存比例，否则保持为零。

## 使用集体协作

集体模式是默认模式。它会评估复杂度和业务方向，生成工作包，在质量下限内分配模型，预算超限时修复方案，并在可用时将最终整合交给首选模型。

```text
/router mode collective
/router plan
```

在对话视窗中提交任务，展开“会话方式”“协作流程”和“路由分析”即可查看任务分类、质量分数、模型分配、预计费用、质量下限、预算状态和回退原因。界面展示的是可审计的路由摘要，不展示模型私有思维链。

实现代码位于 [`router.mjs`](../../plugins/model-router-galgame/.dsh-plugin/shared/router.mjs)、[`livebench.mjs`](../../plugins/model-router-galgame/.dsh-plugin/shared/livebench.mjs) 和 [`index.mjs`](../../plugins/model-router-galgame/.dsh-plugin/index.mjs)。无 Key 回归测试位于 [`router.test.mjs`](../../plugins/model-router-galgame/tests/router.test.mjs) 和 [`collaboration.test.mjs`](../../plugins/model-router-galgame/tests/collaboration.test.mjs)。

## 使用单独模型

当后续要求必须由一个指定模型完成时，切换到单独会话。优化器不会覆盖原生模型选择器中明确选定的模型。

```text
/router mode single
```

在 Harness 模型选择器中选择 provider 和 model，然后发送请求。需要再次自动拆分和分配时，使用 `/router mode collective` 返回集体模式。

## 桌面端应用

Windows 安装包包含 Harness 运行时、Web 客户端、匹配版本的 Model Router、`dshmarket` 和便携版 `pnpm`。安装 `DeepSeek-Harness-ModelRouter-GALGame-Setup-<version>-Windows-x64.exe` 后启动应用，选择“服务器端”连接远程 Harness，或选择“本地”使用内置运行时。桌面端检测到客户端过期时，一键更新会同时更新完整客户端和内置组件；客户端仍兼容时只更新 Model Router 插件包。内置市场版本随完整客户端更新，通过市场安装的社区插件保持各自的更新周期。

桌面安装包不是原生 Web profile 安装的前置条件。通过 `dsh plugin --profile web add` 安装的插件归对应 Harness profile 管理，与桌面端安装相互独立。

## 更新或卸载插件

更新原生安装时，下载新的插件目录或 Release 压缩包，再对该目录执行同一个 `dsh plugin --profile web add` 命令并重启 Harness。当 Web profile 无法写入本机文件时，可以使用插件设置中的更新控件打开项目 Releases 页面。

卸载插件时，使用 Web profile 的原生插件管理器，或删除该 profile 的插件条目后重启 Harness。除非确实要重置设置，否则不要删除模型凭据、价格和历史存档。

## 常见问题

- **插件列表中没有插件：** 确认传给 `dsh plugin --profile web add` 的目录同时包含 `package.json` 和 `.dsh-plugin/index.mjs`，并重启实际安装插件的同一个 profile。
- **路由方案没有 LiveBench 数据：** 检查地址和网络访问。路由器仍会使用上一次快照或实验基线，并在摘要中明确标记未完成联网核验。
- **没有选出模型：** 确认 provider 已启用、模型标识与原生目录一致；使用中转站时，价格条目要使用准确的 `provider/model` 键。
- **桌面更新失败：** 关闭正在运行的 Harness 窗口后重试，或安装最新完整安装包。卸载时保留用户数据目录，以保留会话存档和设置。
- **图片任务失败：** 使用原生目录中声明支持视觉能力的模型，并通过 Harness 附件控件添加图片；不支持的二进制格式会保持“未解析”状态，不会被静默当作文本发送。
- **市场提示 pnpm 不可用：** 原生 Harness 需要安装 `pnpm` 后重启。Windows 安装版的 `/dsh-market/status` 应返回 `pnpm: true`；若内置工具缺失，请重新安装完整客户端。

## 安全与可复现性

启用路由前检查模型服务地址和价格。价格是用户填写的估算参考数据，不代表供应商永久官方报价。API Key 应保存在 Harness 凭据存储中，分发安装包或插件压缩包前应核对 Release 校验和。市场插件会使用 Harness 进程权限执行；安装前应检查代码仓库、包身份、构建脚本和许可证，只安装可信来源，并在接入陌生代码前备份 Web profile。进入市场目录不代表获得安全背书。
