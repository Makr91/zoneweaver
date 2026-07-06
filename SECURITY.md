# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Hyperweaver Server, please report it responsibly:

### Preferred Method: Security Advisory

1. Go to the [GitHub Security Advisory page](https://github.com/Makr91/hyperweaver-server/security/advisories)
2. Click "Report a vulnerability"
3. Fill out the advisory form with detailed information
4. Submit the advisory

### What to Include

Please provide as much information as possible:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Affected versions** (if known)
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

## Response Process

Due to limited development resources, please understand that:

- **Initial Response**: We aim to acknowledge receipt within 48-72 hours
- **Assessment**: Initial assessment will be completed within 1 week
- **Resolution**: Timeline depends on severity and complexity, typically 1-4 weeks
- **Disclosure**: Coordinated disclosure after fix is available

### Severity Levels

- **Critical**: Immediate attention (RCE, privilege escalation)
- **High**: Quick response needed (authentication bypass, data exposure)
- **Medium**: Standard timeline (DoS, information disclosure)
- **Low**: Lower priority (minor information leaks)

## Security Considerations for Hyperweaver Server

Given that Hyperweaver Server authenticates users and proxies privileged host-agent APIs, please pay special attention to:

### High-Risk Areas

- **Authentication**: JWT, session, OIDC, or LDAP bypasses and privilege escalation
- **Agent Proxy Authorization**: Bypassing the admin/super-admin gates on proxied agent sub-paths
- **Machine Management**: Unauthorized machine creation/modification/deletion through the proxy
- **Stored Agent Credentials**: Exposure of the agent API keys held in the registry
- **Session Handling**: Fixation, cross-account leakage of server-side OIDC token stashes

### Configuration Security

- **Default Configurations**: Insecure defaults
- **SSL/TLS Implementation**: Certificate validation, cipher suites
- **CORS Configuration**: Origin validation bypasses
- **Database Security**: SQL injection, unauthorized access

## Best Practices for Users

To maintain security:

1. **Keep Updated**: Always run the latest stable version
2. **Secure Configuration**: Follow the [security configuration guide](/docs/configuration/)
3. **Secret Management**: Use a strong JWT secret (32+ characters) and rotate agent API keys regularly
4. **Network Security**: Use HTTPS, restrict network access appropriately
5. **Monitor Logs**: Watch for suspicious activity in application logs

## Security Features

Hyperweaver Server includes several security features:

- **JWT Authentication**: Bcrypt-hashed passwords, token revocation on logout (real single logout)
- **Role-Based Access Control**: Super Admin / Admin / User with multi-tenant organization isolation
- **Rate Limiting**: Tiered limits on authentication, admin, proxy, and static endpoints
- **CORS Protection**: Whitelist-based origin validation
- **SSL/TLS Support**: Configurable HTTPS with automatic certificate generation and HTTP→HTTPS 308 redirect (force_secure)
- **Server-Side OIDC Tokens**: IdP tokens never reach the browser; sessions are regenerated at login

## Acknowledgments

We appreciate the security research community's efforts in making Hyperweaver Server more secure. Responsible disclosure helps protect all users.

### Hall of Fame

Contributors who responsibly report security vulnerabilities will be acknowledged here (with their permission):

- _No vulnerabilities reported yet_

## Updates to This Policy

This security policy may be updated as the project evolves. Check back periodically for changes.

---

**Remember**: Security is a shared responsibility. Your vigilance and responsible reporting help keep the entire Hyperweaver Server community safe.
