# Model Router + GALGame 0.5.1

本 Release 提供 Windows x64、Debian/Ubuntu x64 和 Fedora/RHEL/openEuler x86_64 三种完整桌面安装包。安装包包含 DeepSeek Harness 运行时、Model Router + GALGame 插件、独立插件市场、完整 dsh-web-ui 套件，以及本地运行所需的平台原生 Node.js 与 pnpm。

## 安装

- Windows 10/11 x64：运行 `.exe` 安装包，并选择可写的安装目录。
- Debian/Ubuntu：执行 `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-amd64.deb`。
- Fedora/RHEL/openEuler：执行 `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-x86_64.rpm`。

启动后选择“服务器端”连接已有 Harness 服务，或选择“本地”使用安装包内置运行时。首次本地启动会准备运行时和预构建配置，可能需要几分钟。升级时，已有设置、凭据和任务历史会保存在用户数据目录中。

## 校验

请下载 `SHA256SUMS-0.5.1.txt`，在安装前校验三个完整安装包。本 Release 不需要安装包分片；更新清单中的 `desktop.parts` 为空，桌面更新会直接下载完整 Windows 安装包。

Model Router 插件仍可在桌面端单独更新。dsh-web-ui 适配层同时写入 Web profile 和桌面运行时，因此设置、主题、壁纸、任务栏、插件管理、Skill 浏览、归档管理等 dsh-web-ui 功能在网页端和桌面端均可使用。
