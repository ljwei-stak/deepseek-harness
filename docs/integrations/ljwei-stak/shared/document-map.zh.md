# Fork 文档清单

[English](document-map.md) | 中文

本页是 fork 专属文档的唯一索引。它本身位于 fork 专属目录，因此更新上游仓库时不需要修改上游索引文件。

## 集成项目

- [`dsh-web-ui-adapter`](../../dsh-web-ui-adapter/README.zh.md)：固定的 `ljwei-stak/dsh-web-ui` 快照、依赖脚本审核和桌面运行时物化说明。
- [`model-router-galgame/`](../model-router-galgame/README.zh.md)：预留给 Model Router + GALGame 的新增文档。
- [`dsh-market/`](../dsh-market/README.zh.md)：预留给独立插件市场的新增文档。

## 放置规则

- 新增的 fork 专属文档必须放在本目录下，并继续按功能放入独立子目录。
- 发布说明应在文件名中包含 release tag，或放入带版本的 `releases/` 子目录。
- 研究材料的生成图片和脚本应靠近所属集成项目，源码仍放在插件或脚本的归属目录。
- 目录外的既有链接作为兼容入口保留，不为了迁移内容而单独修改。
