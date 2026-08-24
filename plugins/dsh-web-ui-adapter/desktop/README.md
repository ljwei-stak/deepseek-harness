# Desktop Runtime Adapter

This directory owns the desktop-only integration for the bundled `dsh-web-ui`
suite. It keeps the profile bundle list, package closure, and the duplicate
market browser-face compatibility rule outside the upstream Harness files.

The Electron launcher calls this adapter before starting the local Web profile.
The same local runtime is used by the Windows, Debian, and RPM packages, so the
desktop applications expose the same dsh-web-ui settings, plugin market,
agent presets, skin center, task board, and related panels.
