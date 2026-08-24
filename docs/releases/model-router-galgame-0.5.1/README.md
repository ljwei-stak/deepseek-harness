# Model Router + GALGame 0.5.1

This release provides complete desktop installers for Windows x64, Debian/Ubuntu x64, and Fedora/RHEL/openEuler x86_64. The installers include the DeepSeek Harness runtime, the Model Router + GALGame plugin, the independent plugin market, the dsh-web-ui suite, and the platform-native Node.js and pnpm runtimes required by local mode.

## Install

- Windows 10/11 x64: run the `.exe` installer and choose a writable installation directory.
- Debian/Ubuntu: run `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-amd64.deb`.
- Fedora/RHEL/openEuler: run `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-x86_64.rpm`.

After launch, select **Server** to connect to an existing Harness service or **Local** to use the bundled runtime. The first local launch may take several minutes while the runtime and profile seed are prepared. Existing settings, credentials, and task history stay in the user data directory during upgrades.

## Verification

Download `SHA256SUMS-0.5.1.txt` and verify the three complete installers before installation. This release does not require installer parts; the updater manifest uses an empty `desktop.parts` list and downloads the complete Windows installer when a desktop update is selected.

The Model Router plugin can still be updated independently from the desktop client. The dsh-web-ui adapter is bundled in both the Web profile and desktop runtime, so the settings, theme, wallpaper, task board, plugin manager, skill explorer, archive manager, and related dsh-web-ui features are available in both modes.
