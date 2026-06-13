# Understanding This Sales CRM — A Complete Guide for Students

> **Who is this document for?**
> Anyone who is new to software development, business applications, or CRM systems and wants to understand — from scratch — what this project is, why it exists, how it works, and who benefits from it.

---

## Table of Contents

1. [What is a CRM?](#1-what-is-a-crm)
2. [Why Do Businesses Need a CRM?](#2-why-do-businesses-need-a-crm)
3. [What is This Specific CRM?](#3-what-is-this-specific-crm)
4. [Who Are the Users?](#4-who-are-the-users)
5. [The Sales Process — How a Deal Flows](#5-the-sales-process--how-a-deal-flows)
6. [Core Concepts Explained](#6-core-concepts-explained)
   - [Accounts](#accounts)
   - [Contacts](#contacts)
   - [Leads](#leads)
   - [Opportunities](#opportunities)
   - [Activities](#activities)
7. [How Everything Connects](#7-how-everything-connects)
8. [Features of This CRM](#8-features-of-this-crm)
9. [The Technology Stack](#9-the-technology-stack)
10. [Who Gets Helped and How](#10-who-gets-helped-and-how)
11. [Real-World Example: A Day in the Life](#11-real-world-example-a-day-in-the-life)
12. [What's Inside the Application (Screens)](#12-whats-inside-the-application-screens)
13. [Summary at a Glance](#13-summary-at-a-glance)

---

## 1. What is a CRM?

**CRM** stands for **Customer Relationship Management**.

In plain English, a CRM is a software application that helps a business:
- Keep track of all the people and companies they sell to
- Remember every conversation, meeting, and email they've had
- Follow up at the right time
- Never lose a potential sale because someone forgot to call back

Think of it like this: imagine you are a salesperson and you talk to 50 different potential customers every week. You can't remember every detail about each person — what they need, when you last called them, whether they agreed to a demo, what price they were offered. A CRM is the memory system that remembers all of this for you.

**Before CRM tools existed**, salespeople used:
- Notebooks and sticky notes
- Spreadsheets (still very common today in small businesses)
- Their own email inbox and memory

**Problems with those approaches:**
- Information gets lost when an employee leaves
- Two salespeople might contact the same customer without knowing
- There is no clear picture of which deals are most likely to close
- Managers cannot see how their team is performing

A CRM solves all of these problems in one organised place.

---

## 2. Why Do Businesses Need a CRM?

Here are the real business problems a CRM solves:

### Problem 1 — Lost Deals
A salesperson speaks to a promising customer on Monday. They forget to follow up by Friday. The customer buys from a competitor. A CRM sends reminders and keeps the conversation history visible.

### Problem 2 — No Shared Knowledge
One salesperson knows everything about a big client but goes on holiday. Nobody else can handle that client's questions because the information only exists in that person's head. A CRM stores it all centrally.

### Problem 3 — No Visibility for Managers
A sales manager needs to know: "How much revenue is the team likely to close this month?" Without a CRM, they would have to ask every person individually. A CRM shows a live dashboard with this information at a glance.

### Problem 4 — Disorganised Follow-ups
Without a system, salespeople often contact the wrong people at the wrong time — or not at all. A CRM shows every open deal and what the next action should be.

### Problem 5 — No History
When a customer complains "You promised me a 10% discount last March!", the sales rep has no way to confirm. A CRM keeps a log of every interaction so this can be verified.

---

## 3. What is This Specific CRM?

This project is a **Sales CRM Platform** — a full-stack web application built for a small-to-medium sales team. It covers the entire sales lifecycle from the first time you hear about a potential customer all the way to closing a deal.

**What it does:**
- Stores and manages companies (Accounts) and people (Contacts)
- Captures interest from potential buyers (Leads)
- Tracks deals in progress (Opportunities)
- Records every call, meeting, and email (Activities)
- Provides a dashboard showing the health of the sales pipeline
- Controls who can see and do what (Role-Based Access Control)
- Sends email notifications for key events (Mock Email system)

**What it is built with:**
- A modern web interface (React with TypeScript)
- A robust backend API (Python with FastAPI)
- A database that stores all the data (SQLite, upgradeable to PostgreSQL)
- Docker for easy deployment anywhere

**Who built it for whom:**
This is built for sales teams — the people whose job it is to find customers and close deals. It is also a learning project demonstrating how a production-grade, full-stack web application is designed and built.

---

## 4. Who Are the Users?

This CRM has three types of users, each with different levels of access. This concept is called **Role-Based Access Control (RBAC)**.

### Role 1 — Sales Representative (Sales Rep)
**Who they are:** The frontline sellers. Their job is to find new customers and close deals.

**What they can do:**
- Create and manage their own Leads, Contacts, Accounts, and Opportunities
- Log Activities (calls, meetings, emails)
- View the dashboard to see their own pipeline
- Update their profile

**What they cannot do:**
- Delete records they don't own
- Manage other users
- Access administrative tools

---

### Role 2 — Manager
**Who they are:** A team leader who oversees multiple Sales Reps.

**What they can do:**
- Everything a Sales Rep can do
- View and manage all records (not just their own)
- See team-wide performance on the dashboard
- Create and edit records on behalf of others

**What they cannot do:**
- Create or delete user accounts
- Access the full Admin panel

---

### Role 3 — Administrator (Admin)
**Who they are:** The technical or operations owner of the CRM. Usually one person manages user accounts and system settings.

**What they can do:**
- Everything a Manager can do
- Create, update, and deactivate user accounts
- Seed the system with demo/test data
- Access all sections of the application

---

## 5. The Sales Process — How a Deal Flows

Understanding a CRM requires understanding how a sale actually works. Here is a typical journey from "stranger" to "paying customer":

```
STRANGER
   │
   │  Someone hears about your product (ad, referral, website)
   ▼
LEAD  ─────────── Status: New
   │
   │  Sales rep calls them for the first time
   ▼
LEAD  ─────────── Status: Contacted
   │
   │  They show genuine interest, have a budget, and need your product
   ▼
LEAD  ─────────── Status: Qualified
   │
   │  Sales rep converts the lead into an active deal
   ▼
OPPORTUNITY ────── Stage: Prospecting
   │
   │  Sales rep sends a formal written proposal
   ▼
OPPORTUNITY ────── Stage: Proposal
   │
   │  Customer and seller discuss price and terms
   ▼
OPPORTUNITY ────── Stage: Negotiation
   │
   ├──► Customer signs! ──► Stage: Closed-Won  🎉
   │
   └──► Customer walks away ──► Stage: Closed-Lost  😞
```

A CRM makes this invisible process **visible and manageable** — you can see exactly where every potential deal sits at any moment.

---

## 6. Core Concepts Explained

### Accounts

An **Account** represents a **company or organisation** that you do business with (or want to do business with).

**Real-world example:** "Acme Corp", "Google", "A local restaurant"

**What information is stored:**
| Field | What it means |
|-------|--------------|
| Name | The company's name |
| Industry | What sector they work in (e.g., "SaaS", "Retail") |
| Website | Their web address |
| Phone | Main office phone number |
| Address | Physical address |

**Rules:**
- You cannot delete an Account if there are still Contacts or Opportunities linked to it (the system protects you from accidental data loss)
- An Account can have many Contacts (multiple people at the same company)
- An Account can have many Opportunities (multiple deals with the same company)

---

### Contacts

A **Contact** represents a **real person** — a human being you talk to at a company.

**Real-world example:** "Jane Smith, Head of Procurement at Acme Corp"

**What information is stored:**
| Field | What it means |
|-------|--------------|
| First Name / Last Name | The person's name |
| Email | Their email address (unique in the system) |
| Phone | Their direct number |
| Job Title | Their role at the company |
| Account | Which company they work for |

**Rules:**
- A Contact can exist without being linked to an Account (e.g., a freelancer)
- If their Account is deleted, the Contact remains but the link is removed
- Email addresses must be unique — no two contacts can share the same email

---

### Leads

A **Lead** is a **potential customer** — someone who has shown some interest but has not yet been qualified as a real sales opportunity.

Think of it like this: imagine you run a gym. Someone fills in a form on your website saying "I'm interested in a membership." That person is a **Lead**. They might sign up, they might not. You don't know yet.

**What information is stored:**
| Field | What it means |
|-------|--------------|
| First / Last Name | The person's name |
| Email | Their contact email |
| Company | Where they work (if known) |
| Status | Where they are in the qualification process |
| Source | How they found you (e.g., "website", "referral", "cold call") |
| Notes | Anything the rep wants to remember |

**The Lead Status System (State Machine):**

A Lead moves through statuses in a specific order — you cannot skip steps or go backwards:

```
New ──► Contacted ──► Qualified ──► Lost
 └─────────────────────────────────────►
```

| Status | Meaning |
|--------|---------|
| **New** | Just captured, nobody has reached out yet |
| **Contacted** | A sales rep has made initial contact |
| **Qualified** | The lead has confirmed they have a need and a budget |
| **Lost** | They are not going to buy — this is a final/terminal state |

**Important rules:**
- A Lead marked as **Lost** cannot be changed back — it is final
- A qualified Lead can be **Converted** into an Opportunity (see next section)

**Why are Leads separate from Contacts?**
Because not everyone who shows interest becomes a real customer. Leads are "unverified" — you don't want to clutter your Contacts database with people who might never buy. Once qualified, they graduate to become a proper Contact and Opportunity.

---

### Opportunities

An **Opportunity** represents an **active deal in progress** — a real sales engagement where there is a genuine chance of winning business.

Opportunities are what sales managers care most about. They answer the question: "What is the sales team working on right now and how much is it worth?"

**What information is stored:**
| Field | What it means |
|-------|--------------|
| Title | A short description of the deal |
| Account | Which company this deal is with |
| Contact | The person handling the deal on the buyer's side |
| Stage | How far along the deal is |
| Value | How much the deal is worth (in currency) |
| Probability | Estimated chance (0–100%) of winning |
| Expected Close Date | When you expect the deal to be decided |

**The Opportunity Stage System:**

```
Prospecting ──► Proposal ──► Negotiation ──┬──► Closed-Won
                                            └──► Closed-Lost
```

| Stage | Meaning |
|-------|---------|
| **Prospecting** | Early exploration — interest confirmed but no formal proposal yet |
| **Proposal** | A formal written offer has been sent to the customer |
| **Negotiation** | Back-and-forth on price, terms, and conditions |
| **Closed-Won** | The customer said YES — deal is done! |
| **Closed-Lost** | The customer said NO or went elsewhere |

**The Pipeline:**
All open Opportunities together are called the **Sales Pipeline**. The total value of all open deals is called the **Pipeline Value**. Sales managers look at the pipeline constantly to forecast how much revenue is coming.

**Weighted Pipeline:**
Because not all deals will close, each opportunity's value is multiplied by its probability to give a more realistic forecast:
> A $100,000 deal at 50% probability = $50,000 weighted value

---

### Activities

An **Activity** is a **record of an interaction** — a log of something that happened between the sales team and a customer.

Every time a salesperson calls a customer, sends an email, or has a meeting, they log it as an Activity. This creates a complete history of the relationship.

**Types of Activities:**
| Type | Example |
|------|---------|
| **Call** | "Called Jane at Acme Corp to follow up on the proposal" |
| **Email** | "Sent pricing sheet to procurement team" |
| **Meeting** | "Product demo with the technical team on 14th June" |

**What information is stored:**
| Field | What it means |
|-------|--------------|
| Type | Call, Email, or Meeting |
| Subject | A short description of what happened |
| Notes | Detailed notes about the interaction |
| Activity Date | When this happened |
| Contact | Which person was involved |
| Opportunity | Which deal this relates to |

**Why Activities matter:**
- They keep a full audit trail of the relationship
- Managers can see if reps are actually talking to customers
- When a deal goes cold, you can look back and see why
- New team members can pick up a relationship where someone else left off

---

## 7. How Everything Connects

Here is a map showing how all the pieces relate to each other:

```
┌─────────────────────────────────────────────────────────────┐
│                        ACCOUNT                              │
│                    (e.g., Acme Corp)                        │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐     ┌───────────────────┐
        │    CONTACT    │     │   OPPORTUNITY     │
        │  (Jane Smith) │◄────│  (Software Deal)  │
        └───────┬───────┘     └────────┬──────────┘
                │                      │
                │              ┌───────▼──────────┐
                │              │    ACTIVITIES    │
                └─────────────►│  (Calls, Emails, │
                               │    Meetings)     │
                               └──────────────────┘

LEAD (potential customer)
   │
   │  [when qualified and converted]
   ▼
Creates/reuses ──► ACCOUNT + CONTACT + OPPORTUNITY
```

**In simple terms:**
1. A **company** is an Account
2. A **person at that company** is a Contact
3. A **deal with that company** is an Opportunity
4. A **potential buyer who hasn't been qualified yet** is a Lead
5. Every **interaction** (call, email, meeting) is an Activity

---

## 8. Features of This CRM

### Dashboard
The first screen you see after logging in. It shows:
- **Total Accounts** — how many companies are in the system
- **Active Leads** — how many leads are being worked on
- **Open Pipeline** — total value of all open opportunities
- **Weighted Pipeline** — probability-adjusted forecast value
- **Win Rate** — percentage of deals that end in Closed-Won
- **Pipeline by Stage** — a bar chart showing deal value per stage
- **Deals by Probability** — how deals are distributed by confidence level
- **Deals by Stage (Count)** — how many deals are at each stage
- **Closed Won vs Closed Lost** — summary of completed deals

### Accounts List & Detail
- View all companies in a searchable, sortable table
- Click into any account to see its contacts, opportunities, and details
- Create, edit, or delete accounts
- Protected deletion (won't let you delete if linked records exist)

### Contacts List & Detail
- View all people in a searchable, sortable table
- Click into any contact to see their activities and emails
- Create, edit, or delete contacts
- Filter by account

### Leads List & Detail
- View all leads with status filter tabs (All / New / Contacted / Qualified / Lost)
- Click into any lead to see full details and take actions
- Advance a lead's status (Contacted → Qualified)
- Convert a qualified lead into an Opportunity with one button click
- The system automatically creates an Account and Contact if they don't exist

### Opportunities List & Detail
- Two views: **Board view** (Kanban-style columns by stage) and **Table view**
- Click into any opportunity to see details, update the stage, and view activities
- Track value, probability, and expected close date

### Activities Log
- View all activities across the system
- Filter by type (All / Calls / Emails / Meetings)
- Log new activities directly

### User Management (Admin only)
- Create new user accounts
- Assign roles (Admin, Manager, Sales Rep)
- Seed demo users for testing

### Mock Email System
- When a new lead is created, the system generates an automatic notification email
- These mock emails are visible in the Admin section
- Simulates real-world CRM email integrations

### Profile Page
- Each user can edit their own display name
- View their role and account details

### Authentication
- Secure login with email and password
- JWT tokens (stored safely in memory, not localStorage)
- Automatic session expiry
- Protected routes — you cannot access the app without logging in

---

## 9. The Technology Stack

This section explains what technologies were used to build the CRM and why.

### Frontend (What the user sees in the browser)

| Technology | What it is | Why it's used |
|------------|-----------|---------------|
| **React 18** | JavaScript library for building UIs | Industry standard for modern web apps; component-based |
| **TypeScript** | JavaScript with types | Catches bugs before they happen; better code quality |
| **Vite** | Build tool | Fast development experience; modern replacement for Webpack |
| **Tailwind CSS** | CSS utility framework | Rapid, consistent styling without writing custom CSS files |
| **TanStack Query** | Data fetching library | Smart caching, loading states, and background data refresh |
| **React Router** | Page navigation | Enables multi-page navigation within a single-page app |
| **Recharts** | Chart library | Creates the dashboard bar charts and funnel visualisations |
| **Lucide React** | Icon library | Clean, consistent icons throughout the interface |

### Backend (The server that stores and processes data)

| Technology | What it is | Why it's used |
|------------|-----------|---------------|
| **Python** | Programming language | Readable, powerful, huge ecosystem |
| **FastAPI** | Web framework | Fast, modern, automatic API documentation |
| **SQLAlchemy** | Database ORM | Converts Python objects to/from database rows |
| **Pydantic** | Data validation | Ensures data coming in from the browser is valid |
| **Alembic** | Database migrations | Safely changes the database schema over time |
| **SQLite** | Database | Lightweight, file-based, no server needed for development |
| **JWT** | Authentication tokens | Secure, stateless user authentication |

### Infrastructure

| Technology | What it is | Why it's used |
|------------|-----------|---------------|
| **Docker** | Containerisation | Run the whole app with one command on any machine |
| **Nginx** | Web server | Serves the frontend files efficiently |

### How they all work together:

```
BROWSER (You)
    │
    │  Types URL, clicks buttons
    ▼
REACT FRONTEND (localhost:80)
    │
    │  Sends API requests (HTTP/JSON)
    ▼
FASTAPI BACKEND (localhost:8000)
    │
    │  Reads/writes data
    ▼
SQLITE DATABASE (file on disk)
```

---

## 10. Who Gets Helped and How

### Sales Representatives — The Day-to-Day Users

**Before this CRM:** A sales rep might use sticky notes, a personal spreadsheet, and their email inbox to track deals. They forget to follow up. They lose deals they could have won.

**With this CRM:**
- All their leads, contacts, and deals are in one place
- They can log a call in 30 seconds
- They see exactly which deals need attention
- Nothing falls through the cracks

### Sales Managers — The Supervisors

**Before this CRM:** A manager has to ask each rep "how are your deals going?" in a weekly meeting. They have no idea how the month will actually end up.

**With this CRM:**
- Real-time dashboard showing the team's pipeline at a glance
- Win rate trends to identify coaching opportunities
- Activity logs to see who is putting in the work
- Probability-weighted forecasts to predict monthly revenue

### Business Owners — The Decision Makers

**Before this CRM:** Gut feeling and spreadsheets that nobody trusts.

**With this CRM:**
- Data-driven decisions on hiring, marketing spend, and revenue targets
- Historical data on what types of leads convert best
- Clear view of won/lost deals to understand competitive position

### New Sales Team Members — The Onboardees

**Before this CRM:** A new hire has to ask everyone "who is this customer? what did we discuss?" The person who knew the client left the company and the knowledge left with them.

**With this CRM:**
- Complete interaction history for every account
- Activity logs showing what was discussed and agreed
- Full pipeline context so the new person can pick up exactly where the last person left off

---

## 11. Real-World Example: A Day in the Life

Let's follow **Sarah**, a Sales Rep at a software company, through a working day using this CRM.

**8:30 AM — Starts with the Dashboard**
Sarah logs in and immediately sees:
- She has 3 open opportunities worth $450,000 in total
- Her win rate this month is 40%
- 5 new leads came in overnight from the company website

**9:00 AM — Processes a new Lead**
She opens the Leads section and sees "John Carter" from "TechStart Ltd" — status: **New**.
- She calls John. He's interested! She updates the status to **Contacted**.
- She logs an Activity: *"Called John at TechStart. Very interested in the Enterprise plan. Needs approval from CFO. Follow up next Monday."*

**10:30 AM — Follows up on an Opportunity**
Sarah checks her pipeline board. She has a deal called "TechStart Enterprise Licence" in the **Proposal** stage.
- She sends a revised proposal by email.
- She logs an Activity: *"Sent revised pricing proposal. Reduced by 8% to match their budget."*
- She updates the probability from 50% to 65%.

**2:00 PM — Converts a Qualified Lead**
Last week, Sarah marked a lead called "Maria Gonzalez" from "DesignHouse" as **Qualified**.
- Today she hits the **Convert to Opportunity** button.
- The system automatically:
  - Creates a new Account: "DesignHouse"
  - Creates a new Contact: "Maria Gonzalez"
  - Creates a new Opportunity: "DesignHouse — Starter Pack" in the **Prospecting** stage
- Sarah adds a value of $12,000 and sets the expected close date to end of month.

**4:00 PM — Manager reviews the pipeline**
Sarah's manager, **David**, opens his dashboard. He can see:
- Total team pipeline: $2.3M
- Win rate: 38% (slightly below the 40% target)
- Sarah's conversion rate is the highest on the team

David clicks into the Opportunities section and sees Sarah has moved two deals to **Negotiation** this week. He sends her a message to discuss pricing strategy.

**5:00 PM — Everything saved, nothing lost**
Sarah closes her laptop. Every call, email, and deal update she made today is safely stored. Tomorrow, she can pick up exactly where she left off.

---

## 12. What's Inside the Application (Screens)

### Login Page
- Clean, branded login form
- Email + password authentication
- Redirects to dashboard on success

### Dashboard
- KPI cards across the top (5 metrics)
- Pipeline by Stage chart (bar chart of deal values)
- Recent Activity feed (latest logs from the team)
- Deals by Probability chart (distribution of deal confidence)
- Deals by Stage Count chart (how many deals at each stage)
- Closed Won vs Closed Lost summary (count and total value)

### Accounts
- **List view:** Searchable, sortable table of all companies
- **Detail view:** Company info + linked contacts + linked opportunities

### Contacts
- **List view:** Searchable, sortable table of all people
- **Detail view:** Person info + activity history + emails received

### Leads
- **List view:** Filterable by status tabs + sortable table
- **Detail view:** Lead info + status transition buttons + convert button

### Opportunities
- **Board view (Kanban):** Cards organised into columns by stage — drag-free but visual
- **Table view:** Sortable table with all deal details
- **Detail view:** Deal info + stage update buttons + linked activities

### Activities
- **List view:** Filterable by type (call/email/meeting), sortable table
- **Log Activity button:** Quick form to add a new activity

### Admin Section
- **User Management:** Create users, assign roles, seed demo accounts
- **Mock Email Inbox:** View system-generated emails from lead creation

### Profile Page
- View your role and account info
- Edit your display name

---

## 13. Summary at a Glance

| Concept | In One Line |
|---------|-------------|
| **CRM** | Software that helps a sales team manage customer relationships |
| **Account** | A company you do business with |
| **Contact** | A person at that company |
| **Lead** | A potential customer, not yet qualified |
| **Opportunity** | An active deal in progress |
| **Activity** | A record of a call, email, or meeting |
| **Pipeline** | All your open deals combined |
| **Win Rate** | Percentage of deals that end in a sale |
| **Sales Rep** | Frontline seller — creates and manages their own records |
| **Manager** | Team leader — sees all records, coaches reps |
| **Admin** | System owner — manages users and settings |
| **Convert** | Turning a qualified Lead into an Opportunity |
| **Dashboard** | Single-screen summary of the health of the sales business |
| **JWT Auth** | Secure login system — only logged-in users can access the app |
| **RBAC** | Role-Based Access Control — different users see different things |

---

## Final Thought

A CRM is not just a piece of software — it is a system of discipline and visibility for a sales team. Without a CRM, a growing sales team will lose deals, duplicate effort, and have no idea how the business is actually performing.

This project implements all the core concepts of a professional CRM in a clean, modern, well-structured codebase. For a student, it is an excellent example of:

- **Full-stack web development** (frontend + backend + database)
- **Domain modelling** (how real business concepts become data structures)
- **User role design** (who can see and do what)
- **REST API design** (how the browser and server communicate)
- **State machines** (how Lead statuses and Opportunity stages work)
- **Data relationships** (how Accounts, Contacts, Leads, and Opportunities are connected)

If you understand this CRM inside and out, you understand a large proportion of how real-world business software is designed and built.
