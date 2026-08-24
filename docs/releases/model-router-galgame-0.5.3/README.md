# Model Router + GALGame 0.5.3

This maintenance release fixes the complete-installer update path and adds a clean dependency-free test boundary for the theme and wallpaper plugin. The desktop runtime still repairs incomplete dsh-web-ui dependency trees left by older installations.

## Install

- Windows 10/11 x64: run the `.exe` installer and choose a writable install directory.
- Debian/Ubuntu: run `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.3-Linux-amd64.deb`.
- Fedora/RHEL/openEuler: run `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.3-Linux-x86_64.rpm`.

After startup, choose the server workspace or local runtime. Existing settings, credentials, and saved tasks remain in the user data directory.

## Verification

Download `SHA256SUMS-0.5.3.txt` and verify all three complete installers before running one. This release does not use installer parts; the update manifest has an empty `desktop.parts` list and the updater downloads and verifies the complete Windows installer.
