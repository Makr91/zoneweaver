#!/usr/bin/bash
#
# ZoneWeaver post-installation script
# This script is run during package installation to generate SSL certificates and JWT secrets
#

set -e

echo "=== ZoneWeaver Post-Installation Setup ==="

# Create SSL certificates directory if it doesn't exist
if [ ! -d "/etc/zoneweaver/ssl" ]; then
    mkdir -p /etc/zoneweaver/ssl
    chown zoneweaver:zoneweaver /etc/zoneweaver/ssl
    chmod 700 /etc/zoneweaver/ssl
fi

# Generate SSL certificates if they don't exist
if [ ! -f "/etc/zoneweaver/ssl/cert.pem" ] || [ ! -f "/etc/zoneweaver/ssl/key.pem" ]; then
    echo "Generating SSL certificates..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/zoneweaver/ssl/key.pem \
        -out /etc/zoneweaver/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=ZoneWeaver/CN=localhost" 2>/dev/null
    
    # Set proper ownership and permissions
    chown zoneweaver:zoneweaver /etc/zoneweaver/ssl/key.pem
    chown zoneweaver:zoneweaver /etc/zoneweaver/ssl/cert.pem
    chmod 600 /etc/zoneweaver/ssl/key.pem
    chmod 600 /etc/zoneweaver/ssl/cert.pem
    
    echo "SSL certificates generated successfully"
else
    echo "SSL certificates already exist, skipping generation"
fi

# Generate JWT secret if it doesn't exist
if [ ! -f "/etc/zoneweaver/.jwt-secret" ]; then
    echo "Generating JWT secret..."
    
    JWT_SECRET=$(openssl rand -hex 32)
    echo "$JWT_SECRET" > /etc/zoneweaver/.jwt-secret
    
    # Set proper ownership and permissions
    chown zoneweaver:zoneweaver /etc/zoneweaver/.jwt-secret
    chmod 600 /etc/zoneweaver/.jwt-secret
    
    echo "JWT secret generated successfully"
else
    echo "JWT secret already exists, skipping generation"
fi

# Create database directory if it doesn't exist
if [ ! -d "/var/lib/zoneweaver/database" ]; then
    mkdir -p /var/lib/zoneweaver/database
    chown zoneweaver:zoneweaver /var/lib/zoneweaver/database
    chmod 755 /var/lib/zoneweaver/database
    echo "Database directory created"
fi

# Create log directory if it doesn't exist (should already exist from package)
if [ ! -d "/var/log/zoneweaver" ]; then
    mkdir -p /var/log/zoneweaver
    chown zoneweaver:zoneweaver /var/log/zoneweaver
    chmod 755 /var/log/zoneweaver
    echo "Log directory created"
fi

echo "=== ZoneWeaver Post-Installation Setup Complete ==="

exit 0
