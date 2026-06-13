# CRM Platform — Demo Walkthrough

A step-by-step guide to demonstrate the full CRM workflow end-to-end.

---

## Prerequisites

1. Backend running at `http://localhost:8000`
2. Frontend running at `http://localhost:5173` (dev) or `http://localhost` (Docker)
3. Demo users seeded (see Step 0)

---

## Step 0 — First-Time Setup

**Seed demo users:**
1. Open the app and log in as `admin@crm.local` / `password123`
2. Navigate to **Admin → Users**
3. Click **Seed Demo Users** → verify "3 created, 0 skipped"

**Seed demo CRM data:**
1. Navigate to **Admin → Seed Manager**
2. Click **Seed Demo Data** → verify counts (4 accounts, 4 contacts, 3 leads, 4 opportunities)

*Expected result:* Dashboard shows KPIs populated with demo data.

---

## Step 1 — Create an Account

1. Click **Accounts** in the sidebar
2. Click **New Account**
3. Fill in:
   - Name: `Acme Corporation`
   - Industry: `Technology`
   - Website: `https://acme.example.com`
4. Click **Save**

*Expected:* "Account created" toast; Acme appears in the list.

📸 *[Screenshot placeholder: Accounts list with Acme Corporation]*

---

## Step 2 — Create a Contact

1. Click **Contacts** in the sidebar
2. Click **New Contact**
3. Fill in:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `jane.smith@acme.example.com`
   - Job Title: `VP of Engineering`
   - Account: `Acme Corporation`
4. Click **Save**

*Expected:* "Contact created" toast; Jane appears in the Contacts list.

📸 *[Screenshot placeholder: Contact detail page for Jane Smith]*

---

## Step 3 — Create a Lead

1. Click **Leads** in the sidebar
2. Click **New Lead**
3. Fill in:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `jane.smith@acme.example.com`
   - Company: `Acme Corporation`
   - Source: `Referral`
4. Click **Save**

*Expected:*
- "Lead created" toast
- Lead appears with status **New**
- A notification email is automatically sent to `crm-leads@company.internal` (visible in Admin → Mock Email)

📸 *[Screenshot placeholder: Lead detail page — status: New]*

---

## Step 4 — Advance Lead Status

1. Open the Jane Smith lead
2. Click **Update Status → Contacted**
3. Add a note: `Left voicemail, follow up Thursday`
4. Click **Save**

*Expected:* Status changes to **Contacted**.

5. Click **Update Status → Qualified**

*Expected:* Status changes to **Qualified**. The **Convert to Opportunity** button becomes available.

📸 *[Screenshot placeholder: Lead — status: Qualified with Convert button visible]*

---

## Step 5 — Convert Lead to Opportunity

1. On the qualified Jane Smith lead, click **Convert to Opportunity**
2. Confirm the conversion

*Expected:*
- An Opportunity is automatically created: `Jane Smith — Opportunity`
- A Contact is found/created from the lead email
- An Account is found/created from the company name
- Lead shows `converted_opportunity_id`

📸 *[Screenshot placeholder: Opportunity created from lead conversion]*

---

## Step 6 — Advance Opportunity Stage

1. Navigate to **Pipeline**
2. Find `Jane Smith — Opportunity` in the **Prospecting** column
3. Open the opportunity → click **Edit**
4. Change Stage to **Proposal**, Value to `$45,000`, Probability to `50%`
5. Save

*Expected:* Card moves to the **Proposal** column on the board view.

📸 *[Screenshot placeholder: Pipeline board with opportunity in Proposal column]*

---

## Step 7 — Log Activities

1. Open the opportunity → click **Log Activity**
2. Fill in:
   - Type: `Meeting`
   - Subject: `Requirements discovery call`
   - Date: today
3. Click **Save**

4. Log another activity:
   - Type: `Email`
   - Subject: `Sent proposal document`

*Expected:* Activities appear in the Activities tab of the opportunity and in **Activities** (global log).

📸 *[Screenshot placeholder: Activities log for the opportunity]*

---

## Step 8 — View Pipeline

1. Click **Pipeline** in the sidebar
2. Toggle between **Board** and **Table** views

*Expected:*
- Board shows cards in their respective stage columns
- Table shows all opportunities sortable by title, stage, value, close date

Try the **Search** bar — type `Jane` to filter the pipeline instantly.

---

## Step 9 — Compose Email from Contact

1. Navigate to **Contacts → Jane Smith**
2. Click **Compose Email**
3. Fill in:
   - Subject: `Following up on your proposal`
   - Body: `Hi Jane, just checking in on the proposal we sent over...`
4. Click **Send**

*Expected:*
- Email appears in **Admin → Mock Email** inbox
- Jane's contact detail shows the email in the History tab

📸 *[Screenshot placeholder: Mock Email inbox with composed email]*

---

## Step 10 — Sort & Filter

Navigate to any list page (Accounts, Contacts, Leads, etc.) and:

1. Type in the **Search** bar to filter in real-time
2. Change the **Sort** dropdown (e.g., sort by Name A→Z)
3. Click the **Asc/Desc** toggle to reverse order
4. Click **Reset** to return to defaults

*Expected:* List updates immediately with matching/sorted results.

---

## Step 11 — User Management (Admin Only)

1. Navigate to **Admin → Users**
2. Click **New User**:
   - Email: `demo-user@crm.local`
   - Password: `password123`
   - Role: `Manager`
3. Save → user appears in the table

4. Click **Edit** on the new user → change role to **Sales Rep** → Save

5. Click **Edit** → toggle **Active** off → Save (user can no longer log in)

📸 *[Screenshot placeholder: User Management page with role badge chips]*

---

## Step 12 — Profile Page

1. Click your user card at the **bottom of the sidebar**
2. Profile page shows: email, role badge, display name, member since

3. Click **Edit** next to Display Name
4. Enter: `Demo Admin`
5. Click **Save**

*Expected:*
- "Display name updated" toast
- Sidebar user card updates to show `Demo Admin`
- Name persists across page refreshes

---

## Step 13 — Clear Database

1. Navigate to **Admin → Seed Manager**
2. Click **Clear All Data**
3. Confirm the destructive action

*Expected:*
- All CRM records deleted (leads, contacts, accounts, opportunities, activities)
- User accounts are **not** deleted
- Dashboard KPIs reset to zero

Re-seed with **Seed Demo Data** to restore the demo state.

---

## Appendix: Role Verification

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View all leads | ✓ | ✓ | ✓ |
| Create lead | ✓ | ✓ | ✓ (own) |
| Edit any lead | ✓ | ✓ | ✗ (own only) |
| Delete lead | ✓ | ✓ | ✗ |
| Create account | ✓ | ✓ | ✗ |
| Delete account | ✓ | ✓ | ✗ |
| Manage users | ✓ | ✗ | ✗ |
| Seed/clear data | ✓ | ✗ | ✗ |
