# Fork 专属文档

[English](README.md) | 中文

本目录存放 `ljwei-stak/deepseek-harness` fork 自有的文档。将 fork 专属文件放在独立路径下，可以降低与 `deepseek-ai/deepseek-harness` 同步时发生文件级冲突的概率。

## 目录结构

| 目录 | 范围 |
| --- | --- |
| [`dsh-web-ui-adapter`](../dsh-web-ui-adapter/README.zh.md) | `dsh-web-ui` 完整套件的 vendoring 与桌面端适配说明。 |
| `model-router-galgame/` | Model Router + GALGame 的新增指南、实验记录、发布说明和论文补充。 |
| `dsh-market/` | 独立插件市场的新增指南与发布说明。 |
| `shared/` | fork 范围内通用的流程、兼容性说明和更新策略。 |

特性专属文档应放在子目录中，不要再把 fork 专属内容添加到上游的 `docs/cookbook/` 或仓库根目录文档。每个子目录可以包含自己的 `README.md`、`README.zh.md`、资源文件和按版本划分的发布说明。

## 现有兼容文档

部分较早的 fork 文档仍保留在原路径，以保证已有链接可用。这些文件是兼容入口，不是新文档的位置。后续修改应更新本目录中的归属文档，或者在本目录中新增带版本的文档并建立链接。

## sync fork 流程

1. 在 `docs/integrations/ljwei-stak/<feature>/` 下新增或修改文件。
2. 链接到源码和插件自己的说明，不要复制上游实现细节。
3. 提交前运行文档链接检查和换行检查。
4. sync fork 后只处理属于上游目录的冲突；fork 专属文件应继续保留在本目录。

当前的集成目录清单见 [`document-map.md`](shared/document-map.zh.md)。
