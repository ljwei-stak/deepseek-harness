# DSH Web UI 主题与壁纸中心

[English](README.md) | 中文

这是一个与 Model Router + GALGame、dsh-market 相互独立的 DeepSeek Harness Web 插件。实现思路参考 [`zhu1090093659/dsh-web-ui`](https://github.com/zhu1090093659/dsh-web-ui) 的“主题加载器与皮肤资产分离”设计，但本插件只负责主题令牌和壁纸，不复制上游代码，也不修改 Harness 源码。

## 功能

- 预置四套主题：午夜蓝、樱花、翡翠和纸张；主题通过 Harness `theme.register()` 注册，使用原生主题令牌。
- 壁纸预置：极光、夜网格、纸张和纯色；切换不改变会话数据或模型设置。
- 从本机选择 `png/jpg/webp/gif` 等图片作为壁纸。
- 输入 `https://` 图片地址作为壁纸；插件不会下载、上传或转发图片内容。
- 调节壁纸透明度、模糊和前景遮罩，设置保存于当前浏览器的 `localStorage`。
- 重置时只清除本插件设置，不影响原生主题、Model Router 或 dsh-market。

## 安装

在 DeepSeek Harness 源码目录执行：

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-web-ui-theme-wallpaper
```

重启 Web profile 后，打开“设置 -> 主题与壁纸”。如果主机版本过旧而没有 `theme` 服务，插件会自动保持静默，不阻塞原生界面。

## 版权与隐私

插件代码使用 MIT 许可证。用户导入的图片只保存在当前浏览器的本地存储，不会上传到项目、服务器或插件市场。使用第三方图片时，请自行确认图片的版权和再分发许可。
