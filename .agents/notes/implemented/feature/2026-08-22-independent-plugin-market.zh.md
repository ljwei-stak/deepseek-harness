# Agent Note: 独立插件市场

Status: implemented

[English](2026-08-22-independent-plugin-market.md) | 中文

## Problem

桌面客户端需要一个可以发现插件的市场，以及能在全新 Windows 安装环境运行的包管理器。把市场当成 Model Router 的功能会耦合两个无关插件的版本、文档、更新和故障状态。

## Decision

`plugins/dsh-market` 是独立的 `dshmarket@1.18.0` 运行时快照，来源提交为 `b9323cc85d0148013384a5aca5215be1922eea36`。它保留上游包身份、Host 入口、Web bundle、生产依赖、peer 要求和 profile 补丁；本地清单删除上游仅供开发的脚本，并记录来源产物与完整性值。

仓库在 `plugins/dsh-market` 保存可审查快照，并在根运行时依赖闭包固定安装对应的 registry 包。桌面 Web profile 在 `model-router-galgame` 旁边使用独立补丁行插入 `dshmarket`，两个包互不导入。运行时组装会实体化仅存在于仓库的 Model Router 包、保留 dshmarket 的 pnpm 依赖闭包，并检查两个包必需的 Host 与 Web 文件。

桌面端 `0.4.11` 携带 Node.js、`pnpm@11.7.0` 与位于继承 `PATH` 之前的启动器，因此市场操作不需要系统 Node 工具链。社区依赖和市场状态仍保存在用户自己的 Web profile 中。Model Router 保持 `0.4.10`，其独立更新器不会替换市场包。

[安装教程](../../../../docs/cookbook/dsh-market-installation.zh.md)负责原生与桌面操作步骤。市场目录提供发现信息，用户仍需自行审查可执行第三方程序包。

## Alternatives considered

**只说明如何安装 registry 包，不在仓库提供插件目录。** 这种方式可以减小源码树，但不能提供与桌面测试对应、可单独审查和归档的插件产物。

**把市场功能加入 Model Router + GALGame。** 这种方式少一个 profile 行，却会强制路由与市场修改使用同一版本和更新包，使市场故障可能影响无关的对话插件。

**把市场目录复制到客户端。** 上游插件已经把市场应用与精选 registry 分离；复制的目录会过期，并使 registry 刷新依赖桌面发布。

## Consequences

原生 Harness 用户可以在不安装 Model Router 的情况下安装、删除或更新市场。桌面用户通过同一安装包获得两个插件，但它们的运行时身份、源码目录、设置和更新归属保持独立。本地快照会增加仓库体积，并要求每次上游刷新同步更新源码、构建文件、来源记录、锁数据、测试和声明。便携 pnpm 会增加安装包体积。市场安装的代码会扩展可信计算基，因此必须由用户明确审查。
