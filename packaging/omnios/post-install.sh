#!/bin/bash
#
# ZoneWeaver post-installation setup script for OmniOS
# This script runs after package installation to set up SSL, JWT secrets, and database
#

set -e

echo "Setting up ZoneWeaver post-installation configuration..."

# Ensure zoneweaver user owns its directories
chown -R zoneweaver:zoneweaver /opt/zoneweaver
chown -R zoneweaver:zoneweaver /var/lib/zoneweaver
chown -R zoneweaver:zoneweaver /var/log/zoneweaver
chown -R zoneweaver:zoneweaver /etc/zoneweaver

# Generate SSL certificates if they don't exist
if [ ! -f /etc/zoneweaver/ssl/cert.pem ]; then
    echo "Generating SSL certificates..."
    mkdir -p /etc/zoneweaver/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/zoneweaver/ssl/key.pem \
        -out /etc/zoneweaver/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=ZoneWeaver/CN=localhost"
    chown zoneweaver:zoneweaver /etc/zoneweaver/ssl/*
    chmod 600 /etc/zoneweaver/ssl/*
    echo "Generated SSL certificates in /etc/zoneweaver/ssl/"
fi

# Generate JWT secret if it doesn't exist
if [ ! -f /etc/zoneweaver/.jwt-secret ]; then
    echo "Generating JWT secret..."
    openssl rand -hex 32 > /etc/zoneweaver/.jwt-secret
    chown zoneweaver:zoneweaver /etc/zoneweaver/.jwt-secret
    chmod 600 /etc/zoneweaver/.jwt-secret
    echo "Generated JWT secret in /etc/zoneweaver/.jwt-secret"
fi

# Update config file with actual JWT secret
if [ -f /etc/zoneweaver/.jwt-secret ]; then
    JWT_SECRET=$(cat /etc/zoneweaver/.jwt-secret)
    sed -i "s/__JWT_SECRET_FROM_FILE__/${JWT_SECRET}/g" /etc/zoneweaver/config.yaml
    echo "Updated config with JWT secret"
fi

# Initialize database directory
mkdir -p /var/lib/zoneweaver/database
chown zoneweaver:zoneweaver /var/lib/zoneweaver/database

echo "ZoneWeaver post-installation setup completed successfully!"
echo ""
echo "======================================================================"
echo "ZoneWeaver has been installed successfully!"
echo ""
echo "Next steps:"
echo "1. Review configuration: /etc/zoneweaver/config.yaml"
echo "2. Start the service: svcadm enable system/virtualization/zoneweaver"
echo "3. Check status: svcs -l system/virtualization/zoneweaver"
echo "4. View logs: tail -f /var/svc/log/system-virtualization-zoneweaver:default.log"
echo ""
echo "Default access: https://localhost:3443 (with self-signed certificate)"
echo "======================================================================"
echo ""

exit 0
