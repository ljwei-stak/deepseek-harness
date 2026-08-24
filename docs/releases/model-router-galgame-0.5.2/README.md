# Model Router + GALGame 0.5.2

This release fixes local startup for profiles created by 0.5.1. The desktop launcher now verifies and repairs the complete dependency closure of every dsh-web-ui package, including the `schemastery` dependency used by the workshop module.

## Install

- Windows 10/11 x64: run the `.exe` installer and choose a writable installation directory.
- Debian/Ubuntu: run `sudo apt install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.2-Linux-amd64.deb`.
- Fedora/RHEL/openEuler: run `sudo dnf install ./DeepSeek-Harness-ModelRouter-GALGame-0.5.2-Linux-x86_64.rpm`.

After launch, select **Server** to connect to an existing Harness service or **Local** to use the bundled runtime. Existing settings, credentials, and task history remain in the user data directory during the upgrade.

## Verification

Download `SHA256SUMS-0.5.2.txt` and verify the three complete installers before installation. This release does not use installer parts; the updater manifest has an empty `desktop.parts` list and downloads the complete Windows installer.

The Model Router plugin, independent plugin market, and complete dsh-web-ui suite are included in both the Web profile and desktop runtime.
