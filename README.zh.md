# DeepSeek Harness · Model Router + GALGame

[English](README.md) | 中文

这是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的增强发行版，集成了多模型智能路由、分阶段协作、GALGame 形式的对话体验，以及可一键安装的 Windows 桌面客户端。

项目继续兼容 Harness 的插件架构。完整功能也可以作为独立的 [`model-router-galgame`](plugins/model-router-galgame/README.md) 插件，安装到原版 DeepSeek Harness 中使用。

> 当前插件与桌面端版本：`0.4.7`。DeepSeek Harness 仍处于开发者预览阶段，后续可能出现破坏兼容性的变更。

## 界面预览

<p>
  <img src="docs/images/model-router-galgame/gal-view-deepseek.png" alt="DeepSeek 模型娘 GAL 视窗" width="49%">
  <img src="docs/images/model-router-galgame/gal-view-claude.png" alt="Claude 模型娘 GAL 视窗" width="49%">
</p>
<p>
  <img src="docs/images/model-router-galgame/collective-route-plan.png" alt="集体合作路由方案与阶段摘要" width="49%">
  <img src="docs/images/model-router-galgame/gal-view-qwen.png" alt="Qwen 模型娘 GAL 视窗" width="49%">
</p>

## 本项目新增内容

### GAL 视窗

- 立绘、名牌和强调色跟随当前阶段实际执行的 provider 与模型变化，覆盖 DeepSeek、ChatGPT、Claude、Qwen、Kimi、Gemini、GLM、Grok、豆包、MiniMax、MiMo 和 OpenCode Zen 等模型娘。
- 每个新对话相当于一个存档，完整历史对话可通过日志查看。
- 路由方案、候选模型排行、子任务分配、协作进度、失败回退和预估费用统一放入可折叠、可自动隐藏的任务栏。
- AI 回复复用 Harness 的 `MarkdownText`，支持标题、列表、表格、引用、链接、行内代码、代码块和 KaTeX 数学公式；玩家输入保持纯文本。
- 图片走原生多模态管线；Markdown、文本、JSON 和源代码文件会提取到请求中；PDF、DOCX 等附件保留可见的解析状态。
- persona 表达层会在技术工作完成后赋予模型娘不同的说话风格，但不能改变路由、拆题、工具、权限、代码、公式、引用或证据；高风险问题自动使用克制的专业语气。

### 集体合作与单独会话

在**集体合作**模式中，Harness 会分析问题、选择适合的模型、拆解复杂任务，并在执行前展示简洁的路由摘要。复杂任务通过真实的多阶段模型调用完成“问题建模与约束提取”“资料/代码/证据处理”“结果校验与整合”。最终整合优先使用 DeepSeek V4 Pro，不可用时会明确显示回退模型。

在**单独会话**模式中，用户可以指定一个模型，在同一会话内继续追问。集体路由器不会覆盖手动选择，因此可以先完成一次多模型协作，再切换到某个模型做进一步工作。

OpenCode Zen 模型会从已连接的 provider 目录中发现。插件还会把误填的 OpenCode 官方网页地址修复为模型目录对应的 `/zen` 或 `/zen/v1` API 端点，同时保留用户配置的自定义网关。

## 集体合作算法

路由器先将问题识别为代码、数学、研究、视觉、写作、总结或通用任务，再计算归一化复杂度，并选择质量、成本、延迟和风险的权重。模型质量使用可复现实验的 LiveBench 派生参数快照初始化；模型是否可用则实时从当前 Harness 已配置的 provider 中发现。

对于问题 `x`、任务类型 `t`、复杂度档位 `c` 和候选模型 `m`，可审计的综合效用分为：

```text
U(m | x) = wq(c) Qm + wc(c) Cm + wl(c) (1 - Lm)
           + 0.12 (1 - wr(c)) Sm,t - wr(c) Rm
```

| 参数 | 含义 |
| --- | --- |
| `Qm` | 归一化基准质量 |
| `Cm` | 输入/输出价格归一化得分 |
| `Lm` | 归一化延迟，数值越低越好 |
| `Sm,t` | 模型专长与任务类型的匹配度 |
| `Rm` | 模型目录中的执行风险 |

| 复杂度 | 质量 | 成本 | 延迟 | 风险 | 分配倾向 |
| --- | ---: | ---: | ---: | ---: | --- |
| 简单 | 0.35 | 0.45 | 0.15 | 0.05 | 成本与响应速度 |
| 均衡 | 0.52 | 0.28 | 0.12 | 0.08 | 质量与成本平衡 |
| 复杂 | 0.65 | 0.18 | 0.07 | 0.10 | 质量与任务专长 |

系统按 `U` 对候选模型排序。复杂问题拆成三个阶段，并分别交给适合且可用的模型；费用估计会累加执行模型与汇总模型的输入/输出 token 成本。如果路由因模型不可用、地区限制或限流失败，系统会选择下一名尚未失败的候选模型，并在界面显示实际执行路由。

系统展示评分依据、任务分配、费用、阶段工作报告和已观察到的失败，不展示模型私有思维链。

## Run

### Windows 桌面客户端

从项目 Release 下载一键安装包。由于安装包约 574 MiB，GitHub Release 将其拆成较短的分片以避免长连接中断；在 Windows 上运行下载脚本即可自动合并并核验原始安装包的 SHA256：

- [下载并核验脚本](https://github.com/ljwei-stak/deepseek-harness/releases/download/model-router-galgame-0.4.7/download_desktop_release.ps1)
- [Release 说明、blockmap 与 SHA256 校验文件](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.7)

```powershell
powershell -ExecutionPolicy Bypass -File .\download_desktop_release.ps1 -RunInstaller
```

安装后可以选择**服务器端模式**打开已部署的 Harness 工作区，也可以选择**本地模式**自动解压并启动安装包内置运行时。模型 provider 与 API Key 仍在 Harness 设置界面中配置。

### 安装到原版 Harness

在已有的 DeepSeek Harness 源码目录中，将本仓库的插件目录安装到 Web profile：

```text
dsh plugin --profile web add <repository-path>/plugins/model-router-galgame
```

安装后重新启动 Harness。默认模式为 `collective`；可以使用 `/router mode single`、`/router mode collective` 和 `/router plan` 切换或查看路由方案。

### Run from source

环境要求：Node.js `^22.19.0` 或 `>=24.0.0`，pnpm `11.7.0`。

```sh
git clone https://github.com/ljwei-stak/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

Web UI 默认运行在 `http://127.0.0.1:3080`，本机启动时会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。Harness 的基础配置方式见原项目 [Web UI 指南](docs/user/guide/index.md)。

完成 Web 与 Host 构建后，可使用以下命令重新生成 Windows 安装包：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build_desktop.ps1
```

本地运行时压缩包、安装包、解包后的应用和桌面端测试输出不会提交到 Git，而是作为 Release 资产发布。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| [`plugins/model-router-galgame`](plugins/model-router-galgame/README.md) | 智能路由、协作编排、GAL 客户端、人物素材和专项测试 |
| `desktop/` | Electron 启动器、服务器端/本地模式选择、打包配置和桌面端 E2E 测试 |
| `scripts/build_harness_runtime.ps1` | 构建可独立运行的本地 Harness 运行时压缩包 |
| `scripts/build_desktop.ps1` | 构建 Windows 安装包 |
| `docs/images/model-router-galgame/` | 可在 GitHub README 中展示的运行截图 |

DeepSeek Harness 采用**一切皆插件**的架构，并由 [Cordis](https://github.com/cordiverse/cordis) 驱动，设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper)。原项目开发资料见[开发指南](docs/development.md)、[架构文档](docs/architecture.md)和[贡献指南](CONTRIBUTING.md)。

## 创意与素材来源

GAL 视窗的交互与呈现方式参考 [`Ayase34/gal-view`](https://github.com/Ayase34/gal-view)。模型娘的设定方向和项目作者提供的人物图片注明来源于 [Bilibili 用户 4168597](https://space.bilibili.com/4168597)。

这些链接用于记录创意灵感和素材来源。本仓库不宣称与所引用项目或创作者存在官方合作，也不主张取得第三方权利。人物图片以及包含这些图片的演示截图属于本分支作者提供的项目素材，不自动包含在根目录 MIT 许可证中；商业使用或再分发前请核对原始条款并取得必要授权。

## 许可证与上游项目

DeepSeek Harness 源代码使用 [MIT 许可证](LICENSE)。第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；上述视觉素材保留独立的权利状态。

上游项目：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)。本仓库是独立维护的增强分支，不代表 DeepSeek AI 官方发行版。
