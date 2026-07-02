---
title: Getting Started
layout: default
nav_order: 1
parent: Guides
permalink: /guides/getting-started/
---

# Getting Started

{: .no_toc }

This guide walks you through setting up Hyperweaver Server for the first time, from installation to connecting your first Zoneweaver Agent.

## Table of contents

{: .no_toc .text-delta }

1. TOC
   {:toc}

---

## Prerequisites

- **Node.js 22+** — required to run the Server
- **A Zoneweaver Agent** — the host agent that actually manages the VMs (Bhyve/OmniOS)
- **Network access** — the Server must reach each agent's `host:port`
- **SSL certificates** (recommended) — for HTTPS

## Quick Start

### 1. Install

#### Option A: Debian package (recommended)

```bash
sudo apt install ./hyperweaver-server_<version>_amd64.deb
sudo systemctl enable --now hyperweaver-server
```

#### Option B: From source

```bash
git clone https://github.com/Makr91/hyperweaver-server.git
cd hyperweaver-server
npm install

# Fetch the pinned Hyperweaver UI artifact into ./ui
UI_VERSION=$(node -p "require('./package.json').hyperweaverUiVersion")
mkdir -p ui
curl -fsSL "https://github.com/MarkProminic/hyperweaver-ui/releases/download/v${UI_VERSION}/hyperweaver-ui-${UI_VERSION}.tar.gz" | tar -xz -C ui

npm start
```

### 2. Configure

Edit `/etc/hyperweaver-server/config.yaml` (package install) or `./config.yaml` (source). Key settings:

- `frontend.port` (default `3443`) and the `server.ssl_*` options
- `authentication.jwt_secret` (auto-generated on package install)
- `database.storage` (SQLite path)

### 3. First Access

1. Open `https://your-server:3443`
2. Register the first user (becomes super-admin) and organization
3. Log in

### 4. Add a Zoneweaver Agent

1. **Settings → Servers → Add Server**
2. Enter the agent's **hostname**, **port**, **protocol**, and **API key** (or let the Server bootstrap one)
3. **Test Connection**, then save

## Troubleshooting

**Can't reach the web interface** — check port 3443 is open, verify SSL cert validity, and run `systemctl status hyperweaver-server`.

**Agent connection fails** — test reachability (`curl -k https://agent-host:5001/`), verify the API key, and confirm the Zoneweaver Agent is running.

**Blank UI** — the `ui/` artifact wasn't fetched (source installs); re-run the fetch from step 1.

### Logs

- Service: `journalctl -u hyperweaver-server -f`
- Application logs: `/var/log/hyperweaver-server/`

## Next Steps

1. **[Authentication](authentication/)** — user management, OIDC, and LDAP
2. **[Backend Integration](backend-integration/)** — connecting Zoneweaver Agents in depth
3. **[Installation](installation/)** — production deployment

---

Need help? See the [Support](../support/) page or the [GitHub repository](https://github.com/Makr91/hyperweaver-server).
