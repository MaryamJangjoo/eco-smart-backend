# ECO-SMART Domain Model (Final Target)

## Strategic Boundaries
The business domain is strictly driven by **Three Core Concepts** (Entities), implemented via **Four Storage Structures** (Database Tables).

1. **User** (Platform Boundary): The identity that interacts with the ecosystem.
2. **Site** (Product Boundary): The physical or logical container (e.g., House, Office) representing the Tenant.
3. **Device** (Product Boundary): The hardware unit provisioned inside a container.

## Domain Relationships
* **User <-> Site**: Many-to-Many via `SiteMember` with specific roles (`OWNER`, `MEMBER`).
* **Site <-> Device**: One-to-Many. A device cannot exist without a parent Site.

```mermaid
erDiagram
    USER ||--o{ SITE_MEMBER : holds
    SITE ||--o{ SITE_MEMBER : manages
    SITE ||--o{ DEVICE : deploys

    USER {
        uuid id
        string name
        string email
    }
    SITE {
        uuid id
        string name
    }
    SITE_MEMBER {
        uuid id
        enum role
    }
    DEVICE {
        uuid id
        string mac_address
        string type
    }