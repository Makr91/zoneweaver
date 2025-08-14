---
title: Home
layout: home
nav_order: 1
description: "ZoneWeaver Documentation - Zone Hypervisor Management Frontend"
permalink: /
---

# ZoneWeaver Documentation
{: .fs-9 }

React-based web frontend for ZoneWeaver zone hypervisor management. Provides user management, organization control, and integration with Zoneweaver API for managing Bhyve virtual machines on OmniOS/illumos.
{: .fs-6 .fw-300 }

[Get started now](#getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View API Reference](docs/api/){: .btn .fs-5 .mb-4 .mb-md-0 }
[View on GitHub](https://github.com/Makr91/zoneweaver){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Getting started

ZoneWeaver is the web frontend component of the ZoneWeaver zone management system. It provides user authentication, organization management, and a comprehensive web interface for managing Bhyve virtual machines through the Zoneweaver API.

### Key Features

- **User Management**: Complete user authentication and authorization system
- **Multi-Organization Support**: Organization-based access control and management
- **Server Management**: Configure and manage multiple Zoneweaver API connections
- **Web Interface**: Modern React-based dashboard for zone management
- **API Integration**: RESTful API for user/organization management and backend integration
- **Responsive Design**: Mobile-friendly interface for on-the-go management

### Architecture

```mermaid
graph TD
    A[Web Browser] -- HTTPS --> B[ZoneWeaver Frontend];
    B -- User Auth API --> C[Frontend Node.js API];
    B -- Zone Management --> D[Zoneweaver API on OmniOS Host];
    D -- Manages --> E[Bhyve Zones / Virtual Machines];
    C -- Stores --> F[SQLite Database];
```

### Quick start

1. **Installation**: Install ZoneWeaver frontend via package or build from source
2. **Configuration**: Configure settings in `/etc/zoneweaver/config.yaml`
3. **Setup**: Create initial organization and admin user
4. **Backend Connection**: Configure Zoneweaver API server connections
5. **Access**: Open web interface and start managing zones

### Documentation

The ZoneWeaver frontend provides comprehensive documentation:

- **[API Reference](docs/api/)** - Frontend API for user/organization management
- **[Getting Started Guide](docs/guides/getting-started/)** - Step-by-step setup instructions  
- **[Installation Guide](docs/guides/installation/)** - Installation and deployment
- **[User Guide](docs/user-guide/)** - Web interface usage and features
- **[Backend Integration](docs/guides/backend-integration/)** - Connecting to Zoneweaver API API

---

## About the project

ZoneWeaver is &copy; 2025 by the ZoneWeaver Project.

### License

ZoneWeaver is distributed by an [GPL-3.0 license](https://github.com/Makr91/zoneweaver/blob/main/LICENSE.md).

### Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change. Read more about becoming a contributor in [our GitHub repo](https://github.com/Makr91/zoneweaver#contributing).

#### Thank you to the contributors of ZoneWeaver!

<ul class="list-style-none">
{% for contributor in site.github.contributors %}
  <li class="d-inline-block mr-1">
     <a href="{{ contributor.html_url }}"><img src="{{ contributor.avatar_url }}" width="32" height="32" alt="{{ contributor.login }}"></a>
  </li>
{% endfor %}
</ul>

### Code of Conduct

ZoneWeaver is committed to fostering a welcoming community.

[View our Code of Conduct](https://github.com/Makr91/zoneweaver/tree/main/CODE_OF_CONDUCT.md) on our GitHub repository.
