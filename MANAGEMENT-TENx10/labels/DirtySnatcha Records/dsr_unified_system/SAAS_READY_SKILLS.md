# SaaS-Ready Skill Library & Agent Templates

To scale the DSR system into a SaaS platform, we move from "Specific Skills" (DSR-only) to "Universal Skills" that take a `Tenant_Config` object as input.

---

## 1. Universal Skill Template (The "Tenant_Config" Pattern)

Every skill must be rewritten to be **agnostic**. It reads from a configuration object provided by the SaaS engine.

### Skill: `universal-booking-workflow` (SK-01)
*   **Trigger:** New show offer received via Label Website form or Email.
*   **SaaS Logic:** 
    1.  Fetch `Tenant_Config` for the label.
    2.  Validate required fields (based on tenant's custom rules).
    3.  Route to `approval_chain` defined in the tenant's profile.
    4.  Clone `rider_template_id` and inject tenant-specific "variable demands."

### Skill: `universal-ar-submission` (SK-02)
*   **Trigger:** New music demo received via Label Website form.
*   **SaaS Logic:** 
    1.  Fetch `Tenant_Config` for the label.
    2.  Score using the "Universal A&R Engine" (Quality/Reach/Fit).
    3.  Queue for the tenant's specific `vote_logic` (e.g., 2/3 majority, single-person approval).
    4.  Send email using the tenant's white-labeled `email_templates`.

---

## 2. Agent Templates (The "Role" Definition)

In the SaaS model, agents are **Template-Based**. A label can "activate" an agent by assigning it to their tenant.

| SaaS Agent Role | Template | Tenant Customization |
|:---|:---|:---|
| **A&R Specialist** | `ar_agent_v1` | Scoring weights, partner list, vote threshold |
| **Tour Manager** | `tour_agent_v1` | Approval chain, rider templates, hotel standards |
| **Marketing Director** | `marketing_agent_v1` | Phase-based budget split, ad copy voice, CPT goal |
| **Promo Team Lead** | `promo_agent_v1` | Task point values, reward tiers, leaderboard frequency |

---

## 3. The "Headless" Skill Integration (Wix/Shopify/WordPress)

The SaaS provides a "Headless" bridge for each skill. This allows the label to use their **current website** while the agents do the work.

### Webhook & Widget Bridge

1.  **Submission Widget:** A JS snippet for the label's website. When a fan submits, it triggers a POST to the SaaS API.
2.  **Skill Webhook:** The SaaS engine triggers the `universal-ar-submission` skill.
3.  **Agent Action:** The A&R Agent scores the demo and notifies the Label Executive via their preferred channel (Slack, Discord, Email).

---

## 4. Multi-Tenant Agent Orchestration

The `dsr_orchestrator.py` is replaced by a **SaaS Orchestrator** that manages thousands of concurrent tenant sessions.

```python
# SaaS Orchestrator (Pseudocode)
class SaaSOrchestrator:
    def __init__(self, tenant_id):
        self.config = self.fetch_tenant_config(tenant_id)
        self.agents = self.initialize_tenant_agents(self.config)

    def process_event(self, event_type, data):
        # 1. Route event to the correct agent based on tenant config
        # 2. Agent executes the universal skill
        # 3. Output is stored in the tenant's isolated data bucket
```

---

## 5. User Knowledge "Enrichment" Skill

A new skill dedicated to the SaaS value proposition: **knowledge gain**.

### Skill: `fan-data-enrichment` (SK-03)
*   **Action:** When a fan interacts with the label (merch, demo, RSVP), the agent:
    1.  Queries the Square API for purchase history.
    2.  Queries the Spotify API for listening stats.
    3.  Queries the Instagram API for social influence.
    4.  Builds a "Fan Intelligence Dossier" and sends it to the Label Executive.
    5.  **Knowledge Gain:** "This fan is a high-value superfan in the Detroit market. They have spent $200 on merch and listen to your artist daily."
