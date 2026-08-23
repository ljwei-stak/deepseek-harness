# DSH Web UI theme and wallpaper center

English | [中文](README.zh.md)

This is a standalone DeepSeek Harness Web plugin that remains independent from Model Router + GALGame and `dsh-market`. Its design follows the theme-loader and skin-asset separation used by [`zhu1090093659/dsh-web-ui`](https://github.com/zhu1090093659/dsh-web-ui), without copying upstream code or modifying Harness source files.

## Features

- Four built-in themes: midnight blue, sakura, emerald, and paper, registered through Harness `theme.register()` and native theme tokens.
- Built-in wallpapers: aurora, night grid, paper, and solid color; switching does not change session data or model settings.
- Local `png`, `jpg`, `webp`, and `gif` wallpaper selection.
- `https://` image URLs as wallpapers; the plugin does not download, upload, or forward image contents.
- Wallpaper opacity, blur, and foreground-mask controls stored in the current browser's `localStorage`.
- Reset clears only this plugin's settings and leaves the native theme, Model Router, and `dsh-market` unchanged.

## Installation

From the DeepSeek Harness source directory, run:

```powershell
pnpm dsh plugin --profile web add ./plugins/dsh-web-ui-theme-wallpaper
```

Restart the Web profile and open Settings -> Theme and wallpaper. If an older Host does not expose the `theme` service, the plugin remains silent and does not block the native interface.

## Copyright and privacy

The plugin code is licensed under MIT. Imported images remain in the current browser's local storage and are not uploaded to the project, server, or plugin market. Check the copyright and redistribution terms before using third-party images.
