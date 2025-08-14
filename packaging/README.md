# Building ZoneWeaver Debian Packages

Production-ready Debian package build process with automated CI/CD via Release Please.

## Prerequisites

```bash
sudo apt update
sudo apt install nodejs npm dpkg-dev gdebi-core
```

## Quick Build Commands

### 1. Prepare Application
```bash

# Clean any existing build artifacts

# Check Check and Sync Frontend and Backend Versions
npm run sync-versions

# Install dependencies
npm ci
cd web && npm ci && cd ..

# Build frontend (this automatically syncs versions)
npm run build

# Install production dependencies only
npm ci --omit=dev
```

### 2. Create Package Structure
```bash
# Extract version from package.json
export VERSION=$(node -p "require('./package.json').version")
export PACKAGE_NAME="zoneweaver"
export ARCH="amd64"

# Create directory structure
mkdir -p "${PACKAGE_NAME}_${VERSION}_${ARCH}"/{opt/zoneweaver,etc/zoneweaver,etc/systemd/system,var/lib/zoneweaver,var/log/zoneweaver,DEBIAN}
```

### 3. Copy Application Files
```bash
# Application files to /opt/zoneweaver (IMPORTANT: include utils and scripts!)
cp -r controllers models routes middleware config utils scripts index.js package.json "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"
cp -r node_modules "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"
cp -r web/dist "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/web/dist"

# Configuration files
cp packaging/config/production-config.yaml "${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/zoneweaver/config.yaml"

# Systemd service (with privileged port capabilities)
cp packaging/systemd/zoneweaver.service "${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/systemd/system/"

# DEBIAN control files
cp packaging/DEBIAN/postinst packaging/DEBIAN/prerm packaging/DEBIAN/postrm "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/"
```

### 4. Generate Control File
```bash
# Create control file with dynamic version
cat > "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/control" << EOF
Package: zoneweaver
Version: ${VERSION}
Section: misc
Priority: optional
Architecture: ${ARCH}
Maintainer: Makr91 <makr91@users.noreply.github.com>
Depends: nodejs (>= 18.0.0), sqlite3, openssl
Description: ZoneWeaver - Zone Hypervisor Management Interface
 Web-based management interface for Zoneweaver API hypervisors.
 Provides intuitive control over zones, networking, and storage
 through a modern React frontend and Node.js API backend.
Homepage: https://github.com/Makr91/zoneweaver
EOF
```

### 5. Set Permissions
```bash
# Set proper permissions
find "${PACKAGE_NAME}_${VERSION}_${ARCH}" -type d -exec chmod 755 {} \;
find "${PACKAGE_NAME}_${VERSION}_${ARCH}" -type f -exec chmod 644 {} \;
chmod 755 "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN"/{postinst,prerm,postrm}
```

### 6. Build & Install Package
```bash
# Build .deb package
dpkg-deb --build "${PACKAGE_NAME}_${VERSION}_${ARCH}" "${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"

# Install package
sudo gdebi -n "${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"

# Start service
sudo systemctl enable --now zoneweaver

# Check status
sudo systemctl status zoneweaver
```

## Critical Build Notes

### ⚠️ Required Directories
**Must include these directories in the copy command or the package will fail:**
- `utils/` - Contains config loading utilities
- `scripts/` - Contains version synchronization tools
- `web/dist/` - Must build frontend first with `npm run build`

### ✅ Single Source of Truth Versioning
**Root `package.json` is the ONLY place to change version numbers.**

The `npm run sync-versions` script automatically synchronizes the version to:
- ✅ `web/package.json` - Frontend package version
- ✅ `config/swagger.js` - API documentation version  
- ✅ `config.yaml` - Application config version
- ✅ `packaging/config/production-config.yaml` - Production config version
- ✅ `.release-please-manifest.json` - Release automation tracking
- ✅ Vite build process - Injects version into frontend via `__APP_VERSION__`

**To change version:** Only edit the `version` field in root `package.json`, then run `npm run sync-versions`

### 🔧 Systemd Service
The service includes:
- **Privileged port capabilities** (`CAP_NET_BIND_SERVICE`) for ports 80/443
- **Environment variables** (`CONFIG_PATH=/etc/zoneweaver/config.yaml`)
- **Security restrictions** (NoNewPrivileges, ProtectSystem, etc.)

## Automated CI/CD

### Release Please Integration
Every push to main triggers Release Please:
1. **Creates release PR** with version bumps and changelog
2. **Merges PR** → triggers package build
3. **Creates GitHub release** with `.deb` package attached
4. **Uses semantic versioning** based on conventional commits

### Manual Release Trigger
```bash
gh workflow run release-please.yml
```

## Package Information

- **Service User**: `zoneweaver` (created during installation)
- **Configuration**: `/etc/zoneweaver/config.yaml`
- **Data Directory**: `/var/lib/zoneweaver/`
- **Log Directory**: `/var/log/zoneweaver/`
- **SSL Certificates**: `/etc/zoneweaver/ssl/` (auto-generated)
- **JWT Secret**: `/etc/zoneweaver/.jwt-secret` (auto-generated)
- **Service**: `systemctl {start|stop|status|restart} zoneweaver`
- **Default Access**: `https://localhost:3443`

## Troubleshooting

### Common Build Errors
1. **Cannot find module '/opt/zoneweaver/utils/config.js'**
   - ❌ Missing `utils` in copy command
   - ✅ Fix: Add `utils` to the cp command

2. **Cannot stat 'web/dist'**
   - ❌ Frontend not built
   - ✅ Fix: Run `npm run build` before packaging

3. **Version shows as 1.0.0 in frontend**
   - ❌ Version sync issue
   - ✅ Fix: Run `npm run sync-versions` or rebuild

4. **Files served from wrong location (web/assets instead of web/dist/assets)**
   - ❌ Directory structure flattened during packaging
   - ✅ Fix: Use `cp -r web/dist "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/web/dist"` (not `/web/`)
   - 🔍 Verify: Check that `/opt/zoneweaver/web/dist/assets/` exists after installation

### Service Issues
```bash
# Check logs
sudo journalctl -fu zoneweaver

# Check config
sudo cat /etc/zoneweaver/config.yaml

# Restart service
sudo systemctl restart zoneweaver
```

### Uninstall
```bash
sudo systemctl stop zoneweaver

sudo apt remove zoneweaver

sudo apt autoremove

### Purge DB and Configs

sudo apt purge zoneweaver