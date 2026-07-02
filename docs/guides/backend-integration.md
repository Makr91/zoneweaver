---
title: Backend Integration
layout: default
nav_order: 4
parent: Guides
permalink: /guides/backend-integration/
---

# Backend Integration

{: .no_toc }

Connecting Hyperweaver Server to Zoneweaver Agent backends for VM / zone management.

## Table of contents

{: .no_toc .text-delta }

1. TOC
   {:toc}

---

## Overview

Hyperweaver Server is a control plane: it authenticates users and **proxies** their requests to one or more **Zoneweaver Agents** — the host agents that actually manage the hypervisor (Bhyve on OmniOS). One Server can manage many agents.

```mermaid
graph TD
    A[Hyperweaver Server] --> B[Server API<br/>User/Org Management];
    A --> C[Zoneweaver Agent 1<br/>Production Host];
    A --> D[Zoneweaver Agent 2<br/>Development Host];
    C --> F[OmniOS Host 1<br/>Bhyve Zones];
    D --> G[OmniOS Host 2<br/>Bhyve Zones];
```

## Agent Requirements

Each Zoneweaver Agent must be:

- **Running** and responding to API requests
- **Reachable** over the network from the Server
- **Authenticated** — a valid API key
- **Version-compatible** with the Agent API the Server expects

Agents typically listen on `5000` (HTTP) or `5001` (HTTPS).

## Adding an Agent

1. Log in as an admin
2. **Settings → Servers → Add Server**
3. Configure:
   - **Entity Name** — a friendly label (e.g. "Production Host")
   - **Hostname** — the agent's address
   - **Port** — usually `5001` (HTTPS)
   - **Protocol** — HTTP or HTTPS
   - **API Key** — an existing key, or leave blank to bootstrap one
4. **Test Connection**, then **Save**

## API Keys

On first setup the Server can bootstrap a key from the agent, or you can supply one. Zoneweaver Agent keys use the `wh_` prefix followed by a hex string, e.g. `wh_1234567890abcdef1234567890abcdef`.

Test a key manually:

```bash
curl -i https://agent-host:5001/stats \
  -H "Authorization: Bearer wh_your_api_key_here"
```

Expected: `200` (OK), `401` (bad key), connection refused (agent down), or a timeout (network / firewall).

## Managing Agents

- **Edit / Delete**: Settings → Servers
- **Status**: the Server shows each agent's reachability (green / yellow / red)
- ⚠️ Removing an agent drops access to all VMs on that host.

## Organization Assignment

Agents are scoped per organization — users only see agents assigned to their organization; super-admins see all. Manage assignments in Settings → Organizations.

## Troubleshooting

### Cannot connect

```bash
# Is the agent up? (on the OmniOS host)
svcs zoneweaver-agent

# Reachable from the Server?
ping agent-host
nc -z agent-host 5001
```

### Authentication failed

Verify the API key and its permissions on the agent.

### API errors

- `404` — agent endpoint or version mismatch
- `500` — agent-side error; check the agent's logs
- `403` — the key lacks permission, or the organization isn't assigned this agent

---

Next: [Installation](installation/) — production deployment
