# Model Router + GALGame fork 扩展

[English](README.md) | 中文

本目录是 [`ljwei-stak/deepseek-harness`](https://github.com/ljwei-stak/deepseek-harness) 维护的 Model Router + GALGame 发行版入口。仓库根目录 README 将保持与 DeepSeek Harness 上游一致，产品文档放在这个独立目录中，避免日常 Sync fork 再次产生冲突。

> 当前插件与桌面端版本：[`0.4.9`](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.9)

## 界面预览

<p>
  <img src="../../docs/images/model-router-galgame/gal-view-deepseek.png" alt="DeepSeek 模型娘 GAL 视窗" width="49%">
  <img src="../../docs/images/model-router-galgame/gal-view-claude.png" alt="Claude 模型娘 GAL 视窗" width="49%">
</p>
<p>
  <img src="../../docs/images/model-router-galgame/collective-route-plan.png" alt="集体合作路由方案与阶段摘要" width="49%">
  <img src="../../docs/images/model-router-galgame/gal-view-qwen.png" alt="Qwen 模型娘 GAL 视窗" width="49%">
</p>

## 组成

| 路径 | 用途 |
| --- | --- |
| [`plugins/model-router-galgame`](../../plugins/model-router-galgame/README.md) | 可独立安装的路由器、协作编排、GAL 客户端、人物素材和专项测试 |
| [`desktop`](../../desktop) | Electron 启动器、服务器端/本地模式选择、打包、原生更新器和桌面端测试 |
| [`scripts/build_harness_runtime.ps1`](../../scripts/build_harness_runtime.ps1) | 构建可独立运行的本地 Harness 运行时 |
| [`scripts/build_desktop.ps1`](../../scripts/build_desktop.ps1) | 构建 Windows 安装包 |
| [`scripts/build_update_assets.ps1`](../../scripts/build_update_assets.ps1) | 生成插件/客户端归档、安装包分片、更新清单和校验文件 |

## 产品行为

- 集体合作模式识别任务类型和复杂度，对可用路由排序，拆解复杂任务，并展示任务分配、预估费用、阶段报告和已观察到的失败回退。
- 单独会话模式保留用户明确选择的 Harness 模型，可在同一会话中继续直接追问。
- 当前实际 provider 与模型控制 GAL 立绘、名牌和强调色；新会话相当于存档，历史内容通过日志查看。
- AI 回复复用 Harness `MarkdownText`，支持 Markdown、代码、表格、链接和 KaTeX；玩家输入保持纯文本。
- 图片使用原生多模态通道；文本类文件会提取到请求中，二进制文档的解析状态保持可见。
- persona 只改变最终表达，不能改变路由、拆题、工具、权限、代码、公式、引用或证据。
- OpenCode Zen 路由从 provider 目录发现；误填的官方网页地址会修复为目录拥有的 API 端点，自定义网关不受影响。

## 路由模型

对于问题 `x`、任务类型 `t`、复杂度档位 `c` 和候选模型 `m`，可审计的综合效用分为：

```text
U(m | x) = wq(c) Qm + wc(c) Cm + wl(c) (1 - Lm)
           + 0.12 (1 - wr(c)) Sm,t - wr(c) Rm
```

各项分别表示基准派生质量、归一化价格、延迟、任务专长匹配度和执行风险。简单问题偏向成本和延迟，均衡问题权衡质量与成本，复杂问题强调质量与专长。复杂任务会形成分阶段调用，并优先使用 DeepSeek V4 Pro 汇总；不可用时按候选排序回退。界面展示评分输入和实际执行记录，不展示模型私有思维链。

## 安装与更新

将插件目录安装到原版 Harness Web profile：

```text
dsh plugin --profile web add <repository-path>/plugins/model-router-galgame
```

桌面客户端和独立插件包通过[最新 Model Router + GALGame Release](https://github.com/ljwei-stak/deepseek-harness/releases/latest)发布。统一更新操作会同时检查两类产品：

- 桌面客户端过期时更新完整客户端，安装包中已经包含匹配版本的插件。
- 客户端为最新版但插件过期时，只更新插件。
- 仍保留“仅更新插件”和“仅更新完整客户端”入口。

插件更新会在启用前核验版本兼容性、归档结构和 SHA256。完整客户端更新支持安装包分片续传，完成后重建安装包、核验 SHA256，然后才启动原生安装程序。provider 设置、API Key、会话和回退版本都保留在用户数据目录中。

## 来源与许可证

GAL 交互方式参考 [`Ayase34/gal-view`](https://github.com/Ayase34/gal-view)。模型娘形象与设定方向注明来源于 [Bilibili 用户 4168597](https://space.bilibili.com/4168597)。本扩展不宣称与相关项目或创作者存在官方合作。人物图片和包含人物图片的截图不会自动继承仓库 MIT 许可证；商业使用或再分发前应核对原始条款并取得必要授权。

上游项目：[`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)。本 fork 扩展由个人独立维护，不代表 DeepSeek AI 官方发行版。
