# Model Router + GALGame 0.4.13 安装与下载说明

本 Release 提供 Windows、Debian/Ubuntu 和 Fedora/RHEL/openEuler 安装包。安装包包含 DeepSeek Harness 运行时、Web 客户端、Model Router + GALGame 插件、独立插件市场和本地运行所需的 Node.js/pnpm。

## 1. 下载

请从 [Release 0.4.13](https://github.com/ljwei-stak/deepseek-harness/releases/tag/model-router-galgame-0.4.13) 下载与你的系统匹配的文件：

| 系统 | 文件 |
| --- | --- |
| Windows 10/11 x64 | [DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.13-Windows-x64.exe](https://github.com/ljwei-stak/deepseek-harness/releases/download/model-router-galgame-0.4.13/DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.13-Windows-x64.exe) |
| Debian/Ubuntu x64 | [DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-amd64.deb](https://github.com/ljwei-stak/deepseek-harness/releases/download/model-router-galgame-0.4.13/DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-amd64.deb) |
| Fedora/RHEL/openEuler x86_64 | [DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-x86_64.rpm](https://github.com/ljwei-stak/deepseek-harness/releases/download/model-router-galgame-0.4.13/DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-x86_64.rpm) |

Windows 的 `.part01` 至 `.part12` 是一键更新功能使用的分片文件。普通安装只需要下载完整的 `.exe`，不需要手动合并分片。

## 2. 校验下载文件

下载 [SHA256SUMS-0.4.13.txt](https://github.com/ljwei-stak/deepseek-harness/releases/download/model-router-galgame-0.4.13/SHA256SUMS-0.4.13.txt)，在文件所在目录执行：

```powershell
Get-FileHash .\DeepSeek-Harness-ModelRouter-GALGame-Setup-0.4.13-Windows-x64.exe -Algorithm SHA256
```

```bash
sha256sum DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-amd64.deb
sha256sum DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-x86_64.rpm
```

应匹配以下摘要：

```text
Windows f57c87af77d45a64ec87560c18e1f345e49fd8b2ce6ee01c993f63301ab6a2df
DEB     ed68e70d353ea0939c966c31638962b77bd37e5c6bcc09ecafbcfc0da24f9522
RPM     fc9b4eb9fab077281f7dd202d068ad5113649be9b29eea8dff3f58d0136ce7d6
```

## 3. 安装

### Windows

双击 `.exe` 安装程序，按向导选择安装目录。安装程序会创建桌面和开始菜单快捷方式。安装完成后从快捷方式启动 DeepSeek Harness。

### Debian/Ubuntu

在下载目录执行：

```bash
sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-amd64.deb
```

### Fedora/RHEL/openEuler

在下载目录执行：

```bash
sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.4.13-Linux-x86_64.rpm
```

安装完成后可以从应用菜单启动，也可以运行 `deepseek-harness`。

## 4. 首次启动

1. 选择“服务器端”连接已有的远程 Harness，或选择“本地”使用安装包内置运行时。
2. 在模型设置中填写自己的模型服务地址、模型名称和 API Key。API Key 只保存在本机用户数据目录，不要写入插件目录或提交到 Git。
3. 先用一个简单问题测试模型连接，再开始正式任务。
4. “集体合作”会自动分析复杂度、拆分任务并分配模型；“单独会话”允许在模型选择器中指定一个模型。

## 5. 更新与卸载

桌面端的一键更新会检查插件和完整客户端版本。Windows 更新时请先关闭正在运行的应用；Linux 更新时下载新版本 DEB/RPM 后，使用同样的 `apt install` 或 `dnf install` 命令覆盖安装。

卸载前请保留用户数据目录，以保留模型设置、价格数据、历史任务和存档。只删除应用程序不会自动清除这些数据。

## 6. 常见问题

- **应用无法启动：** 确认下载的是当前系统架构的安装包，并重新校验 SHA256；Windows 不要运行 `.part` 分片文件。
- **登录或对话不可用：** 先确认已选择服务器端或本地模式，再检查 Harness 地址、模型名称和 API Key。
- **集体合作没有选出模型：** 在模型设置中启用至少一个 provider，并填写该模型的输入/输出价格。
- **实时 LiveBench 不可用：** 路由器会保留最近快照或实验基线，并在路由摘要中标记“未完成联网核验”；这不会阻止手动配置模型完成任务。

完整的原生插件安装、路由配置和故障排查请参阅[桌面与插件安装指南](https://github.com/ljwei-stak/deepseek-harness/blob/master/docs/cookbook/model-router-galgame-installation.zh.md)。
