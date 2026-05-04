# Your Artist Operating System: A Plain-Language Guide

Thank you for asking for clarification. It's a new process, and my priority is to make sure you're comfortable and confident in how it works before we go any further. I apologize for jumping ahead to the technical setup too quickly.

Let's forget the code and file structures for a moment. The goal here is to build an **automated system that works for you**, not a complex technical tool that you have to operate manually. Think of what we're building as the **"Operating System" for your artist business**.

This guide will walk you through the three core components of this system, using DirtySnatcha's current tour as a real-world example.

---

## The Three Core Components

Imagine you have a project manager for your tour marketing. That manager needs three things: a **brain** to make decisions, internal **know-how** to perform specific tasks, and **hands** to interact with outside services like Facebook or Gmail. In our system, these are:

1.  **The Agent:** The Brain / Project Manager
2.  **Skills:** The Internal Know-How / Checklists
3.  **MCP Tools:** The Hands / External Connections

Let's break down each one.

### 1. The Agent (The "Brain")

The `TourMarketingAgent` is the central orchestrator. Its job is to understand the high-level goal and manage the entire process from start to finish. It's the component that follows the **4-phase campaign system** we defined in the initial brief.

> **In Practice (DirtySnatcha's Tour):**
> The agent constantly monitors the tour dates. It sees the Lincoln show is on February 27th and knows it's in the **🔴 FINAL PUSH** phase. Its primary goal becomes: "Execute a Final Push campaign for the Lincoln show immediately."

### 2. Skills (The "Internal Know-How")

Once the Agent has a goal, it needs to know *how* to execute the steps. **Skills are the agent's internal, reusable knowledge base**—like a set of checklists or standard operating procedures for tasks it needs to do repeatedly.

Here are the skills we've defined for it so far:

| Skill | What It Does (In Plain English) |
| :--- | :--- |
| `calculate_budget_allocation` | When the agent needs to run ads, it uses this skill to do the math. For Lincoln's "Final Push," this skill tells it to allocate 50% of the promoter's marketing budget. |
| `generate_ad_copy` | This skill provides proven ad copy templates. For Lincoln, it will generate an urgent, "Last chance to buy!" style message. |
| `create_geo_targeting` | This tells the agent *who* to show the ads to. For Lincoln, it will define a target audience, for example, a 25-mile radius around the city of Lincoln, NE. |
| `build_show_folder_structure` | This skill keeps everything organized. It creates a dedicated folder for each show to store contracts, artwork, ad copy, and performance reports. |

### 3. MCP Tools (The "Hands")

MCPs (Model Context Protocol) are the agent's **secure connections to the outside world**. They are the "hands" that allow the agent to take the information from its Skills and perform actions in other applications on your behalf.

Here are the key MCP tools the agent will use:

| MCP Tool | What It Lets the Agent Do |
| :--- | :--- |
| `meta-marketing` | This is the connection to Facebook & Instagram Ads. The agent uses this to **actually launch ad campaigns**, monitor their performance, and report back on how much was spent and how many tickets were sold. |
| `gmail` | This allows the agent to **read your emails**. It can use this to automatically parse new booking offers, extract key details (like fee, date, venue), and add them to your system without you lifting a finger. |
| `google-calendar` | Once a show is confirmed, the agent can use this to **automatically create an event** on a shared tour calendar for you, the artist, and the team. |

---

## Putting It All Together: A Real-World Workflow

Let's walk through how this entire system works together for the **urgent Lincoln show**.

1.  **The Trigger:** The `TourMarketingAgent` (the brain) sees the Lincoln show is tomorrow and is in the "Final Push" phase.

2.  **Internal Prep (Using Skills):** The agent executes its internal checklists:
    *   It calls the `calculate_budget_allocation` skill to determine the ad spend.
    *   It calls the `generate_ad_copy` skill to write an urgent, last-minute ad.
    *   It calls the `create_geo_targeting` skill to define the audience around Lincoln.

3.  **External Action (Using MCP Tools):** Now that it has the ad ready, the agent uses its "hands":
    *   It connects to the `meta-marketing` MCP tool and tells it: "Launch this ad, to this audience, with this budget."
    *   The ad campaign starts running on Facebook and Instagram.

4.  **Closing the Loop:**
    *   Throughout the day, the agent uses the `meta-marketing` tool again to ask: "How is the Lincoln campaign doing? How many link clicks? What's the cost per click?"
    *   It will then connect to the ticketing platform's API (once we integrate it) to ask: "How many tickets have we sold for Lincoln since the ads started?"
    *   Finally, it calculates the **cost per ticket sold** and prepares a simple report for you.

This entire process happens automatically, orchestrated by the agent. Your role is to set the strategy (which we've done in the brief) and review the results. The agent handles the tedious, manual execution.

---

I hope this provides a much clearer picture of what we're building and how you'll interact with it. Please let me know if this makes sense or if you have any more questions at all. Once you confirm you're comfortable with this framework, we can proceed with the next steps.
