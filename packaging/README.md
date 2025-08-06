# Building ZoneWeaver Debian Packages

Based on real-world examples from flavienbwk/deb-package-tutorial and production workflows.

## Prerequisites

```bash
sudo apt update
sudo apt install nodejs npm dpkg-dev
```

**Note**: If you don't have a `package-lock.json` file, the commands below will use `npm install` instead of `npm ci`. For production builds, it's recommended to generate and commit a lockfile first:

```bash
# Generate lockfile (optional but recommended)
npm install
cd web && npm install && cd ..
```

## Quick Build Commands

### 1. Prepare Application
```bash
# Clean any existing build artifacts (important after config changes)
rm -rf web/dist web/.vite web/node_modules/.vite

# Install dependencies (use install if no package-lock.json exists)
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi

# Build frontend
cd web
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi
npm run build
cd ..

# Install production dependencies only
if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi
```

### 2. Create Package Structure
```bash
# Extract version from package.json
export VERSION=$(node -p "require('./package.json').version")
export PACKAGE_NAME="zoneweaver"
export ARCH="amd64"

# Create directory structure (following flavienbwk's pattern)
mkdir -p "${PACKAGE_NAME}_${VERSION}_${ARCH}"/{opt/zoneweaver,etc/zoneweaver,etc/systemd/system,var/lib/zoneweaver,var/log/zoneweaver,DEBIAN}
```

### 3. Copy Application Files
```bash
# Application files to /opt/zoneweaver
cp -r controllers models routes middleware config index.js package.json "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"
cp -r node_modules "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"
cp -r web/dist "${PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/web/"

# Configuration files
cp packaging/config/production-config.yaml "${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/zoneweaver/config.yaml"

# Systemd service
cp packaging/systemd/zoneweaver.service "${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/systemd/system/"

# DEBIAN control files
cp packaging/DEBIAN/postinst "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/"
cp packaging/DEBIAN/prerm "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/"
cp packaging/DEBIAN/postrm "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/"
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
 Web-based management interface for WebHyve zone hypervisors.
 Provides intuitive control over zones, networking, and storage
 through a modern React frontend and Node.js API backend.
Homepage: https://github.com/Makr91/zoneweaver
EOF
```

### 5. Set Permissions
```bash
# Set proper permissions (from tutorials)
find "${PACKAGE_NAME}_${VERSION}_${ARCH}" -type d -exec chmod 755 {} \;
find "${PACKAGE_NAME}_${VERSION}_${ARCH}" -type f -exec chmod 644 {} \;
chmod 755 "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN"/{postinst,prerm,postrm}
chmod 755 "${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN"
```

### 6. Build Package
```bash
# Build .deb package (dpkg-deb from examples)
dpkg-deb --build "${PACKAGE_NAME}_${VERSION}_${ARCH}" "${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"
```

### 7. Test Installation
```bash
# Test the package (requires gdebi-core)
sudo gdebi -n "${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"

# Or install directly
sudo dpkg -i "${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"

# Start the service
sudo systemctl enable --now zoneweaver

# Check status
sudo systemctl status zoneweaver
```

### 8. Uninstall
```bash
sudo systemctl stop zoneweaver
sudo apt autoremove zoneweaver
```

## Development Package Build

For development version with source files included:

```bash
export DEV_PACKAGE_NAME="zoneweaver-dev"

# Create dev package structure
mkdir -p "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}"/{opt/zoneweaver,etc/zoneweaver,etc/systemd/system,var/lib/zoneweaver,var/log/zoneweaver,DEBIAN}

# Copy everything including source files
cp -r controllers models routes middleware config index.js package.json "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"
cp -r web/src web/package.json web/vite.config.js "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/web/"
cp -r node_modules "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}/opt/zoneweaver/"

# Different control file for dev
cat > "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/control" << EOF
Package: zoneweaver-dev
Version: ${VERSION}
Section: misc
Priority: optional
Architecture: ${ARCH}
Maintainer: Makr91 <makr91@users.noreply.github.com>
Depends: nodejs (>= 18.0.0), sqlite3, openssl, npm
Conflicts: zoneweaver
Description: ZoneWeaver - Zone Hypervisor Management Interface (Development)
 Development version with source files and build tools included.
Homepage: https://github.com/Makr91/zoneweaver
EOF

# Build dev package
dpkg-deb --build "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}" "${DEV_PACKAGE_NAME}_${VERSION}_${ARCH}.deb"
```

## GitHub Actions Integration

The package building is automated via GitHub Actions. See `.github/workflows/build-packages.yml` for the full workflow.

Manual trigger:
```bash
gh workflow run build-packages.yml
```

## Package Information

- **Production Package**: `zoneweaver` - Pre-built frontend, production dependencies only
- **Development Package**: `zoneweaver-dev` - Includes source files and build tools
- **Service User**: `zoneweaver` (created during installation)
- **Configuration**: `/etc/zoneweaver/config.yaml`
- **Data Directory**: `/var/lib/zoneweaver`
- **Log Directory**: `/var/log/zoneweaver`
- **Service**: `systemctl {start|stop|status} zoneweaver`

## Notes

- Based on flavienbwk's simple tutorial and Jon Spriggs' production patterns
- Follows Debian Policy for package structure
- Uses systemd for service management
- Automatically generates SSL certificates and JWT secrets on install
- Compatible with Ubuntu 18.04+ and Debian 10+
