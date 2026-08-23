# Agent Note: Fork 专属文档目录

Status: implemented

[English](2026-08-23-fork-owned-document-layout.md) | 中文

## Problem

将 fork 专属指南和研究补充放在上游通用文档路径中，后续 sync fork 时可能与上游新增的同路径文件重叠。

## Decision

`ljwei-stak/deepseek-harness` 新增的文档统一放在 `docs/integrations/ljwei-stak/` 下，并按集成项目或功能建立子目录。该目录自带索引和放置规则。已有的目录外文档作为兼容入口保留，避免已发布链接失效；后续 fork 专属内容不再放入这些路径。

## Alternatives considered

**继续把文件添加到 `docs/cookbook/` 和 `docs/` 根目录。** 目录结构熟悉，但同步 fork 时更容易发生文件级冲突。

**立即迁移全部历史文档。** 这样可以减少位置数量，但会破坏已发布链接，并产生与当前任务无关的大规模迁移差异。

## Consequences

fork 获得了稳定且唯一的新增文档归属边界。新增集成目录时需要同步更新本地文档清单，并在链接退役前保留兼容入口。该边界只约束文档位置，不改变源码路径、包名或构建规则。
