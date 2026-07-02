---
title: Installation
layout: default
nav_order: 2
parent: Guides
permalink: /guides/installation/
---

# Installation

{: .no_toc }

How to install and deploy Hyperweaver Server. The Server ships as a Debian `.deb`; the web UI is consumed as the versioned [Hyperweaver UI](https://github.com/MarkProminic/hyperweaver-ui) artifact (it is not built here).

## Table of contents

{: .no_toc .text-delta }

1. TOC
   {:toc}

---

## System Requirements

- **Operating System**: Debian / Ubuntu (x86_64)
- **Node.js**: Version 22 or higher
- **Memory**: 512 MB RAM minimum, 1 GB+ recommended
- **Storage**: 1 GB+ available (logs + SQLite database)
- **SSL**: Valid certificates for HTTPS in production

## Installation Methods

### Option 1: Debian Package (Recommended)

```bash
# From a downloaded release asset
sudo apt install ./hyperweaver-server_<version>_amd64.deb

# Or, once the STARTcloud apt repository is configured:
sudo apt update
sudo apt install hyperweaver-server

sudo systemctl enable --now hyperweaver-server
systemctl status hyperweaver-server
```

The package installs the app to `/opt/hyperweaver-server`, config to `/etc/hyperweaver-server`, a systemd unit, and auto-generates a JWT secret plus self-signed SSL certificates on first start.

### Option 2: From Source

```bash
git clone https://github.com/Makr91/hyperweaver-server.git
cd hyperweaver-server
npm ci

# Fetch the pinned Hyperweaver UI artifact into ./ui
UI_VERSION=$(node -p "require('./package.json').hyperweaverUiVersion")
mkdir -p ui
curl -fsSL "https://github.com/MarkProminic/hyperweaver-ui/releases/download/v${UI_VERSION}/hyperweaver-ui-${UI_VERSION}.tar.gz" | tar -xz -C ui

cp packaging/config/production-config.yaml config.yaml   # then edit as needed
npm start
```

For development, use `npm run dev` (nodemon; serves the UI from `./ui` and reloads on changes).

## Configuration

Configuration file location:

- **Package install**: `/etc/hyperweaver-server/config.yaml`
- **Source install**: `./config.yaml`

See the [Configuration Reference](../configuration/) for all options. The minimum useful settings are the server port/SSL, `authentication.jwt_secret`, and `database.storage`.

### SSL Certificates

By default the Server auto-generates self-signed certificates (`server.ssl_generate: true`). For production, point `server.ssl_key_path` / `server.ssl_cert_path` at real certificates and set `server.ssl_generate: false`.

## Service Management (systemd)

```bash
sudo systemctl enable --now hyperweaver-server   # enable + start
sudo systemctl restart hyperweaver-server
sudo systemctl status hyperweaver-server
journalctl -u hyperweaver-server -f              # follow logs
```

## Directory Structure

```text
/opt/hyperweaver-server/      # application files + fetched ui/
/etc/hyperweaver-server/      # config.yaml, ssl/, .jwt-secret
/var/lib/hyperweaver-server/  # SQLite database
/var/log/hyperweaver-server/  # log files
```

## Firewall

```bash
# Debian/Ubuntu (ufw)
sudo ufw allow 3443/tcp

# firewalld
sudo firewall-cmd --permanent --add-port=3443/tcp
sudo firewall-cmd --reload
```

## Reverse Proxy (optional)

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name hyperweaver.example.com;

    ssl_certificate /etc/ssl/certs/hyperweaver-server.crt;
    ssl_certificate_key /etc/ssl/private/hyperweaver-server.key;

    location / {
        proxy_pass https://127.0.0.1:3443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

When running behind a proxy, set `frontend.trust_proxy` in the config to the number of proxies in front of the Server.

## Post-Installation

1. Open `https://your-server:3443` and register the first (super-admin) user
2. Harden: set `authentication.local_allow_new_organizations: false` after setup, and use a strong `jwt_secret`
3. Add your Zoneweaver Agent(s) — see [Backend Integration](backend-integration/)

### Updates

```bash
sudo apt update && sudo apt install --only-upgrade hyperweaver-server
```

## Troubleshooting

### Service won't start

```bash
systemctl status hyperweaver-server
journalctl -u hyperweaver-server -e
```

### Port already in use

```bash
sudo lsof -i :3443
```

**SSL certificate errors** — verify the files exist and are readable:

```bash
ls -la /etc/hyperweaver-server/ssl/
```

---

Next: [Authentication](authentication/) — set up user management
