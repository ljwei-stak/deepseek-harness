# Model Router + GALGame 0.5.2

本版本修复了 0.5.1 用户配置下本地服务无法启动的问题。桌面端现在会校验并修复每一个 dsh-web-ui 插件的完整依赖闭包，包括插件市场所需的 `schemastery` 依赖。

## 安装

- Windows 10/11 x64：运行 `.exe` 安装包并选择可写入的安装目录。
- Debian/Ubuntu：执行 `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.2-Linux-amd64.deb`。
- Fedora/RHEL/openEuler：执行 `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.2-Linux-x86_64.rpm`。

启动后选择“服务器端”连接已有 Harness 服务，或选择“本地运行”使用安装包内置运行时。升级过程中用户数据目录中的设置、凭据和历史任务会保留。

## 校验

请下载 `SHA256SUMS-0.5.2.txt`，安装前校验三个完整安装包。本版本不使用安装包分片，更新清单中的 `desktop.parts` 为空，桌面更新会直接下载完整 Windows 安装包。

Model Router、独立插件市场和完整 dsh-web-ui 套件均已包含在 Web profile 与桌面端运行时中。
