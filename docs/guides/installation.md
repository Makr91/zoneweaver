---
title: Installation
layout: default
nav_order: 2
parent: Guides
permalink: /docs/guides/installation/
---

# Installation

{: .no_toc }

This guide covers different methods for installing and deploying Zoneweaver frontend in various environments.

## Table of contents

{: .no_toc .text-delta }

1. TOC
   {:toc}

---

## System Requirements

### Minimum Requirements

- **Operating System**: OmniOS, Linux, or other Unix-like system
- **Node.js**: Version 18 or higher
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Storage**: 1GB available disk space
- **Network**: Internet access for package downloads

### Recommended Production Environment

- **CPU**: 2+ cores
- **Memory**: 2GB+ RAM
- **Storage**: 5GB+ available space (for logs and database)
- **Network**: Dedicated network interface
- **SSL**: Valid SSL certificates for HTTPS

## Installation Methods

### Option 1: Package Installation (Recommended)

For OmniOS systems, use the official package:

```bash
# Update package repository
pkg refresh

# Install Zoneweaver package
pkg install zoneweaver

# Enable and start service
svcadm enable zoneweaver

# Check service status
svcs zoneweaver
```

Package installation includes:

- Zoneweaver application files
- Configuration templates
- SMF service manifest
- Automatic dependency handling

### Option 2: From Source

For development or custom deployments:

```bash
# Clone repository
git clone https://github.com/Makr91/zoneweaver.git
cd zoneweaver

# Install backend dependencies
npm install

# Install frontend dependencies
cd web
npm install
cd ..

# Build frontend
npm run build

# Configure application
cp packaging/config/production-config.yaml config/config.yaml
# Edit config.yaml as needed

# Start application
npm start
```

### Option 3: Development Setup

For development and testing:

```bash
# Clone repository
git clone https://github.com/Makr91/zoneweaver.git
cd zoneweaver

# Install all dependencies
npm install
cd web && npm install && cd ..

# Start in development mode (with auto-reload)
npm run dev
```

Development mode features:

- Auto-restart on file changes
- Detailed error logging
- Hot reload for frontend changes

## Configuration

### Configuration File Location

**Package Installation:**

```bash
/etc/zoneweaver/config.yaml
```

**Source Installation:**

```bash
./config/config.yaml
```

### Basic Configuration

```yaml
# Basic server settings
server:
  hostname: localhost
  port: 3443
  ssl:
    enabled: true
    generate_ssl: true # Auto-generate for testing
    key: /etc/zoneweaver/ssl/key.pem
    cert: /etc/zoneweaver/ssl/cert.pem

# Application settings
app:
  name: Zoneweaver
  version: 0.0.15
  frontend_url: https://localhost:3443

# Database location
database:
  path: /var/lib/zoneweaver/database/zoneweaver.db

# Security settings
security:
  jwt_secret: 'CHANGE-THIS-TO-A-SECURE-RANDOM-STRING'
  bcrypt_rounds: 10
  sessionTimeout: 24
  allow_new_organizations: true # Disable after setup
```

### SSL Certificate Setup

#### Auto-Generated Certificates (Development)

For testing and development:

```yaml
server:
  ssl:
    enabled: true
    generate_ssl: true # Zoneweaver generates self-signed cert
```

#### Production Certificates

For production deployments:

```yaml
server:
  ssl:
    enabled: true
    generate_ssl: false
    key: /etc/ssl/private/zoneweaver.key
    cert: /etc/ssl/certs/zoneweaver.crt
```

Generate certificates:

```bash
# Create certificate directory
mkdir -p /etc/ssl/zoneweaver

# Generate private key
openssl genrsa -out /etc/ssl/zoneweaver/zoneweaver.key 2048

# Generate certificate signing request
openssl req -new -key /etc/ssl/zoneweaver/zoneweaver.key \
  -out /etc/ssl/zoneweaver/zoneweaver.csr

# Get certificate from your CA or generate self-signed:
openssl x509 -req -days 365 \
  -in /etc/ssl/zoneweaver/zoneweaver.csr \
  -signkey /etc/ssl/zoneweaver/zoneweaver.key \
  -out /etc/ssl/zoneweaver/zoneweaver.crt

# Set permissions
chmod 600 /etc/ssl/zoneweaver/zoneweaver.key
chmod 644 /etc/ssl/zoneweaver/zoneweaver.crt
```

## Service Management

### OmniOS (SMF)

```bash
# Enable service
svcadm enable zoneweaver

# Disable service
svcadm disable zoneweaver

# Restart service
svcadm restart zoneweaver

# Check service status
svcs -xv zoneweaver

# View service logs
svcs -L zoneweaver
tail -f /var/svc/log/application-zoneweaver:default.log
```

### Linux (systemd)

Create service file `/etc/systemd/system/zoneweaver.service`:

```ini
[Unit]
Description=Zoneweaver Frontend
After=network.target

[Service]
Type=simple
User=zoneweaver
WorkingDirectory=/opt/zoneweaver
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Service management:

```bash
# Enable and start service
systemctl enable --now zoneweaver

# Check status
systemctl status zoneweaver

# View logs
journalctl -u zoneweaver -f
```

## Directory Structure

### Package Installation

```
/opt/zoneweaver/              # Application files
/etc/zoneweaver/              # Configuration
/var/lib/zoneweaver/          # Database and data
/var/log/zoneweaver/          # Log files
/var/run/zoneweaver/          # Runtime files
```

### Source Installation

```
./                            # Application root
./config/                     # Configuration files
./web/dist/                   # Built frontend files
./logs/                       # Log files (if configured)
./database/                   # Database files
```

## Database Setup

Zoneweaver uses SQLite for user/organization data:

### Automatic Setup

Database is created automatically on first run with:

- User tables
- Organization tables
- Server configuration tables
- Session management tables

### Manual Database Initialization

If needed, initialize database manually:

```bash
# Navigate to application directory
cd /opt/zoneweaver

# Initialize database
node -e "
const Database = require('./models/Database.js');
Database.init().then(() => console.log('Database initialized'));
"
```

## Firewall Configuration

### OmniOS (ipfilter)

```bash
# Edit /etc/ipf/ipf.conf
echo "pass in quick proto tcp from any to any port = 3443" >> /etc/ipf/ipf.conf

# Reload firewall rules
ipf -Fa -f /etc/ipf/ipf.conf
```

### Linux (iptables)

```bash
# Allow HTTPS traffic
iptables -A INPUT -p tcp --dport 3443 -j ACCEPT

# Save rules (varies by distribution)
iptables-save > /etc/iptables/rules.v4
```

### Linux (firewalld)

```bash
# Open port for Zoneweaver
firewall-cmd --permanent --add-port=3443/tcp
firewall-cmd --reload
```

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name zoneweaver.example.com;

    ssl_certificate /etc/ssl/certs/zoneweaver.crt;
    ssl_certificate_key /etc/ssl/private/zoneweaver.key;

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

### Apache

```apache
<VirtualHost *:443>
    ServerName zoneweaver.example.com

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/zoneweaver.crt
    SSLCertificateKeyFile /etc/ssl/private/zoneweaver.key

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / https://127.0.0.1:3443/
    ProxyPassReverse / https://127.0.0.1:3443/
</VirtualHost>
```

## Post-Installation

### First Access

1. **Navigate** to `https://your-server:3443`
2. **Create Organization** (if enabled)
3. **Register Admin User**
4. **Configure Settings**
5. **Add Zoneweaver API Servers**

### Security Hardening

1. **Disable Organization Creation**:

   ```yaml
   security:
     allow_new_organizations: false
   ```

2. **Strong JWT Secret**:

   ```bash
   # Generate secure random string
   openssl rand -hex 32
   ```

3. **Regular Updates**:

   ```bash
   # Package installation
   pkg update zoneweaver

   # Source installation
   git pull origin main
   npm install
   npm run build
   ```

## Troubleshooting

### Installation Issues

**Package Not Found**

```bash
# Update package repository
pkg refresh
pkg search zoneweaver
```

**Node.js Version Issues**

```bash
# Check Node.js version
node --version

# Update Node.js if needed
pkg install nodejs-18
```

**Permission Denied**

```bash
# Fix file permissions
chown -R zoneweaver:zoneweaver /opt/zoneweaver
chmod +x /opt/zoneweaver/index.js
```

### Service Issues

**Service Won't Start**

```bash
# Check service status and logs
svcs -xv zoneweaver
tail -f /var/svc/log/application-zoneweaver:default.log
```

**Port Already in Use**

```bash
# Find process using port 3443
lsof -i :3443
netstat -tulpn | grep 3443
```

**SSL Certificate Errors**

```bash
# Verify certificate files exist and have correct permissions
ls -la /etc/zoneweaver/ssl/
```

---

Next: [Authentication](authentication/) - Set up user management
