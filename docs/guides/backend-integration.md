---
title: Backend Integration
layout: default
nav_order: 4
parent: Guides
permalink: /docs/guides/backend-integration/
---

# Backend Integration
{: .no_toc }

This guide covers connecting ZoneWeaver frontend to ZoneWeaver-API backend servers for zone management functionality.

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## ZoneWeaver-API Backend Overview

The ZoneWeaver-API backend provides the core zone management functionality that the ZoneWeaver frontend connects to. Each frontend can connect to multiple backend servers for managing different hosts or environments.

### Architecture

```mermaid
graph TD
    A[ZoneWeaver Frontend] --> B[Frontend API<br/>User/Org Management];
    A --> C[Zoneweaver API 1<br/>Production Host];
    A --> D[Zoneweaver API 2<br/>Development Host];
    A --> E[Zoneweaver API N<br/>Other Hosts];
    C --> F[OmniOS Host 1<br/>Bhyve Zones];
    D --> G[OmniOS Host 2<br/>Bhyve Zones];
    E --> H[OmniOS Host N<br/>Bhyve Zones];
```

## Backend Requirements

### Zoneweaver API API Server

Your Zoneweaver API must be:

- **Running**: Service active and responding to API requests
- **Accessible**: Network connectivity from frontend server
- **Authenticated**: API key configured and working
- **Version Compatible**: Compatible API version

### Network Configuration

- **Ports**: Backend typically runs on 5000 (HTTP) or 5001 (HTTPS)
- **Firewall**: Allow frontend server access to backend ports
- **SSL/TLS**: HTTPS recommended for production

## Adding Backend Servers

### Via Web Interface

1. **Login** as an admin user
2. **Navigate** to Settings → Servers
3. **Click** "Add Server"
4. **Configure** server details:
   - **Entity Name**: Descriptive name (e.g., "Production Host")
   - **Hostname**: Backend server address
   - **Port**: Usually 5001 (HTTPS) or 5000 (HTTP)
   - **Protocol**: Select HTTP or HTTPS
   - **Description**: Optional description
5. **Test Connection** to verify connectivity
6. **Save** configuration

### Configuration Details

**Hostname Examples:**
- `zoneweaver-api.example.com` - DNS name
- `192.168.1.100` - IP address
- `zapi.internal.local` - Internal DNS

**Port Selection:**
- `5001` - HTTPS (recommended)
- `5000` - HTTP (development only)

**Protocol Choice:**
- **HTTPS**: Production and secure environments
- **HTTP**: Development and testing (not recommended for production)

## Zoneweaver API API Key Setup

### Generating API Keys

On your Zoneweaver API server:

1. **Bootstrap Method** (first-time setup):
   ```bash
   curl -X POST http://zoneweaver-api:5000/api/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"entity_name": "ZoneWeaver Frontend"}'
   ```

2. **Admin Interface** (if available):
   - Login to Zoneweaver API admin interface
   - Navigate to API Keys section
   - Generate new key for frontend

3. **Configuration File** (manual):
   - Edit Zoneweaver API config to add API key
   - Restart Zoneweaver API service

### API Key Format

Zoneweaver API API keys follow this format:
```
wh_1234567890abcdef1234567890abcdef
```

Always starts with `wh_` prefix followed by 32-character hex string.

## Testing Connections

### Built-in Connection Test

1. Go to Settings → Servers in ZoneWeaver
2. Find your server and click "Test Connection"
3. Review test results:
   - ✅ **Success**: Connection working
   - ❌ **Failed**: Check configuration and logs

### Manual Testing

Test backend connectivity manually:

```bash
# Test HTTP connectivity
curl -i http://backend:5000/api/

# Test HTTPS connectivity  
curl -i https://backend:5001/api/

# Test with API key
curl -i https://backend:5001/api/zones \
  -H "Authorization: Bearer wh_your_api_key_here"
```

Expected responses:
- **200 OK**: Backend is responding
- **401 Unauthorized**: API key issue
- **Connection refused**: Service not running
- **Timeout**: Network/firewall issue

## Server Management

### Editing Server Configuration

1. Go to Settings → Servers
2. Click "Edit" on the server to modify
3. Update configuration as needed
4. Test connection after changes
5. Save updated configuration

### Removing Servers

1. Navigate to Settings → Servers
2. Click "Delete" on server to remove
3. Confirm deletion in dialog
4. Server is removed from organization

⚠️ **Warning**: Removing a server will lose access to all zones on that backend.

### Server Status Monitoring

ZoneWeaver monitors server status:
- **Green**: Server responding normally
- **Yellow**: Connection issues or slow response
- **Red**: Server unavailable or authentication failed

## Organization Server Assignment

### Multi-Organization Support

Each organization can have different server assignments:
- **Organization A**: Access to Production servers only
- **Organization B**: Access to Development servers only  
- **Super Admin**: Access to all servers globally

### Managing Server Access

**Super Admin Functions:**
1. Go to Settings → Organizations
2. Select organization to modify
3. Assign/remove server access
4. Save changes

**Organization Isolation:**
- Users only see servers assigned to their organization
- No cross-organization server access
- Separate zone lists per organization

## Troubleshooting

### Connection Issues

**Cannot Connect to Backend**
1. Verify backend service is running:
   ```bash
   svcs zoneweaver-api  # On OmniOS
   systemctl status zoneweaver-api  # On Linux
   ```
2. Check network connectivity:
   ```bash
   ping backend-hostname
   telnet backend-hostname 5001
   ```
3. Verify firewall rules allow connection
4. Check backend logs for errors

**Authentication Failed**
1. Verify API key is correct
2. Check API key hasn't expired
3. Ensure API key has proper permissions
4. Review backend authentication logs

**Slow Response Times**
1. Check network latency to backend
2. Monitor backend server load
3. Review backend performance logs
4. Consider network optimization

### API Errors

**404 Not Found**
- Backend API endpoints may have changed
- Verify API version compatibility
- Check backend API documentation

**500 Internal Server Error**
- Backend server experiencing issues
- Check backend service logs
- Verify backend database connectivity

**403 Forbidden**
- API key lacks required permissions
- Organization doesn't have access to server
- Check user role and permissions

## Advanced Configuration

### Load Balancing

For high availability, configure multiple backend servers:
1. Add multiple Zoneweaver APIs for same host
2. Use different hostnames or IP addresses
3. Frontend will attempt alternate servers on failure

### SSL Certificate Verification

For HTTPS backends with custom certificates:
1. Ensure certificates are properly installed
2. Consider certificate pinning for security
3. Update certificate validation if needed

### Network Optimization

For better performance:
- Use dedicated network connections
- Configure appropriate MTU sizes
- Enable TCP optimization features
- Monitor network usage patterns

---

Next: [Installation Guide](installation/) - Production deployment options
