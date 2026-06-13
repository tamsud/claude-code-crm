"""
Demo seed service.

Creates 6 realistic CRM scenarios covering all entity types, lead statuses,
opportunity stages, and activity types.  The seed is idempotent: it clears
all existing data before inserting the demo records.

⚠ Intended for development / demo use only.  Do not expose in production
  without access controls.
"""
from datetime import UTC, datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.activity import Activity
from app.models.contact import Contact
from app.models.email_message import EmailMessage
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.schemas.seed import SeedCounts, SeedResponse

_FROM = "crm@demo.local"


async def clear_all(db: AsyncSession) -> None:
    """Delete all rows from every CRM table in FK-safe order."""
    await db.execute(text("PRAGMA foreign_keys=OFF"))
    for table in ("activities", "leads", "opportunities", "contacts", "email_messages", "accounts"):
        await db.execute(text(f"DELETE FROM {table}"))
    await db.execute(text("PRAGMA foreign_keys=ON"))
    await db.commit()


async def seed_demo(db: AsyncSession) -> SeedResponse:
    """Wipe existing data and populate 6 demo scenarios."""
    await clear_all(db)

    now = datetime.now(UTC)

    def ago(days: int) -> datetime:
        return now - timedelta(days=days)

    accounts: list[Account] = []
    contacts: list[Contact] = []
    leads: list[Lead] = []
    opportunities: list[Opportunity] = []
    activities: list[Activity] = []
    emails: list[EmailMessage] = []

    # ── Scenario 1: TechStart Inc ─────────────────────────────────────────
    # Active prospecting deal sourced from a qualified lead that was converted.
    acc1 = Account(name="TechStart Inc", industry="Technology", website="https://techstart.io",
                   phone="+1-415-555-0101")
    db.add(acc1)
    await db.flush()
    accounts.append(acc1)

    ctr1 = Contact(first_name="Tom", last_name="Wilson", email="tom.wilson@techstart.io",
                   job_title="Chief Technology Officer", phone="+1-415-555-0102",
                   account_id=acc1.id)
    db.add(ctr1)
    await db.flush()
    contacts.append(ctr1)

    opp1 = Opportunity(
        title="TechStart Inc — Enterprise Platform",
        account_id=acc1.id, contact_id=ctr1.id,
        stage="prospecting", value=75000.0, probability=30,
    )
    db.add(opp1)
    await db.flush()
    opportunities.append(opp1)

    # Lead that sourced this opportunity (already converted)
    lead1 = Lead(first_name="Tom", last_name="Wilson", email="tom.wilson@techstart.io",
                 company="TechStart Inc", source="Website",
                 status="qualified", converted_opportunity_id=opp1.id)
    db.add(lead1)
    await db.flush()
    leads.append(lead1)

    a = Activity(type="call", subject="Initial discovery call with Tom",
                 activity_date=ago(14), contact_id=ctr1.id, opportunity_id=opp1.id)
    db.add(a); activities.append(a)

    a = Activity(type="email", subject="Sent enterprise platform proposal",
                 activity_date=ago(7), opportunity_id=opp1.id)
    db.add(a); activities.append(a)

    e = EmailMessage(from_email=_FROM, to_email=ctr1.email,
                     subject="Welcome to Sales CRM",
                     body=f"Hi {ctr1.first_name}, thanks for your interest in our platform.")
    db.add(e); emails.append(e)

    e = EmailMessage(from_email=_FROM, to_email=ctr1.email,
                     subject="Your proposal is ready",
                     body="Please find attached the enterprise platform proposal.")
    db.add(e); emails.append(e)

    # ── Scenario 2: HealthCare Pro ────────────────────────────────────────
    # Deal in the proposal stage created directly (no lead conversion).
    acc2 = Account(name="HealthCare Pro", industry="Healthcare",
                   website="https://healthcarepro.com", phone="+1-212-555-0200")
    db.add(acc2)
    await db.flush()
    accounts.append(acc2)

    ctr2 = Contact(first_name="Sarah", last_name="Johnson",
                   email="sarah.j@healthcarepro.com",
                   job_title="VP of Operations", account_id=acc2.id)
    db.add(ctr2)
    await db.flush()
    contacts.append(ctr2)

    opp2 = Opportunity(
        title="HealthCare Pro — Annual License",
        account_id=acc2.id, contact_id=ctr2.id,
        stage="proposal", value=120000.0, probability=60,
        expected_close_date=(now + timedelta(days=79)).date(),
    )
    db.add(opp2)
    await db.flush()
    opportunities.append(opp2)

    a = Activity(type="meeting", subject="Requirements gathering workshop",
                 activity_date=ago(21), contact_id=ctr2.id, opportunity_id=opp2.id)
    db.add(a); activities.append(a)

    a = Activity(type="email", subject="Follow-up on proposal",
                 activity_date=ago(10), contact_id=ctr2.id)
    db.add(a); activities.append(a)

    e = EmailMessage(from_email=_FROM, to_email=ctr2.email,
                     subject="Welcome to Sales CRM",
                     body=f"Hi {ctr2.first_name}, looking forward to working together.")
    db.add(e); emails.append(e)

    e = EmailMessage(from_email=_FROM, to_email=ctr2.email,
                     subject="Annual License proposal enclosed",
                     body="Please review the attached annual license proposal.")
    db.add(e); emails.append(e)

    # ── Scenario 3: Finance Solutions Ltd ────────────────────────────────
    # Deal in active negotiation with multiple touchpoints.
    acc3 = Account(name="Finance Solutions Ltd", industry="Financial Services",
                   website="https://financesolutions.co")
    db.add(acc3)
    await db.flush()
    accounts.append(acc3)

    ctr3 = Contact(first_name="Michael", last_name="Chen",
                   email="m.chen@financesolutions.co",
                   job_title="Director of IT", account_id=acc3.id)
    db.add(ctr3)
    await db.flush()
    contacts.append(ctr3)

    opp3 = Opportunity(
        title="Finance Solutions — Security Suite",
        account_id=acc3.id, contact_id=ctr3.id,
        stage="negotiation", value=250000.0, probability=75,
        expected_close_date=(now + timedelta(days=32)).date(),
    )
    db.add(opp3)
    await db.flush()
    opportunities.append(opp3)

    a = Activity(type="call", subject="Initial pricing negotiation call",
                 activity_date=ago(28), opportunity_id=opp3.id)
    db.add(a); activities.append(a)

    a = Activity(type="meeting", subject="Final review meeting with legal team",
                 activity_date=ago(14), contact_id=ctr3.id, opportunity_id=opp3.id)
    db.add(a); activities.append(a)

    a = Activity(type="call", subject="Verbal commitment call",
                 activity_date=ago(5), contact_id=ctr3.id, opportunity_id=opp3.id)
    db.add(a); activities.append(a)

    e = EmailMessage(from_email=_FROM, to_email=ctr3.email,
                     subject="Welcome to Sales CRM",
                     body=f"Hi {ctr3.first_name}, great to connect with you.")
    db.add(e); emails.append(e)

    e = EmailMessage(from_email=_FROM, to_email=ctr3.email,
                     subject="Security Suite contract for review",
                     body="Please find the updated contract terms for the Security Suite.")
    db.add(e); emails.append(e)

    # ── Scenario 4: Global Retail Corp ───────────────────────────────────
    # Closed-won deal — the full pipeline was completed.
    acc4 = Account(name="Global Retail Corp", industry="Retail",
                   website="https://globalretail.com", phone="+44-20-7946-0000")
    db.add(acc4)
    await db.flush()
    accounts.append(acc4)

    ctr4 = Contact(first_name="Emma", last_name="Davis",
                   email="emma.davis@globalretail.com",
                   job_title="Chief Information Officer", account_id=acc4.id)
    db.add(ctr4)
    await db.flush()
    contacts.append(ctr4)

    opp4 = Opportunity(
        title="Global Retail — Digital Transformation",
        account_id=acc4.id, contact_id=ctr4.id,
        stage="closed-won", value=500000.0, probability=100,
    )
    db.add(opp4)
    await db.flush()
    opportunities.append(opp4)

    a = Activity(type="email", subject="Contract signed — thank you, Emma!",
                 activity_date=ago(45), contact_id=ctr4.id, opportunity_id=opp4.id)
    db.add(a); activities.append(a)

    a = Activity(type="meeting", subject="Project kickoff meeting",
                 activity_date=ago(30), opportunity_id=opp4.id)
    db.add(a); activities.append(a)

    e = EmailMessage(from_email=_FROM, to_email=ctr4.email,
                     subject="Contract executed — welcome aboard!",
                     body=f"Hi {ctr4.first_name}, we're thrilled to have Global Retail as a customer!")
    db.add(e); emails.append(e)

    e = EmailMessage(from_email=_FROM, to_email=ctr4.email,
                     subject="Your project kickoff pack",
                     body="Please find your onboarding materials and kickoff agenda attached.")
    db.add(e); emails.append(e)

    # ── Scenario 5: Lost lead ─────────────────────────────────────────────
    # A lead that was worked but didn't convert.
    lead5 = Lead(first_name="James", last_name="Park",
                 email="james.park@startupx.io", company="StartupX",
                 source="Cold outreach", status="lost",
                 notes="Budget constraints — revisit in Q4.")
    db.add(lead5)
    leads.append(lead5)

    # ── Scenario 6: New inbound lead ──────────────────────────────────────
    # A brand-new lead that just came in.
    lead6 = Lead(first_name="Lisa", last_name="Chen",
                 email="lisa.chen@newco.com", company="NewCo Ltd",
                 source="Referral")
    db.add(lead6)
    leads.append(lead6)

    await db.commit()

    return SeedResponse(
        message="Demo data seeded successfully.",
        seeded=SeedCounts(
            accounts=len(accounts),
            contacts=len(contacts),
            leads=len(leads),
            opportunities=len(opportunities),
            activities=len(activities),
            emails=len(emails),
        ),
    )
