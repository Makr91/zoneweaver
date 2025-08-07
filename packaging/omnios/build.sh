#!/usr/bin/bash
#
# CDDL HEADER START
#
# The contents of this file are subject to the terms of the
# Common Development and Distribution License, Version 1.0 only
# (the "License").  You may not use this file except in compliance
# with the License.
#
# You can obtain a copy of the license at usr/src/OPENSOLARIS.LICENSE
# or http://www.opensolaris.org/os/licensing.
# See the License for the specific language governing permissions
# and limitations under the License.
#
# When distributing Covered Code, include this CDDL HEADER in each
# file and include the License file at usr/src/OPENSOLARIS.LICENSE.
# If applicable, add the following below this CDDL HEADER, with the
# fields enclosed by brackets "[]" replaced with your own identifying
# information: Portions Copyright [yyyy] [name of copyright owner]
#
# CDDL HEADER END
#
#
# Copyright 2025 Makr91. All rights reserved.
# Use is subject to license terms.
#

set -e

# Simple logging functions
logmsg() { echo "=== $*"; }
logcmd() { echo ">>> $*"; "$@"; }

# Set up variables
SRCDIR="$(pwd)"
DESTDIR="${SRCDIR}/proto"
PROG=zoneweaver
VER=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
PKG=system/virtualization/zoneweaver

# Clean and create staging directory
rm -rf "$DESTDIR"
mkdir -p "$DESTDIR"

#### Build Structure
# /opt/zoneweaver/
#   # Node.js application files
#   index.js
#   package.json
#   controllers/
#   models/
#   routes/
#   middleware/
#   config/
#   utils/
#   scripts/
#   web/dist/
#   node_modules/
#   startup.sh
#   shutdown.sh
# /etc/zoneweaver/
#   config.yaml
# /var/lib/zoneweaver/
# /var/log/zoneweaver/

build_app() {
    logmsg "Building ZoneWeaver frontend"
    
    # Set up environment for OmniOS/Solaris
    export MAKE=gmake
    export CC=gcc
    export CXX=g++
    
    # Sync versions
    logcmd npm run sync-versions
    
    # Install dependencies
    MAKE=gmake logcmd npm ci
    pushd web >/dev/null
    MAKE=gmake logcmd npm ci
    popd >/dev/null
    
    # Build frontend
    logcmd npm run build
    
    # Install production dependencies only
    MAKE=gmake logcmd npm ci --omit=dev
}

install_app() {
    pushd $DESTDIR >/dev/null

    # Create main application directory
    logcmd mkdir -p opt/zoneweaver
    pushd opt/zoneweaver >/dev/null

    # Copy application files
    logmsg "Installing ZoneWeaver application files"
    logcmd cp $SRCDIR/index.js .
    logcmd cp $SRCDIR/package.json .
    logcmd cp $SRCDIR/LICENSE.md .
    
    # Copy application directories
    for dir in controllers models routes middleware config utils scripts; do
        if [ -d "$SRCDIR/$dir" ]; then
            logcmd cp -r $SRCDIR/$dir .
        fi
    done
    
    # Copy built frontend
    if [ -d "$SRCDIR/web/dist" ]; then
        logcmd mkdir -p web
        logcmd cp -r $SRCDIR/web/dist web/
    fi
    
    # Copy node_modules (production only)
    if [ -d "$SRCDIR/node_modules" ]; then
        logcmd cp -r $SRCDIR/node_modules .
    fi
    
    # Copy SMF method scripts
    logcmd cp $SRCDIR/packaging/omnios/startup.sh .
    logcmd cp $SRCDIR/packaging/omnios/shutdown.sh .
    logcmd chmod 755 startup.sh shutdown.sh
    
    popd >/dev/null # /opt/zoneweaver

    # Install configuration
    logmsg "Installing configuration files"
    logcmd mkdir -p etc/zoneweaver
    logcmd cp $SRCDIR/packaging/config/production-config.yaml etc/zoneweaver/config.yaml

    # Create data and log directories
    logcmd mkdir -p var/lib/zoneweaver
    logcmd mkdir -p var/log/zoneweaver

    # Install SMF manifest
    logmsg "Installing SMF manifest"
    logcmd mkdir -p lib/svc/manifest/system
    logcmd cp $SRCDIR/packaging/omnios/zoneweaver-smf.xml lib/svc/manifest/system/zoneweaver.xml

    popd >/dev/null # $DESTDIR
}

post_install() {
    logmsg "--- Setting up ZoneWeaver staging directory"
    
    pushd $DESTDIR >/dev/null
    
    # Create SSL directory (certificates will be generated during installation)
    logcmd mkdir -p etc/zoneweaver/ssl
    
    # Create database directory
    logcmd mkdir -p var/lib/zoneweaver/database
    
    # Include post-install script in package
    logcmd cp $SRCDIR/packaging/omnios/post-install.sh opt/zoneweaver/

    popd >/dev/null
    
    logmsg "ZoneWeaver staging setup completed"
}

# Main build process
logmsg "Starting ZoneWeaver build process"
build_app
install_app
post_install

# Create the package
logmsg "Creating IPS package"
cd "$SRCDIR"
export VERSION="$VER"
sed "s/@VERSION@/${VERSION}/g" packaging/omnios/zoneweaver.p5m > zoneweaver.p5m.tmp
pkgsend generate proto | pkgfmt > zoneweaver.p5m.generated
pkgmogrify -DVERSION="${VERSION}" zoneweaver.p5m.tmp zoneweaver.p5m.generated > zoneweaver.p5m.final

# Publish to repository
if [ ! -d /tmp/local-repo ]; then
    pkgrepo create /tmp/local-repo
    pkgrepo set -s /tmp/local-repo publisher/prefix=local
fi

pkgsend publish -d proto -s /tmp/local-repo zoneweaver.p5m.final

logmsg "Package build completed. Install with:"
logmsg "  pfexec pkg set-publisher -g /tmp/local-repo local"
logmsg "  pfexec pkg install system/virtualization/zoneweaver"

# Vim hints
# vim:ts=4:sw=4:et:
