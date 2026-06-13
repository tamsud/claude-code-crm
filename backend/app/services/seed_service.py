"""
Demo seed service.

Creates rich, realistic CRM demo data:
  - 20 Accounts across diverse industries
  - 30 Contacts spread across accounts
  - 60 Leads covering all statuses and sources
  - 55 Opportunities covering all stages and value ranges
  - 80+ Activities (calls, emails, meetings)
  - Email messages for contacts

The seed is idempotent: it clears all existing data before inserting.

⚠ Intended for development / demo use only.
"""
from datetime import UTC, date, datetime, timedelta

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


def _d(days_ago: int) -> datetime:
    return datetime.now(UTC) - timedelta(days=days_ago)


def _date(days_from_now: int) -> date:
    return (datetime.now(UTC) + timedelta(days=days_from_now)).date()


async def seed_demo(db: AsyncSession) -> SeedResponse:
    """Wipe existing data and populate rich demo data (50+ per entity)."""
    await clear_all(db)

    accounts: list[Account] = []
    contacts: list[Contact] = []
    leads: list[Lead] = []
    opportunities: list[Opportunity] = []
    activities: list[Activity] = []
    emails: list[EmailMessage] = []

    # ─────────────────────────────────────────────────────────────────────
    # ACCOUNTS (20)
    # ─────────────────────────────────────────────────────────────────────
    account_data = [
        ("TechStart Inc",          "Technology",          "https://techstart.io",            "+1-415-555-0101"),
        ("HealthCare Pro",         "Healthcare",          "https://healthcarepro.com",        "+1-212-555-0200"),
        ("Finance Solutions Ltd",  "Financial Services",  "https://financesolutions.co",      "+44-20-7000-0001"),
        ("Global Retail Corp",     "Retail",              "https://globalretail.com",         "+44-20-7946-0000"),
        ("Logistics Plus",         "Logistics",           "https://logisticsplus.net",        "+1-312-555-0300"),
        ("EduTech Academy",        "Education",           "https://edutechacademy.io",        "+1-650-555-0400"),
        ("GreenEnergy Co",         "Energy",              "https://greenenergy.co",           "+1-512-555-0500"),
        ("MediaHouse Group",       "Media & Publishing",  "https://mediahousegroup.com",      "+1-646-555-0600"),
        ("CloudBase Systems",      "Technology",          "https://cloudbase.io",             "+1-408-555-0700"),
        ("BioPharm Research",      "Pharmaceuticals",     "https://biopharmlabs.com",         "+1-617-555-0800"),
        ("RetailNow Inc",          "Retail",              "https://retailnow.com",            "+1-713-555-0900"),
        ("SmartManufacturing Co",  "Manufacturing",       "https://smartmfg.com",             "+1-313-555-1000"),
        ("LegalTech Partners",     "Legal",               "https://legaltechpartners.com",    "+1-202-555-1100"),
        ("PropTech Ventures",      "Real Estate",         "https://proptechventures.io",      "+1-305-555-1200"),
        ("CyberShield Security",   "Cybersecurity",       "https://cybershield.io",           "+1-571-555-1300"),
        ("AgroSmart Ltd",          "Agriculture",         "https://agrosmart.com",            "+1-515-555-1400"),
        ("TravelSuite Global",     "Travel & Tourism",    "https://travelsuite.com",          "+1-305-555-1500"),
        ("InsureWell Corp",        "Insurance",           "https://insurewell.com",           "+1-860-555-1600"),
        ("AutoDrive Solutions",    "Automotive",          "https://autodrivesolutions.com",   "+1-248-555-1700"),
        ("NextGen Analytics",      "Data & Analytics",    "https://nextgenanalytics.ai",      "+1-206-555-1800"),
    ]

    accs: list[Account] = []
    for name, industry, website, phone in account_data:
        a = Account(name=name, industry=industry, website=website, phone=phone)
        db.add(a)
        accs.append(a)
    await db.flush()
    accounts.extend(accs)

    # ─────────────────────────────────────────────────────────────────────
    # CONTACTS (30 — 1–2 per account)
    # ─────────────────────────────────────────────────────────────────────
    contact_data = [
        # (first, last, email, title, account_index)
        ("Tom",       "Wilson",    "tom.wilson@techstart.io",        "CTO",                    0),
        ("Priya",     "Sharma",    "priya.s@techstart.io",           "Head of Engineering",    0),
        ("Sarah",     "Johnson",   "sarah.j@healthcarepro.com",      "VP of Operations",       1),
        ("Marcus",    "Lee",       "m.lee@healthcarepro.com",        "Procurement Manager",    1),
        ("Michael",   "Chen",      "m.chen@financesolutions.co",     "Director of IT",         2),
        ("Emma",      "Davis",     "emma.davis@globalretail.com",    "CIO",                    3),
        ("Oliver",    "Brown",     "o.brown@logisticsplus.net",      "COO",                    4),
        ("Aisha",     "Patel",     "a.patel@edutechacademy.io",      "Head of Partnerships",   5),
        ("Liam",      "Garcia",    "l.garcia@greenenergy.co",        "VP Sales",               6),
        ("Zoe",       "Martinez",  "z.martinez@mediahousegroup.com", "Director of Technology", 7),
        ("Noah",      "Anderson",  "n.anderson@cloudbase.io",        "CEO",                    8),
        ("Isabelle",  "Thomas",    "i.thomas@biopharmlabs.com",      "Research Director",      9),
        ("Ethan",     "Jackson",   "e.jackson@retailnow.com",        "Buying Manager",         10),
        ("Ava",       "White",     "a.white@smartmfg.com",           "Operations VP",          11),
        ("Luca",      "Harris",    "l.harris@legaltechpartners.com", "Managing Partner",       12),
        ("Sofia",     "Clark",     "s.clark@proptechventures.io",    "Head of Product",        13),
        ("James",     "Lewis",     "j.lewis@cybershield.io",         "CISO",                   14),
        ("Mia",       "Robinson",  "m.robinson@agrosmart.com",       "CEO",                    15),
        ("Henry",     "Walker",    "h.walker@travelsuite.com",       "VP Partnerships",        16),
        ("Charlotte", "Hall",      "c.hall@insurewell.com",          "Head of IT",             17),
        ("Alexander", "Young",     "a.young@autodrivesolutions.com", "Innovation Director",    18),
        ("Ella",      "King",      "e.king@nextgenanalytics.ai",     "Chief Data Officer",     19),
        ("Ryan",      "Scott",     "r.scott@techstart.io",           "Product Manager",        0),
        ("Nina",      "Green",     "n.green@cloudbase.io",           "Head of Sales",          8),
        ("Carlos",    "Adams",     "c.adams@greenenergy.co",         "Account Executive",      6),
        ("Diana",     "Baker",     "d.baker@retailnow.com",          "Digital Manager",        10),
        ("Felix",     "Nelson",    "f.nelson@financesolutions.co",   "CFO",                    2),
        ("Grace",     "Carter",    "g.carter@logisticsplus.net",     "IT Director",            4),
        ("Hugo",      "Mitchell",  "h.mitchell@cybershield.io",      "Sales Engineer",         14),
        ("Iris",      "Perez",     "i.perez@mediahousegroup.com",    "VP Marketing",           7),
    ]

    ctrs: list[Contact] = []
    for first, last, email, title, acc_idx in contact_data:
        c = Contact(first_name=first, last_name=last, email=email,
                    job_title=title, account_id=accs[acc_idx].id)
        db.add(c)
        ctrs.append(c)
    await db.flush()
    contacts.extend(ctrs)

    # ─────────────────────────────────────────────────────────────────────
    # OPPORTUNITIES (55 — spread across all stages, values, and probabilities)
    # ─────────────────────────────────────────────────────────────────────
    opp_data = [
        # (title, acc_idx, ctr_idx, stage, value, prob, close_days)
        ("TechStart — Enterprise Platform",       0,  0,  "prospecting",   75000,  30,  90),
        ("TechStart — Support Plan",              0,  22, "proposal",      18000,  55,  45),
        ("HealthCare Pro — Annual License",       1,  2,  "proposal",     120000,  60,  79),
        ("HealthCare Pro — Upgrade Bundle",       1,  3,  "prospecting",   45000,  25, 120),
        ("Finance Solutions — Security Suite",    2,  4,  "negotiation",  250000,  75,  32),
        ("Finance Solutions — Analytics Add-on",  2,  26, "proposal",      60000,  50,  60),
        ("Global Retail — Digital Transformation",3,  5,  "closed-won",   500000, 100,  -1),
        ("Logistics Plus — Fleet Management",     4,  6,  "prospecting",   30000,  20,  90),
        ("Logistics Plus — Route Optimiser",      4,  27, "negotiation",   85000,  70,  21),
        ("EduTech Academy — LMS Platform",        5,  7,  "proposal",      40000,  65,  30),
        ("GreenEnergy — Monitoring Dashboard",    6,  8,  "closed-won",    95000, 100,  -1),
        ("GreenEnergy — Field App",               6,  24, "prospecting",   22000,  15, 180),
        ("MediaHouse — Content Platform",         7,  9,  "negotiation",  175000,  80,  14),
        ("MediaHouse — Analytics Suite",          7,  29, "proposal",      55000,  45,  45),
        ("CloudBase — Infrastructure Deal",       8,  10, "closed-won",   310000, 100,  -1),
        ("CloudBase — DevOps Tooling",            8,  23, "prospecting",   28000,  20, 120),
        ("BioPharm — Research Data Platform",     9,  11, "negotiation",  420000,  85,  10),
        ("RetailNow — E-Commerce Suite",          10, 12, "proposal",      70000,  55,  55),
        ("RetailNow — Loyalty Module",            10, 25, "prospecting",   19000,  25, 100),
        ("SmartMfg — ERP Integration",            11, 13, "negotiation",  190000,  72,  28),
        ("SmartMfg — IoT Sensor Platform",        11, 13, "proposal",      82000,  60,  50),
        ("LegalTech — Document Management",       12, 14, "closed-lost",   48000,   0,  -1),
        ("PropTech — Property Analytics",         13, 15, "prospecting",   35000,  30,  90),
        ("PropTech — Agent Portal",               13, 15, "proposal",      27000,  50,  40),
        ("CyberShield — Enterprise Security",     14, 16, "negotiation",  320000,  78,  18),
        ("CyberShield — Compliance Module",       14, 28, "proposal",      64000,  55,  35),
        ("AgroSmart — Crop Intelligence",         15, 17, "closed-won",    58000, 100,  -1),
        ("TravelSuite — Booking Platform",        16, 18, "prospecting",   90000,  20, 150),
        ("InsureWell — Claims Automation",        17, 19, "negotiation",  140000,  70,  25),
        ("AutoDrive — Fleet Analytics",           18, 20, "proposal",     115000,  60,  45),
        ("NextGen — Predictive Analytics",        19, 21, "closed-won",   280000, 100,  -1),
        ("NextGen — Data Warehouse",              19, 21, "negotiation",  195000,  82,  12),
        ("TechStart — Mobile SDK",                0,  22, "closed-lost",   15000,   0,  -1),
        ("HealthCare Pro — Patient Portal",       1,  2,  "prospecting",   55000,  25, 120),
        ("Finance Solutions — API Gateway",       2,  4,  "closed-won",   105000, 100,  -1),
        ("Logistics Plus — Warehouse Module",     4,  27, "prospecting",   38000,  20, 100),
        ("EduTech — Student Analytics",           5,  7,  "closed-lost",   25000,   0,  -1),
        ("GreenEnergy — Billing System",          6,  8,  "proposal",      68000,  50,  60),
        ("MediaHouse — Subscription Platform",    7,  9,  "closed-won",   230000, 100,  -1),
        ("CloudBase — Kubernetes Managed",        8,  10, "proposal",      77000,  45,  50),
        ("BioPharm — Clinical Trial Module",      9,  11, "prospecting",  125000,  15, 200),
        ("RetailNow — POS Integration",           10, 12, "closed-won",    44000, 100,  -1),
        ("SmartMfg — Predictive Maintenance",     11, 13, "prospecting",   66000,  20, 120),
        ("LegalTech — Client Portal",             12, 14, "proposal",      31000,  55,  35),
        ("PropTech — Virtual Tours Module",       13, 15, "closed-lost",   18000,   0,  -1),
        ("CyberShield — SOC as a Service",        14, 16, "closed-won",   480000, 100,  -1),
        ("AgroSmart — Satellite Imaging",         15, 17, "proposal",      44000,  40,  60),
        ("TravelSuite — Corporate Travel",        16, 18, "negotiation",  160000,  75,  20),
        ("InsureWell — Fraud Detection",          17, 19, "prospecting",   85000,  20, 150),
        ("AutoDrive — Telematics Platform",       18, 20, "closed-lost",   72000,   0,  -1),
        ("NextGen — Real-time Dashboard",         19, 21, "proposal",      48000,  50,  40),
        ("TechStart — Cloud Migration",           0,  0,  "negotiation",  210000,  80,  15),
        ("HealthCare Pro — Telehealth Suite",     1,  3,  "negotiation",  180000,  68,  22),
        ("Finance Solutions — Reporting Suite",   2,  26, "closed-won",    92000, 100,  -1),
        ("CloudBase — Disaster Recovery",         8,  23, "prospecting",   54000,  25, 110),
    ]

    opps: list[Opportunity] = []
    for title, acc_i, ctr_i, stage, value, prob, close_days in opp_data:
        close = _date(close_days) if close_days > 0 else None
        o = Opportunity(title=title, account_id=accs[acc_i].id, contact_id=ctrs[ctr_i].id,
                        stage=stage, value=float(value), probability=prob,
                        expected_close_date=close)
        db.add(o)
        opps.append(o)
    await db.flush()
    opportunities.extend(opps)

    # ─────────────────────────────────────────────────────────────────────
    # LEADS (60 — all statuses, multiple sources)
    # ─────────────────────────────────────────────────────────────────────
    lead_data = [
        # (first, last, email, company, status, source, notes, converted_opp_idx or None)
        ("Tom",      "Wilson",    "tom.wilson@techstart.io",         "TechStart Inc",          "qualified", "Website",       None,                                          0),
        ("James",    "Park",      "james.park@startupx.io",          "StartupX",               "lost",      "Cold outreach", "Budget constraints — revisit in Q4.",        None),
        ("Lisa",     "Chen",      "lisa.chen@newco.com",             "NewCo Ltd",              "new",       "Referral",      None,                                          None),
        ("Rachel",   "Kim",       "r.kim@alphatech.io",              "AlphaTech",              "contacted", "LinkedIn",      "Interested in enterprise tier.",              None),
        ("Paul",     "Nguyen",    "p.nguyen@betasoft.com",           "BetaSoft",               "qualified", "Webinar",       "Demoed product. Ready to buy Q3.",            None),
        ("Diane",    "Foster",    "d.foster@gammacorp.com",          "GammaCorp",              "new",       "Trade Show",    None,                                          None),
        ("Kevin",    "Marsh",     "k.marsh@deltasys.net",            "DeltaSys",               "lost",      "Cold call",     "Went with competitor.",                       None),
        ("Sandra",   "Price",     "s.price@epsilonco.com",           "Epsilon Co",             "contacted", "Email campaign",None,                                          None),
        ("Andrew",   "Bell",      "a.bell@zetaworks.com",            "ZetaWorks",              "qualified", "Referral",      "CFO approved budget.",                        None),
        ("Monica",   "Torres",    "m.torres@etainnovations.io",      "Eta Innovations",        "new",       "Website",       None,                                          None),
        ("Brian",    "Cox",       "b.cox@thetasolutions.com",        "Theta Solutions",        "contacted", "Partner",       "Passed on by AWS partner.",                   None),
        ("Amy",      "Reed",      "a.reed@iota-labs.com",            "Iota Labs",              "lost",      "Inbound",       "No budget for this FY.",                      None),
        ("Daniel",   "Murphy",    "d.murphy@kapparetail.com",        "Kappa Retail",           "qualified", "Trade Show",    "Wants 3-year contract.",                      None),
        ("Christine","Wood",      "c.wood@lambdaservices.co",        "Lambda Services",        "new",       "Website",       None,                                          None),
        ("Mark",     "James",     "m.james@mutech.io",               "MuTech",                 "contacted", "Cold call",     "Booked discovery call for next week.",        None),
        ("Kelly",    "Evans",     "k.evans@nuenterprise.com",        "Nu Enterprise",          "lost",      "LinkedIn",      "Using existing solution.",                    None),
        ("Eric",     "Collins",   "e.collins@xisystems.net",         "Xi Systems",             "new",       "Referral",      None,                                          None),
        ("Laura",    "Stewart",   "l.stewart@omicrongroup.com",      "Omicron Group",          "qualified", "Webinar",       "Attended 2 webinars. Very engaged.",          None),
        ("Scott",    "Morris",    "s.morris@pidigital.com",          "Pi Digital",             "contacted", "Email campaign","Opened emails multiple times.",               None),
        ("Jennifer", "Rogers",    "j.rogers@rhoindustries.com",      "Rho Industries",         "new",       "Cold outreach", None,                                          None),
        ("Gary",     "Cook",      "g.cook@sigmanet.io",              "Sigma Net",              "qualified", "Website",       "Booked a call for pricing.",                  None),
        ("Patricia", "Bailey",    "p.bailey@taudigital.com",         "Tau Digital",            "lost",      "Trade Show",    "Too expensive.",                              None),
        ("Timothy",  "Rivera",    "t.rivera@upsiloncloud.com",       "Upsilon Cloud",          "new",       "Inbound",       None,                                          None),
        ("Sharon",   "Cooper",    "s.cooper@phiconsulting.co",       "Phi Consulting",         "contacted", "Partner",       "Referred by Accenture.",                      None),
        ("Gerald",   "Richardson","g.richardson@chianalytics.com",   "Chi Analytics",          "qualified", "LinkedIn",      "Needs POC before signing.",                   None),
        ("Deborah",  "Cox",       "d.cox@psicapital.com",            "Psi Capital",            "new",       "Cold call",     None,                                          None),
        ("Larry",    "Howard",    "l.howard@omegatech.io",           "Omega Tech",             "contacted", "Website",       "Downloading product guides.",                 None),
        ("Carol",    "Ward",      "c.ward@alphonsegroup.com",        "Alphonse Group",         "lost",      "Email campaign","Unsubscribed.",                               None),
        ("Raymond",  "Torres",    "r.torres@bertrand-co.com",        "Bertrand Co",            "qualified", "Webinar",       "Approved internal budget.",                   None),
        ("Cynthia",  "Peterson",  "c.peterson@clarinetsystems.io",   "Clarinet Systems",       "new",       "Referral",      None,                                          None),
        ("Harold",   "Gray",      "h.gray@domino-software.com",      "Domino Software",        "contacted", "Trade Show",    "Requested pricing deck.",                     None),
        ("Kathleen", "Ramirez",   "k.ramirez@edelweiss-tech.com",    "Edelweiss Tech",         "lost",      "Cold outreach", "No response after 3 follow-ups.",             None),
        ("Jesse",    "James",     "j.james@felixdigital.co",         "Felix Digital",          "new",       "Website",       None,                                          None),
        ("Helen",    "Watson",    "h.watson@gloriatech.io",          "Gloria Tech",            "qualified", "Partner",       "Wants to expand existing license.",           None),
        ("Douglas",  "Brooks",    "d.brooks@horatio-group.com",      "Horatio Group",          "contacted", "LinkedIn",      "Connected at SaaStr conference.",             None),
        ("Beverly",  "Kelly",     "b.kelly@illyria-systems.com",     "Illyria Systems",        "new",       "Inbound",       None,                                          None),
        ("Eugene",   "Sanders",   "e.sanders@jarvis-cloud.io",       "Jarvis Cloud",           "lost",      "Webinar",       "Signed with competitor post-webinar.",        None),
        ("Judy",     "Price",     "j.price@kestrel-data.com",        "Kestrel Data",           "qualified", "Website",       "3 internal stakeholders signed off.",         None),
        ("Wayne",    "Bennett",   "w.bennett@luminal-tech.com",      "Luminal Tech",           "contacted", "Email campaign","Opened all 4 emails.",                        None),
        ("Alice",    "Wood",      "a.wood@meridian-software.co",     "Meridian Software",      "new",       "Cold call",     None,                                          None),
        ("Roy",      "Barnes",    "r.barnes@nexus-analytics.io",     "Nexus Analytics",        "contacted", "Trade Show",    "Met at Dreamforce.",                          None),
        ("Doris",    "Ross",      "d.ross@optic-enterprises.com",    "Optic Enterprises",      "lost",      "Referral",      "Budget cut mid-cycle.",                       None),
        ("Russell",  "Henderson", "r.henderson@paradox-cloud.com",   "Paradox Cloud",          "qualified", "Website",       "Wants to start in 30 days.",                  None),
        ("Evelyn",   "Coleman",   "e.coleman@quantum-bi.io",         "Quantum BI",             "new",       "Inbound",       None,                                          None),
        ("Randy",    "Jenkins",   "r.jenkins@redwood-systems.net",   "Redwood Systems",        "contacted", "Partner",       "AWS partner referral.",                       None),
        ("Cheryl",   "Perry",     "c.perry@stellar-crm.com",         "Stellar CRM",            "lost",      "Cold call",     "Already has a CRM solution.",                 None),
        ("Dennis",   "Powell",    "d.powell@triton-tech.io",         "Triton Tech",            "new",       "LinkedIn",      None,                                          None),
        ("Gloria",   "Long",      "g.long@ultrasoft.com",            "Ultrasoft",              "qualified", "Webinar",       "Highest engagement score this quarter.",      None),
        ("Fred",     "Patterson", "f.patterson@vortex-data.co",      "Vortex Data",            "contacted", "Email campaign","Replied asking for a demo.",                  None),
        ("Ann",      "Hughes",    "a.hughes@wavefront-ai.io",        "Wavefront AI",           "new",       "Inbound",       None,                                          None),
        ("Carl",     "Flores",    "c.flores@xanthe-solutions.com",   "Xanthe Solutions",       "lost",      "Trade Show",    "Too early stage for our product.",            None),
        ("Sandra",   "Washington","s.washington@yellowbrick-tech.io","Yellowbrick Tech",       "new",       "Cold outreach", None,                                          None),
        ("Arthur",   "Butler",    "a.butler@zenith-cloud.com",       "Zenith Cloud",           "qualified", "Referral",      "Board member made introduction.",             None),
        ("Mildred",  "Simmons",   "m.simmons@apex-data.net",         "Apex Data",              "contacted", "Website",       "Signed up for trial.",                        None),
        ("Bobby",    "Foster",    "b.foster@blueprint-tech.com",     "Blueprint Tech",         "new",       "Inbound",       None,                                          None),
        ("Marilyn",  "Gonzalez",  "m.gonzalez@catalyst-ai.io",       "Catalyst AI",            "lost",      "Cold call",     "Decision deferred to next year.",             None),
        ("Terry",    "Bryant",    "t.bryant@diamond-systems.co",     "Diamond Systems",        "qualified", "LinkedIn",      "CMO personally reached out.",                 None),
        ("Irene",    "Alexander", "i.alexander@eclipse-software.com","Eclipse Software",       "contacted", "Partner",       "Microsoft partner introduced us.",            None),
        ("Philip",   "Russell",   "p.russell@fortress-tech.net",     "Fortress Tech",          "new",       "Website",       None,                                          None),
        ("Lois",     "Griffin",   "l.griffin@gateway-cloud.io",      "Gateway Cloud",          "lost",      "Webinar",       "Went with open source alternative.",          None),
    ]

    for first, last, email, company, status, source, notes, opp_idx in lead_data:
        converted_id = opps[opp_idx].id if opp_idx is not None else None
        l = Lead(first_name=first, last_name=last, email=email, company=company,
                 status=status, source=source, notes=notes,
                 converted_opportunity_id=converted_id)
        db.add(l)
        leads.append(l)
    await db.flush()

    # ─────────────────────────────────────────────────────────────────────
    # ACTIVITIES (80+)
    # ─────────────────────────────────────────────────────────────────────
    activity_data = [
        # (type, subject, days_ago, ctr_idx or None, opp_idx or None)
        ("call",    "Initial discovery call with Tom",                     14,  0,  0),
        ("email",   "Sent enterprise platform proposal",                    7,  0,  0),
        ("meeting", "TechStart requirements deep-dive",                    20,  0,  0),
        ("call",    "Followed up on cloud migration scope",                 3,  0,  51),
        ("email",   "Sent contract for cloud migration",                    1,  0,  51),
        ("meeting", "Priya — technical onboarding session",                10, 22,  1),
        ("call",    "Requirements gathering with Sarah",                   21,  2,  2),
        ("email",   "HealthCare proposal follow-up",                       10,  2,  2),
        ("meeting", "HealthCare telehealth demo",                          30,  3,  33),
        ("call",    "Marcus — procurement discussion",                     18,  3,  3),
        ("call",    "Pricing negotiation with Michael",                    28,  4,  4),
        ("meeting", "Finance Solutions legal review",                      14,  4,  4),
        ("call",    "Verbal commitment call — Michael",                     5,  4,  4),
        ("email",   "Finance analytics proposal sent",                     12, 26,  5),
        ("meeting", "Digital Transformation kickoff — Emma",               45,  5,  6),
        ("email",   "Contract executed — welcome aboard",                  44,  5,  6),
        ("call",    "Oliver — fleet management scope call",                22,  6,  7),
        ("meeting", "Route optimiser demo — Oliver",                       15,  6,  8),
        ("call",    "Negotiation on route optimiser pricing",               8,  6,  8),
        ("email",   "EduTech LMS proposal",                                18,  7,  9),
        ("meeting", "LMS platform requirements workshop",                  25,  7,  9),
        ("call",    "Liam — monitoring dashboard sign-off",                90,  8, 10),
        ("email",   "GreenEnergy billing proposal",                        14, 24, 37),
        ("meeting", "MediaHouse content platform negotiation",              7,  9, 12),
        ("call",    "Zoe — analytics suite review",                        20,  9, 13),
        ("meeting", "CloudBase infrastructure final review",               60, 10, 14),
        ("email",   "Kubernetes proposal sent to Noah",                    10, 10, 39),
        ("call",    "BioPharm negotiation call — Isabelle",                10, 11, 16),
        ("meeting", "BioPharm clinical trial module demo",                 30, 11, 40),
        ("email",   "RetailNow e-commerce proposal",                       20, 12, 17),
        ("call",    "Ethan — POS integration scoping",                     35, 12, 41),
        ("meeting", "SmartMfg ERP integration workshop",                   18, 13, 19),
        ("call",    "SmartMfg predictive maintenance intro",               10, 13, 42),
        ("email",   "IoT sensor proposal for SmartMfg",                    12, 13, 20),
        ("call",    "LegalTech document management scoping",               50, 14, 21),
        ("email",   "LegalTech client portal proposal",                     8, 14, 43),
        ("meeting", "PropTech property analytics demo",                    15, 15, 22),
        ("call",    "Sofia — agent portal requirements call",              20, 15, 23),
        ("meeting", "CyberShield enterprise security negotiation",          9, 16, 24),
        ("call",    "James — SOC as a service sign-off",                   60, 16, 45),
        ("email",   "CyberShield compliance module proposal",              15, 28, 25),
        ("meeting", "AgroSmart crop intelligence closed-won review",        5, 17, 26),
        ("email",   "AgroSmart satellite imaging proposal",                18, 17, 46),
        ("call",    "Henry — TravelSuite corporate negotiation call",      10, 18, 47),
        ("meeting", "TravelSuite booking platform intro meeting",          20, 18, 27),
        ("call",    "InsureWell claims automation negotiation",             8, 19, 28),
        ("email",   "InsureWell fraud detection proposal",                 15, 19, 48),
        ("meeting", "AutoDrive fleet analytics requirements",              25, 20, 29),
        ("call",    "Alexander — telematics scoping call",                 40, 20, 49),
        ("meeting", "NextGen predictive analytics closed-won review",       7, 21, 30),
        ("call",    "Ella — real-time dashboard discovery",                14, 21, 50),
        ("email",   "NextGen data warehouse proposal",                      6, 21, 31),
        ("meeting", "Finance Solutions reporting suite sign-off",          30, 26, 53),
        ("call",    "Nina — CloudBase disaster recovery scoping",          12, 23, 54),
        ("email",   "Sent SaaS evaluation guide to Priya",                  9, 22,  1),
        ("call",    "Grace — Logistics IT requirements",                   12, 27,  8),
        ("meeting", "Hugo — CyberShield sales engineering session",        11, 28, 24),
        ("email",   "Iris — MediaHouse subscription platform proposal",     8, 29, 38),
        ("call",    "Carlos — GreenEnergy field app intro",                16, 24, 11),
        ("meeting", "Diana — RetailNow loyalty module demo",               13, 25, 18),
        ("call",    "Felix — Finance API gateway final approval",           5, 26, 34),
        ("meeting", "Follow-up with Rachel Kim — AlphaTech",               2,  3,  None),
        ("call",    "Discovery call with Paul Nguyen — BetaSoft",          1,  5,  None),
        ("email",   "Sent brochure to Diane Foster — GammaCorp",           3,  7,  None),
        ("call",    "Follow-up with Daniel Murphy — Kappa Retail",         4,  9,  None),
        ("meeting", "Gary Cook — demo walkthrough",                         2,  11, None),
        ("email",   "Judy Price — pricing proposal sent",                   1,  13, None),
        ("call",    "Russell Henderson — onboarding timeline agreed",       1,  15, None),
        ("meeting", "Gloria Long — final pre-close review",                 2,  17, None),
        ("email",   "Arthur Butler — executive summary sent",               1,  19, None),
        ("call",    "Terry Bryant — contract terms agreed",                 2,  21, None),
        ("meeting", "Wayne Bennett — product demo completed",               5,  23, None),
        ("email",   "Raymond Torres — activation confirmed",                3,  25, None),
        ("call",    "Helen Watson — expansion deal discussed",              6,  27, None),
        ("meeting", "Laura Stewart — business case review",                 4,  29, None),
        ("email",   "Fred Patterson — sent demo recording",                 2,  1,  None),
        ("call",    "Mildred Simmons — trial extension requested",          1,  2,  None),
        ("meeting", "Randy Jenkins — partner integration discussion",       3,  4,  None),
        ("call",    "Sharon Cooper — Phi Consulting intro call",            5,  6,  None),
        ("email",   "Brian Cox — Theta Solutions follow-up",               4,  8,  None),
        ("meeting", "Annual review planning — TechStart",                   7,  0,   0),
        ("call",    "HealthCare Pro — Q3 renewal discussion",               6,  2,   2),
    ]

    for atype, subject, days_ago, ctr_i, opp_i in activity_data:
        ctr_id = ctrs[ctr_i].id if ctr_i is not None else None
        opp_id = opps[opp_i].id if opp_i is not None else None
        a = Activity(type=atype, subject=subject, activity_date=_d(days_ago),
                     contact_id=ctr_id, opportunity_id=opp_id)
        db.add(a)
        activities.append(a)
    await db.flush()

    # ─────────────────────────────────────────────────────────────────────
    # EMAIL MESSAGES (one welcome + one follow-up per first 20 contacts)
    # ─────────────────────────────────────────────────────────────────────
    for ctr in ctrs[:20]:
        e1 = EmailMessage(
            from_email=_FROM, to_email=ctr.email,
            subject="Welcome to Sales CRM",
            body=f"Hi {ctr.first_name}, thanks for connecting with us. We're excited to work with you.",
        )
        db.add(e1)
        emails.append(e1)

        e2 = EmailMessage(
            from_email=_FROM, to_email=ctr.email,
            subject="Your proposal is ready",
            body=f"Hi {ctr.first_name}, please find enclosed the proposal we discussed. Let us know if you have any questions.",
        )
        db.add(e2)
        emails.append(e2)

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
