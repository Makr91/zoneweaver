# Hyperweaver Server

Hyperweaver Server is the control-plane server for the Hyperweaver platform: it serves the [Hyperweaver UI](https://github.com/MarkProminic/hyperweaver-ui) and aggregates/proxies host agents (the Zoneweaver Agent for Bhyve/OmniOS) for user auth, monitoring, and browser-based console access.

## Platform Requirements

Debian/Ubuntu (the Server ships as a `.deb`):

```bash
# Build essentials for native dependencies (bcrypt)
sudo apt-get install build-essential

# Install dependencies
npm install
```

## Getting Started

The web UI is built and released separately as the [hyperweaver-ui](https://github.com/MarkProminic/hyperweaver-ui) artifact; this server serves it from `./ui`. The consumed version is pinned by `hyperweaverUiVersion` in `package.json`, and CI fetches it automatically when building packages.

For local development, fetch the pinned UI into `./ui` first:

```bash
UI_VERSION=$(node -p "require('./package.json').hyperweaverUiVersion")
mkdir -p ui
curl -fsSL "https://github.com/MarkProminic/hyperweaver-ui/releases/download/v${UI_VERSION}/hyperweaver-ui-${UI_VERSION}.tar.gz" | tar -xz -C ui
```

## Available Scripts

- `npm install` — install server dependencies
- `npm run dev` — run the server under nodemon (serves the UI from `./ui`, reloads on changes)
- `npm start` — run the server in production mode (`node index.js`)
- `npm run lint` / `npm run lint:fix` — lint the server code
- `npm run format` / `npm run format:check` — Prettier formatting
- `npm run generate-docs` — regenerate the OpenAPI documentation
- `npm run sync-versions` — sync the version into the swagger config, production config, and release-please manifest

## SSL Configuration

SSL Configuration is managed via `config.yaml`:

- Place SSL certificates in `./certs/` directory (private-key.pem, certificate.pem)
- SSL is enabled by default in config.yaml
- The app automatically falls back to HTTP if SSL certificates are not found
- HTTP requests are redirected to HTTPS when SSL is enabled
