# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It uses an architecture where **everything is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper).

## Developer preview

DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Desktop client

The `ljwei-stak` distribution includes the Model Router + GALGame plugin, the independent plugin market, and a bundled local runtime. Download the latest installers from the [GitHub Release page](https://github.com/ljwei-stak/deepseek-harness/releases/latest):

- [Windows x64 installer](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-Setup-0.5.1-Windows-x64.exe)
- [Debian/Ubuntu `.deb`](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-amd64.deb)
- [Fedora/RHEL/openEuler `.rpm`](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/DeepSeek-Harness-ModelRouter-GALGame-0.5.1-Linux-x86_64.rpm)
- [SHA256 checksums](https://github.com/ljwei-stak/deepseek-harness/releases/latest/download/SHA256SUMS-0.5.1.txt)

Windows users can run the installer directly. Debian-family systems can install with `sudo apt install ./<package>.deb`; Fedora-family systems can install with `sudo dnf install ./<package>.rpm`. After installation, choose server mode or local mode in the desktop client. Local mode uses the bundled Node.js and pnpm runtime, so a system Node.js installation is not required. User settings, model credentials, and task history are kept in the user data directory when upgrading.

The release also contains the plugin archive and updater manifest used by the desktop client's one-click update control. See the [desktop installation guide](docs/cookbook/model-router-galgame-installation.md) for plugin-only installation and troubleshooting.

## Community and support

- Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
