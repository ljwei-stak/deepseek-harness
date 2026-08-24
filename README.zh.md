# DeepSeek Harness

[English](README.md) | 中文

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它采用**一切皆插件**的架构，并由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper)。

## 开发者预览

DeepSeek Harness 目前处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

<a id="run"></a>

## 运行

### 通过 `npm` 运行

安装 `Node.js`，然后运行：

```sh
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI，本机启动时还会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

## 桌面客户端

`ljwei-stak` 发行版包含 Model Router + GALGame 插件、独立插件市场以及内置本地运行时。请从 [GitHub Release 发布页](https://github.com/ljwei-stak/deepseek-harness/releases/latest) 下载最新版安装包：

- [Windows x64 安装包](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-Setup-0.5.1-Windows-x64.exe)
- [Debian/Ubuntu `.deb` 安装包](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-amd64.deb)
- [Fedora/RHEL/openEuler `.rpm` 安装包](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-x86_64.rpm)
- [SHA256 校验文件](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/SHA256SUMS-0.5.1.txt)

Windows 用户可以直接运行安装程序。Debian 系统可以使用 `sudo apt install ./<package>.deb` 安装；Fedora 系统可以使用 `sudo dnf install ./<package>.rpm` 安装。安装后，在桌面客户端中选择服务器端或本地运行。本地模式使用安装包内置的 Node.js 与 pnpm，不需要另外安装系统 Node.js。升级时，用户设置、模型凭据和任务历史会保留在用户数据目录中。

Release 同时包含桌面端一键更新控件所需的插件压缩包和更新清单。插件独立安装与故障排查请参阅[桌面安装指南](docs/cookbook/model-router-galgame-installation.zh.md)。

## 社区与支持

- 欢迎通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群：扫码添加企微小助手并填写入群问卷，完成后小助手会邀请你入群。

<table>
  <thead>
    <tr>
      <th align="center">企微小助手</th>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-assistant.png" alt="DeepSeek Harness 企微小助手二维码" width="180" height="180"></td>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
