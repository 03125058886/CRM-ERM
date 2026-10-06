/**
 * Per-app workspace definition: what a record is called, which pipeline
 * stages it moves through, and some seed data so a fresh workspace is not empty.
 */
export interface SeedRecord {
  title: string;
  stage: string;
  amount?: number;
  partner?: string;
  notes?: string;
}

export interface ModuleDef {
  noun: string;
  nounPlural: string;
  stages: string[];
  /** label for the numeric field, undefined = hide amount */
  amountLabel?: string;
  /** label for the partner/contact field */
  partnerLabel?: string;
  seed: SeedRecord[];
}

const S = (title: string, stage: string, amount?: number, partner?: string): SeedRecord => ({ title, stage, amount, partner });

export const MODULES: Record<string, ModuleDef> = {
  website: { noun: "Page", nounPlural: "Pages", stages: ["Draft", "In Review", "Published"], seed: [S("Home", "Published"), S("About us", "Published"), S("Pricing", "In Review"), S("Contact", "Draft")] },
  ecommerce: { noun: "Product", nounPlural: "Products", stages: ["Draft", "Active", "Out of stock", "Archived"], amountLabel: "Price", seed: [S("Wireless headphones", "Active", 129), S("Desk lamp", "Active", 45), S("Office chair", "Out of stock", 399), S("Notebook A5", "Draft", 6)] },
  blog: { noun: "Post", nounPlural: "Posts", stages: ["Idea", "Writing", "Review", "Published"], seed: [S("Welcome to our blog", "Published"), S("10 tips for remote teams", "Review"), S("Product roadmap 2026", "Writing"), S("Customer story: Acme", "Idea")] },
  forum: { noun: "Topic", nounPlural: "Topics", stages: ["Open", "Answered", "Closed"], partnerLabel: "Author", seed: [S("How do I reset my password?", "Answered", undefined, "Ali"), S("Feature request: dark mode", "Open", undefined, "Sara"), S("Export to Excel?", "Closed", undefined, "Omar")] },
  elearning: { noun: "Course", nounPlural: "Courses", stages: ["Draft", "Published", "Archived"], amountLabel: "Price", seed: [S("Onboarding 101", "Published", 0), S("Sales mastery", "Published", 49), S("Advanced accounting", "Draft", 99)] },
  events: { noun: "Event", nounPlural: "Events", stages: ["Planned", "Open", "Sold out", "Done"], amountLabel: "Ticket price", seed: [S("Product launch", "Open", 25), S("Partner summit", "Planned", 150), S("Webinar: Getting started", "Done", 0)] },

  crm: { noun: "Lead", nounPlural: "Leads", stages: ["New", "Qualified", "Proposition", "Won", "Lost"], amountLabel: "Expected revenue", partnerLabel: "Customer", seed: [S("Office furniture for HQ", "New", 12000, "Globex"), S("ERP implementation", "Qualified", 45000, "Initech"), S("Website redesign", "Proposition", 8500, "Umbrella"), S("Support contract", "Won", 6000, "Acme"), S("Fleet of 10 laptops", "Lost", 9000, "Hooli")] },
  sales: { noun: "Quotation", nounPlural: "Quotations", stages: ["Quotation", "Sent", "Sales Order", "Locked", "Cancelled"], amountLabel: "Total", partnerLabel: "Customer", seed: [S("S00042 – Desks x12", "Sales Order", 5400, "Globex"), S("S00043 – Chairs x30", "Sent", 7200, "Initech"), S("S00044 – Monitors x8", "Quotation", 2400, "Acme")] },
  pos: { noun: "Order", nounPlural: "Orders", stages: ["Ongoing", "Paid", "Refunded"], amountLabel: "Amount", partnerLabel: "Customer", seed: [S("Order 0001", "Paid", 32.5), S("Order 0002", "Paid", 18), S("Order 0003", "Ongoing", 54.9)] },
  restaurant: { noun: "Table order", nounPlural: "Table orders", stages: ["Seated", "Ordered", "Served", "Paid"], amountLabel: "Bill", seed: [S("Table 4", "Served", 86), S("Table 7", "Ordered", 42), S("Table 1", "Seated")] },
  subscriptions: { noun: "Subscription", nounPlural: "Subscriptions", stages: ["Draft", "Active", "Paused", "Closed"], amountLabel: "Monthly", partnerLabel: "Customer", seed: [S("Pro plan – Globex", "Active", 199, "Globex"), S("Starter – Acme", "Active", 49, "Acme"), S("Enterprise – Initech", "Draft", 999, "Initech")] },
  rental: { noun: "Rental", nounPlural: "Rentals", stages: ["Quotation", "Reserved", "Picked up", "Returned"], amountLabel: "Total", partnerLabel: "Customer", seed: [S("Projector x2 – 3 days", "Picked up", 180, "Acme"), S("Camera kit", "Reserved", 320, "Sara K."), S("Sound system", "Returned", 450, "Events Co")] },

  invoicing: { noun: "Invoice", nounPlural: "Invoices", stages: ["Draft", "Posted", "Paid", "Cancelled"], amountLabel: "Total", partnerLabel: "Customer", seed: [S("INV/2026/0001", "Paid", 5400, "Globex"), S("INV/2026/0002", "Posted", 7200, "Initech"), S("INV/2026/0003", "Draft", 2400, "Acme")] },
  accounting: { noun: "Journal entry", nounPlural: "Journal entries", stages: ["Draft", "Posted", "Reconciled"], amountLabel: "Amount", partnerLabel: "Partner", seed: [S("Bank fees – Oct", "Posted", 25), S("Rent – Oct", "Reconciled", 2000), S("Customer payment – Globex", "Posted", 5400, "Globex")] },
  expenses: { noun: "Expense", nounPlural: "Expenses", stages: ["To submit", "Submitted", "Approved", "Reimbursed", "Refused"], amountLabel: "Amount", partnerLabel: "Employee", seed: [S("Taxi to client", "Approved", 18, "Ali"), S("Hotel – conference", "Submitted", 240, "Sara"), S("Team lunch", "To submit", 95, "Omar")] },
  sign: { noun: "Document", nounPlural: "Documents", stages: ["Draft", "Sent", "Signed", "Cancelled"], partnerLabel: "Signer", seed: [S("NDA – Globex", "Signed", undefined, "Globex"), S("Employment contract – Sara", "Sent", undefined, "Sara"), S("Lease agreement", "Draft")] },
  equity: { noun: "Shareholder", nounPlural: "Shareholders", stages: ["Founder", "Investor", "Employee pool"], amountLabel: "Shares", seed: [S("Founder A", "Founder", 400000), S("Founder B", "Founder", 400000), S("Seed investor", "Investor", 150000), S("ESOP", "Employee pool", 50000)] },
  esg: { noun: "Metric", nounPlural: "Metrics", stages: ["Collecting", "Verified", "Reported"], amountLabel: "Value", seed: [S("Scope 1 emissions (tCO2e)", "Verified", 120), S("Energy use (MWh)", "Collecting", 840), S("Gender pay gap (%)", "Reported", 3)] },

  project: { noun: "Task", nounPlural: "Tasks", stages: ["Backlog", "In Progress", "Review", "Done"], amountLabel: "Hours", partnerLabel: "Assignee", seed: [S("Design landing page", "Done", 8, "Sara"), S("Set up CI pipeline", "In Progress", 5, "Ali"), S("Write API docs", "Review", 3, "Omar"), S("Mobile onboarding flow", "Backlog", 12, "Sara")] },
  timesheets: { noun: "Timesheet", nounPlural: "Timesheets", stages: ["Draft", "Submitted", "Approved", "Invoiced"], amountLabel: "Hours", partnerLabel: "Employee", seed: [S("Week 40 – Ali", "Approved", 38, "Ali"), S("Week 40 – Sara", "Submitted", 41, "Sara"), S("Week 41 – Ali", "Draft", 12, "Ali")] },
  "field-service": { noun: "Intervention", nounPlural: "Interventions", stages: ["Planned", "On the way", "In Progress", "Done"], amountLabel: "Hours", partnerLabel: "Customer", seed: [S("AC repair – Globex HQ", "Done", 3, "Globex"), S("Printer install – Acme", "Planned", 1, "Acme"), S("Network audit – Initech", "In Progress", 6, "Initech")] },
  helpdesk: { noun: "Ticket", nounPlural: "Tickets", stages: ["New", "In Progress", "Waiting", "Solved", "Cancelled"], partnerLabel: "Customer", seed: [S("Cannot log in", "In Progress", undefined, "Ali R."), S("Invoice PDF broken", "New", undefined, "Globex"), S("Feature: export CSV", "Waiting", undefined, "Initech"), S("Password reset", "Solved", undefined, "Sara K.")] },
  appointments: { noun: "Appointment", nounPlural: "Appointments", stages: ["Requested", "Confirmed", "Done", "No-show"], partnerLabel: "Attendee", seed: [S("Demo call", "Confirmed", undefined, "Globex"), S("Onboarding session", "Requested", undefined, "Acme"), S("Quarterly review", "Done", undefined, "Initech")] },
  planning: { noun: "Shift", nounPlural: "Shifts", stages: ["Open", "Assigned", "Published", "Done"], amountLabel: "Hours", partnerLabel: "Employee", seed: [S("Mon morning – Front desk", "Published", 8, "Ali"), S("Tue evening – Warehouse", "Assigned", 6, "Omar"), S("Sat – Support", "Open", 8)] },

  documents: { noun: "Document", nounPlural: "Documents", stages: ["Inbox", "To validate", "Validated", "Archived"], seed: [S("Supplier contract.pdf", "Validated"), S("Q3 report.xlsx", "To validate"), S("Logo.svg", "Inbox")] },
  approvals: { noun: "Request", nounPlural: "Requests", stages: ["To submit", "Submitted", "Approved", "Refused"], amountLabel: "Amount", partnerLabel: "Requester", seed: [S("New laptop – Sara", "Submitted", 1500, "Sara"), S("Business trip – Ali", "Approved", 900, "Ali"), S("Software license", "To submit", 240, "Omar")] },
  knowledge: { noun: "Article", nounPlural: "Articles", stages: ["Draft", "Published", "Archived"], seed: [S("Company handbook", "Published"), S("Onboarding checklist", "Published"), S("Brand guidelines", "Draft")] },

  inventory: { noun: "Transfer", nounPlural: "Transfers", stages: ["Draft", "Waiting", "Ready", "Done", "Cancelled"], amountLabel: "Qty", partnerLabel: "Partner", seed: [S("WH/IN/0001 – Receipt", "Done", 120, "Supplier A"), S("WH/OUT/0007 – Delivery", "Ready", 30, "Globex"), S("WH/INT/0003 – Internal", "Waiting", 50)] },
  manufacturing: { noun: "Manufacturing order", nounPlural: "Manufacturing orders", stages: ["Draft", "Confirmed", "In Progress", "Done"], amountLabel: "Qty", seed: [S("MO/0001 – Desk", "Done", 20), S("MO/0002 – Chair", "In Progress", 50), S("MO/0003 – Table", "Confirmed", 10)] },
  purchase: { noun: "Purchase order", nounPlural: "Purchase orders", stages: ["RFQ", "Sent", "Purchase Order", "Received", "Cancelled"], amountLabel: "Total", partnerLabel: "Vendor", seed: [S("P00012 – Wood panels", "Received", 3200, "Supplier A"), S("P00013 – Screws", "Sent", 180, "Supplier B"), S("P00014 – Packaging", "RFQ", 540, "Supplier C")] },
  maintenance: { noun: "Request", nounPlural: "Requests", stages: ["New", "In Progress", "Repaired", "Scrap"], partnerLabel: "Equipment", seed: [S("Conveyor belt noise", "In Progress", undefined, "Conveyor #2"), S("Printer jam", "Repaired", undefined, "HP LaserJet"), S("Forklift service", "New", undefined, "Forklift A")] },
  quality: { noun: "Quality check", nounPlural: "Quality checks", stages: ["To do", "Passed", "Failed"], partnerLabel: "Product", seed: [S("Dimension check", "Passed", undefined, "Desk"), S("Paint finish", "Failed", undefined, "Chair"), S("Packaging", "To do", undefined, "Table")] },
  repair: { noun: "Repair order", nounPlural: "Repair orders", stages: ["Quotation", "Confirmed", "Under repair", "Repaired"], amountLabel: "Total", partnerLabel: "Customer", seed: [S("RO/0001 – Laptop screen", "Under repair", 220, "Acme"), S("RO/0002 – Phone battery", "Repaired", 60, "Ali R."), S("RO/0003 – Printer", "Quotation", 140, "Globex")] },

  "email-marketing": { noun: "Mailing", nounPlural: "Mailings", stages: ["Draft", "Scheduled", "Sent"], amountLabel: "Recipients", seed: [S("October newsletter", "Sent", 4200), S("Product launch", "Scheduled", 5100), S("Black Friday teaser", "Draft", 0)] },
  "sms-marketing": { noun: "SMS campaign", nounPlural: "SMS campaigns", stages: ["Draft", "Scheduled", "Sent"], amountLabel: "Recipients", seed: [S("Flash sale 20%", "Sent", 1800), S("Store opening", "Scheduled", 950)] },
  survey: { noun: "Survey", nounPlural: "Surveys", stages: ["Draft", "Open", "Closed"], amountLabel: "Responses", seed: [S("Customer satisfaction", "Open", 128), S("Employee engagement", "Closed", 46), S("Website feedback", "Draft", 0)] },
  "social-marketing": { noun: "Post", nounPlural: "Posts", stages: ["Draft", "Scheduled", "Posted"], amountLabel: "Engagement", seed: [S("Meet the team", "Posted", 320), S("New feature teaser", "Scheduled", 0), S("Behind the scenes", "Draft", 0)] },

  employees: { noun: "Employee", nounPlural: "Employees", stages: ["Onboarding", "Active", "On leave", "Offboarded"], partnerLabel: "Department", seed: [S("Ali Raza", "Active", undefined, "Engineering"), S("Sara Khan", "Active", undefined, "Sales"), S("Omar Farooq", "Onboarding", undefined, "Support"), S("Hina Malik", "On leave", undefined, "Finance")] },
  attendances: { noun: "Attendance", nounPlural: "Attendances", stages: ["Checked in", "Checked out"], amountLabel: "Hours", partnerLabel: "Employee", seed: [S("Mon – Ali", "Checked out", 8.2, "Ali"), S("Mon – Sara", "Checked out", 7.9, "Sara"), S("Tue – Ali", "Checked in", 3.5, "Ali")] },
  recruitment: { noun: "Applicant", nounPlural: "Applicants", stages: ["New", "Initial qualification", "First interview", "Contract proposal", "Hired", "Refused"], partnerLabel: "Job position", seed: [S("Ahmed B.", "First interview", undefined, "Backend developer"), S("Maryam S.", "New", undefined, "Account manager"), S("Bilal K.", "Contract proposal", undefined, "Designer"), S("Zara A.", "Hired", undefined, "Support agent")] },
  "time-off": { noun: "Time off request", nounPlural: "Time off requests", stages: ["To submit", "To approve", "Approved", "Refused"], amountLabel: "Days", partnerLabel: "Employee", seed: [S("Annual leave – Ali", "Approved", 5, "Ali"), S("Sick leave – Sara", "To approve", 2, "Sara"), S("Eid holidays – Omar", "To submit", 3, "Omar")] },
  appraisals: { noun: "Appraisal", nounPlural: "Appraisals", stages: ["To start", "In progress", "Done"], partnerLabel: "Employee", seed: [S("H2 review – Ali", "In progress", undefined, "Ali"), S("H2 review – Sara", "To start", undefined, "Sara"), S("H1 review – Omar", "Done", undefined, "Omar")] },
  fleet: { noun: "Vehicle", nounPlural: "Vehicles", stages: ["New request", "In service", "In repair", "Retired"], amountLabel: "Monthly cost", partnerLabel: "Driver", seed: [S("Toyota Corolla – ABC 123", "In service", 450, "Ali"), S("Honda Civic – XYZ 987", "In repair", 520, "Sara"), S("Suzuki Alto – LMN 456", "New request", 300)] },
  payroll: { noun: "Payslip", nounPlural: "Payslips", stages: ["Draft", "Computed", "Validated", "Paid"], amountLabel: "Net", partnerLabel: "Employee", seed: [S("Oct 2026 – Ali", "Paid", 2400, "Ali"), S("Oct 2026 – Sara", "Validated", 2800, "Sara"), S("Oct 2026 – Omar", "Draft", 1900, "Omar")] },

  studio: { noun: "Customization", nounPlural: "Customizations", stages: ["Idea", "Building", "Testing", "Live"], seed: [S("Add 'Priority' field to Leads", "Live"), S("Custom approval flow", "Building"), S("Report: sales by region", "Idea")] },
};

export const DEFAULT_MODULE: ModuleDef = {
  noun: "Record", nounPlural: "Records", stages: ["New", "In Progress", "Done"],
  seed: [S("First record", "New"), S("Second record", "In Progress")],
};

export const moduleFor = (appId: string): ModuleDef => MODULES[appId] ?? DEFAULT_MODULE;

export interface RecordRow {
  id: number;
  appId: string;
  title: string;
  stage: string;
  amount: number | null;
  partner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
