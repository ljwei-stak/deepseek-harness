# Model Router + GALGame

[English](README.md) | 中文

这是一个可安装在原版 DeepSeek Harness 中的插件包。安装后会在 Web 对话区增加 `GAL 视窗`，并在 Host 侧启用自适应模型路由。

## 功能

- 集体合作模式：按任务类型、复杂度、LiveBench 初始化质量、专长、成本、延迟和风险计算候选模型综合效用。
- 真实协作编排：复杂任务按“问题建模 → 资料/代码/证据处理 → DeepSeek V4 Pro 汇总”形成真实的多步模型调用；每个阶段均有可审计的工作报告、实际模型和失败回退记录。
- 单独会话模式：不覆盖 Harness 原生模型选择器，允许手动固定模型。
- GAL 视图：新会话作为存档，历史作为日志；每条台词都保留实际 provider/model，名牌、立绘和颜色随当前模型实时更新。路由分析摘要使用 DeepSeek Harness 形象，模型执行和最终汇总使用实际执行模型形象。
- 方案摘要：展示复杂度、任务类型、权重、候选排行、子任务建议和预估费用。
- Markdown/KaTeX：复用 Harness 原生 `MarkdownText`，支持粗体、斜体、标题、列表、表格、引用、行内代码、代码块、链接和 KaTeX 公式；对话框中的长表格、代码和公式可横向滚动，玩家输入保持纯文本。
- OpenCode Zen 兼容：自动纠正误填的 `https://opencode.ai` 网站地址，恢复内置模型对应的 `/zen`、`/zen/v1` 端点；自定义网关不受影响。
- 费用明细：复杂任务按所有工作阶段与最终汇总阶段累加预估费用；如果汇总模型不可用，界面会显示实际回退模型。
- 自动隐藏任务栏：智能分配方案、路由摘要和协作流程集中在顶部任务栏，短暂无操作后自动收起，移入或点击手柄即可展开。
- 附件输入：PNG/JPEG/WEBP/GIF 走原生多模态图片管线；Markdown、TXT、JSON 和代码文件自动提取为消息文本；PDF/DOCX 等二进制文件会显示解析提示。
- 对话可读性：GAL 对话正文与日志字号已提升，仍复用 Harness 原生 Markdown/KaTeX 渲染器。
- GAL persona 表达层：根据实际 provider/model 映射到人物设定，只在最终答复前调整称呼、措辞和节奏。人物设定不会进入路由评分、复杂度判断、任务拆分、工具调用或工程执行；高风险任务自动降低戏剧化表达，并保留事实、推断和待验证边界。
- 项目更新：插件设置页检查固定的项目 Release 更新源，分别提供可回退的插件更新和经过 SHA256 核验的完整桌面端更新。纯网页安装不能修改本机文件，因此会打开 Releases 页面。

## 安装

在原版 Harness 的 Web profile 中安装此目录：

```text
dsh plugin --profile web add <plugin-directory>
```

安装后重新启动 Harness。没有可用模型时插件会保留原生模型选择，不会阻断对话。

## 命令

- `/router mode collective`
- `/router mode single`
- `/router plan`

`collective` 是默认模式。路由只展示可审计的评分摘要，不输出模型私有思维链。

### OpenCode Zen 设置

在模型设置中选择 `opencode`（或 `opencode-go`），填写 OpenCode API Key 即可。官方路由不需要手动填写 API 地址，插件会使用模型目录中的正确端点。如果此前填写过 `https://opencode.ai`、`https://opencode.ai/zen` 或类似官方站点地址，重新启动后会自动清除该覆盖项；自定义域名不会被修改。

## 路由评分模型

插件把 LiveBench 派生的质量参数、任务专长、输入/输出价格、延迟和风险合并为一个可复现的效用分。对候选模型 `m`，任务类型为 `t`、复杂度档位为 `c` 时，评分为：

```text
U(m | x) = wq(c) Qm + wc(c) Cm + wl(c) (1 - Lm)
           + 0.12 (1 - wr(c)) Sm,t - wr(c) Rm
```

质量、成本、延迟和风险权重随复杂度变化：简单问题偏向低成本和低延迟，均衡问题兼顾质量，复杂问题提高质量与专长权重。复杂问题固定形成建模、执行、校验/整合三个可审计阶段；每一阶段都记录实际路由和估计费用，DeepSeek V4 Pro 是默认汇总优先级，失败时按候选分回退。质量目录是可替换的实验基线，不会把未联网的榜单快照伪装成实时事实。

## 灵感、人物与许可证边界

GAL 交互方式参考 [`Ayase34/gal-view`](https://github.com/Ayase34/gal-view)。模型娘形象和人物设定的来源链接为 [Bilibili 用户 4168597](https://space.bilibili.com/4168597)。本插件不宣称与上游项目或创作者存在官方合作；`aipicture/` 中的图片和演示截图不自动继承根项目 MIT 许可证，商业使用或再分发前请核对素材许可并取得必要授权。

## 桌面端

仓库根目录的 `desktop/` 提供服务器端/本地运行模式切换和 Windows 打包配置。已构建的安装包与独立插件包通过 [Model Router + GALGame 0.4.8 Release](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.8) 发布；源码仓库只保留构建脚本和可复现的插件资源。
