---
title: Authentication
layout: default
nav_order: 3
parent: Guides
permalink: /guides/authentication/
---

# Authentication

{: .no_toc }

Setting up user authentication, organizations, and security in Hyperweaver Server.

## Table of contents

{: .no_toc .text-delta }

1. TOC
   {:toc}

---

## Authentication Methods

Hyperweaver Server supports three tiers (see the [Configuration Reference](../configuration/) for all fields):

- **Local** (default) — username/password → JWT session
- **LDAP** — bind against a directory
- **OIDC** — one or more OpenID Connect providers (opt-in)

All API requests carry a JWT in the `Authorization: Bearer <token>` header.

## JWT

- **Expiration**: 24h by default (`authentication.jwt_expiration`)
- **Secret**: `authentication.jwt_secret` (auto-generated on package install)
- **Refresh**: users re-authenticate after expiry

## User Registration

### New Organization

If `authentication.local_allow_new_organizations` is enabled, the registration page lets a user create an organization and its first admin. The very first user on a fresh install becomes **super-admin**.

### Invitation-Based

For existing organizations, an admin sends an invite (Settings → Users → Invite User); the invitee registers with the code.

## Roles

- **Super Admin** — all organizations, global administration
- **Admin** — administers their own organization and its users
- **User** — standard access within their organization

## Email (SMTP)

Invitations and welcome emails require SMTP:

```yaml
mail:
  smtp_host: smtp.example.com
  smtp_port: 587
  smtp_secure: false
  smtp_user: 'noreply@company.com'
  smtp_password: 'app-password'
  smtp_from: 'Hyperweaver <noreply@company.com>'
```

## OIDC Providers

OIDC providers are managed as a config collection (Settings → Authentication, or the `/api/settings/collections/authentication.oidc_providers` endpoints). Each needs an issuer, client ID, and client secret. Adding or changing a provider requires a Server restart:

```bash
sudo systemctl restart hyperweaver-server
```

## API Authentication

Login:

```bash
curl -X POST https://your-server:3443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin@example.com", "password": "your-password"}'
```

Use the returned token:

```bash
curl https://your-server:3443/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Best Practices

1. **Strong JWT secret** (32+ random characters)
2. **HTTPS only** in production
3. **Disable new organizations** after setup: `authentication.local_allow_new_organizations: false`
4. Restrict access to port 3443 via firewall / reverse proxy

## Troubleshooting

- **Invalid credentials** — verify identifier/password and that the account is active
- **Token expired** — log in again
- **Org creation disabled** — set `authentication.local_allow_new_organizations: true`, then `systemctl restart hyperweaver-server`
- **Email invite failed** — check SMTP settings and test the connection (Settings → Mail)

---

Next: [Backend Integration](backend-integration/) — connect to Zoneweaver Agents
