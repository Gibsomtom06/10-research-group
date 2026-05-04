# SaaS Core Architecture: Multi-Tenant & Data Privacy

To scale from a single-label system (DSR) to a SaaS platform, we must redesign the foundational layers to support multiple independent users (Labels, Managers, Artists) while ensuring strict data isolation and privacy.

---

## 1. Multi-Tenant Data Isolation

Every piece of data must be tagged with a `tenant_id`. No query should ever run without a `tenant_id` filter.

### Database Schema (SaaS Upgrade)

| Table | SaaS Key Fields | Description |
|:---|:---|:---|
| `tenants` | `tenant_id` (PK), `plan_type`, `api_keys` | Master record for each Label or Manager |
| `artists` | `artist_id` (PK), `tenant_id` (FK), `config_json` | Links artists to their managing tenant |
| `users` | `user_id` (PK), `tenant_id` (FK), `role` | Label staff, managers, or artist logins |
| `fans` | `fan_id` (PK), `tenant_id` (FK), `global_id` | Unified fan record (linked to Square, Spotify, etc.) |

### File Storage (SaaS Upgrade)

Instead of a single Google Drive folder, we move to a **Scoped Storage Hierarchy**:
`s3://saas-bucket/{tenant_id}/{artist_id}/shows/{show_id}/assets/`

---

## 2. API-First Modular Logic

We move away from local Python scripts to **Headless API Endpoints**. This allows any website (Wix, Shopify, WordPress) to interact with the system.

### The "SaaS Engine" Endpoints

| Endpoint | Method | Purpose |
|:---|:---|:---|
| `/v1/submissions/intake` | POST | Receives music from any website form |
| `/v1/bookings/offer` | POST | Ingests show offers from promoters |
| `/v1/marketing/campaign` | POST | Launches a 4-phase campaign for a show |
| `/v1/fans/profile/{id}` | GET | Returns a unified "Fan Intelligence" dossier |

---

## 3. Data Privacy & Compliance (GDPR/CCPA)

As a SaaS platform, we are now a **Data Processor**. We must implement:

1.  **Data Anonymization:** For "Market Benchmarks" (e.g., industry-wide CPT), data must be anonymized so Label A cannot see Label B's specific show costs.
2.  **Right to be Forgotten:** Automated script to delete a fan's data across all platforms (Square, Spotify, CRM) upon request.
3.  **Audit Logging:** Every action taken by an agent or user is logged with `timestamp`, `user_id`, and `tenant_id`.

---

## 4. Tenant-Specific "Brain" (The Config System)

Instead of hard-coded logic, each tenant has a `Config` object that the agents read before taking action.

```json
{
  "tenant_id": "dsr_001",
  "approval_chain": ["Thomas", "Leigh"],
  "vote_logic": "2/3_majority",
  "rider_template_id": "dsr_standard_v1",
  "brand_voice": "blunt_authentic",
  "marketing_budget_rules": {
    "digital_split": 0.40,
    "creative_split": 0.10,
    "street_split": 0.50
  }
}
```

---

## 5. White-Label Integration

To allow labels to use this with their **current website**, we provide:

1.  **Webhooks:** The SaaS sends a "New Submission" event to the label's Slack or Discord.
2.  **Embedded Widgets:** A "Submit Demo" or "Join Promo Team" widget that can be iframe-embedded into any site.
3.  **Custom Domain Mapping:** The portal can live at `portal.yourlabel.com` while running on our SaaS engine.
