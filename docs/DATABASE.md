---

### 🗄️ گام ۱.۲: به‌روزرسانی نهایی ساختار دیتابیس (`../docs/DATABASE.md`)

```markdown
# ECO-SMART Relational Database Schema

### 1. `users` Table (Platform Layer)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |

### 2. `sites` Table (Products -> ECO-SMART)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `name` | VARCHAR(100) | NOT NULL |

### 3. `site_members` Table (Products -> ECO-SMART Boundary Hub)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `site_id` | UUID | FK REFERENCES `sites(id)` ON DELETE CASCADE |
| `user_id` | UUID | FK REFERENCES `users(id)` ON DELETE CASCADE |
| `role` | VARCHAR(20) | ENUM('OWNER', 'MEMBER'), DEFAULT 'MEMBER' |

*Constraint: UNIQUE(site_id, user_id) to guarantee a user cannot have dual roles in one site.*

### 4. `devices` Table (Products -> ECO-SMART)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `site_id` | UUID | FK REFERENCES `sites(id)` ON DELETE CASCADE |
| `mac_address` | VARCHAR(50) | UNIQUE, NOT NULL |
| `type` | VARCHAR(50) | NOT NULL |
| `status` | VARCHAR(20) | DEFAULT 'OFFLINE' |