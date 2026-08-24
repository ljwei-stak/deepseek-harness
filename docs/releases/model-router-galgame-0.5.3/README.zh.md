# Model Router + GALGame 0.5.3

本维护版本修复了完整安装包更新路径，并将主题与壁纸插件的纯逻辑测试与 React 界面依赖分离。桌面端仍会自动修复旧版本遗留的不完整 dsh-web-ui 依赖目录。

## 安装

- Windows 10/11 x64：运行 `.exe` 安装包并选择可写入的安装目录。
- Debian/Ubuntu：执行 `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.3-Linux-amd64.deb`。
- Fedora/RHEL/openEuler：执行 `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.3-Linux-x86_64.rpm`。

启动后选择“服务器端”连接已有 Harness 服务，或选择“本地运行”使用安装包内置运行时。原有设置、凭据和历史任务会保留。

## 校验

请下载 `SHA256SUMS-0.5.3.txt`，安装前校验三个完整安装包。本版本不使用安装包分片，更新清单中的 `desktop.parts` 为空，更新器会直接下载并校验完整 Windows 安装包。
