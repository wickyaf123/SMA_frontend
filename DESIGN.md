# Frontend Design Blueprint: OutreachPro

This document is the end-to-end frontend design reference for the `frontend` app. It is meant to help Pencil recreate the product faithfully by describing the shared shell, visual language, page structure, major sections, and primary actions.

## 1. Product Summary

`OutreachPro` is a dark-mode-first outreach operations dashboard for managing lead ingestion, validation, multi-channel campaigns, integrations, and operational settings.

The UI should feel like a modern SaaS control center:

- Dense but readable admin layout
- Large rounded cards and panels
- Soft glass-like surfaces
- Indigo-led accent color system
- Strong status signaling through badges, pills, and switches
- Sticky headers and action bars for high-frequency operational work

## 2. App Shell

### Left Sidebar

Persistent vertical navigation with workspace branding at the top and utility links at the bottom.

Primary navigation items:

- `Overview`
- `Pipeline`
- `Leads Database`
- `Campaigns`
- `Integrations`

Bottom utility items:

- `Help & Support`
- `Settings`

Sidebar details:

- Workspace switcher / brand block with product mark
- Active item highlighted with filled primary background
- Compact admin-style labels
- User mini-profile pinned at the bottom

### Top Header

Shared sticky header across the main app pages.

Header elements:

- Breadcrumb: `Acme Corp / Current Page`
- Short page subtitle
- Search / command trigger
- Live or Offline environment status pill
- `AI Assistant` button
- Notifications button
- User avatar

### Global Behaviors

- `Cmd/Ctrl + K` opens a command palette for navigation
- Global toast notifications are available
- Main content scrolls independently from the fixed sidebar
- Most pages use local sticky headers inside the content area

## 3. Visual Theme

### Atmosphere

The interface should feel sleek, high-utility, and operational. It is not playful or marketing-led. It should feel trusted, responsive, and optimized for teams monitoring throughput, health, and exceptions.

### Color Roles

Primary design language inferred from the app theme:

- Primary Indigo `hsl(238 84% 67%)`: primary actions, active states, focus rings
- Dark Background `hsl(240 10% 4%)`: application canvas
- Dark Card Surface `hsl(240 10% 6%)`: cards, panels, dialogs
- Muted Surface `hsl(240 5% 12%)`: secondary surfaces, inputs, subtle containers
- Border `hsl(240 5% 14%)`: low-contrast structural lines
- Success Green `hsl(142.1 70.6% 45.3%)`: healthy states, connected states, successful outcomes
- Warning Amber `hsl(47.9 95.8% 53.1%)`: caution, rate limits, attention states
- Info Blue `hsl(217.2 91.2% 59.8%)`: informational highlights
- Destructive Red: stop, delete, failure, disconnected states

Pipeline node colors:

- Ingestion Blue
- Validation Purple
- Outreach Orange
- Reply Green
- CRM Magenta

### Typography

- Clean sans-serif dashboard typography
- Tight tracking on headings
- Semibold headers
- Small uppercase utility labels for metadata and section framing
- Dense but legible body copy optimized for tables and settings panels

### Surfaces And Geometry

- Cards and panels use generously rounded corners
- Primary search input and many utility controls use pill-shaped treatment
- Borders are subtle and low-contrast
- Hover states increase elevation and contrast slightly
- Backdrop blur is used lightly for glass-card behavior

### Depth And Feedback

- Soft shadows, not heavy dropshadows
- Strong reliance on color and border treatment over animation
- Status communicated through pills, badges, switches, progress bars, and iconography

## 4. Core Reusable UI Patterns

### Buttons

Primary button usage:

- High-priority actions like refresh, save, test, add, import, and open workflow steps

Secondary / outline buttons:

- Supportive actions like `Refresh Data`, `AI Assistant`, `Docs`, `Configure`, and `Run now`

Ghost / icon buttons:

- Notifications
- Row overflow menus
- Table actions
- reorder / priority controls

Common button intents:

- Primary CTA
- Secondary CTA
- External-link action
- Inline utility action
- Destructive action

### Cards

The app heavily uses glass-card style containers for:

- KPI summaries
- Settings groups
- Channel cards
- Integration cards
- Status panels
- Summary panels

### Tables

Operational tables should support:

- Search
- Filters
- Row selection
- Bulk actions
- Overflow menus
- Pagination
- Dense metadata columns

### Dialogs

Modal workflows are a major pattern in the app. Pencil should expect dialogs for:

- Create
- Edit
- Import
- Enroll
- Test
- View details
- Compose messages

### Status Indicators

Status UI patterns appear everywhere:

- Rounded status pills
- Colored badges
- Progress bars
- On/off switches
- Health indicators
- Live/offline connection state

### Tabs

Tabs are used as secondary navigation within pages, especially for:

- Analytics views
- Detail panels
- Settings categories
- Contact detail views

## 5. Route Map

Main routed pages:

- `/overview`
- `/pipeline`
- `/leads`
- `/campaigns`
- `/integrations`
- `/settings`
- `*` for not found

## 6. Page Specifications

### `/overview` - Overview Dashboard

Purpose:

- Give operators a high-level health and performance snapshot

Major sections:

- Page header
- KPI card row
- `Outreach Trends` chart card
- `Channel Distribution` chart card
- Channel performance cards for `Email`, `SMS`, and `LinkedIn`
- `Reply Rate Trend` card
- `System Health` card

Primary actions:

- `Last 30 Days`
- `Refresh Data`
- `Weekly`
- `Monthly`

Key content patterns:

- Metrics
- Trend lines
- Distribution charts
- System progress indicators
- Error / retry state support

### `/pipeline` - Pipeline Automation

Purpose:

- Visualize the end-to-end lead processing and outreach pipeline

Major sections:

- Sticky page header
- Main workflow canvas with dotted/grid background
- Vertical pipeline node chain
- Branched outreach channel nodes
- Bottom `Pipeline Overview` summary card
- Right-side `Node Detail Panel`
- Pipeline test dialog

Primary nodes:

- `Lead Ingestion`
- `Validation`
- `Outreach Sequences`
- `Reply Detection`
- `CRM Sync`

Child outreach nodes:

- `Email`
- `SMS`
- `LinkedIn`

Primary actions:

- `Test Pipeline End-to-End`
- Select node
- `Metrics` tab
- `Activity` tab
- `Config` tab
- `Pause`
- `Configure`

Pipeline test flow steps:

- Import Shovels Permit Contacts
- Enrich Contact Data
- Merge Duplicates
- Validate Emails & Phones
- Auto-Enroll in Campaigns

### `/leads` - Leads Database

Purpose:

- Operate on the master list of contacts and companies

Major sections:

- Sticky page header
- Import progress banner
- Select-all-pages banner
- Filter and actions toolbar
- Bulk action bar
- Leads table
- Pagination footer
- Multiple lead dialogs

Primary toolbar actions:

- `Export CSV`
- `Import Data`
- `Import from Apollo`
- `Upload CSV File`
- Search leads
- Filter by `Status`
- Filter by `Source`
- Filter by `Validation`
- `Columns`
- `Add Lead`

Bulk actions:

- `Add to Campaign`
- `Export Selected`
- `Delete`

Row-level actions:

- `View Details`
- `Edit Lead`
- `Add to Campaign`
- `Send SMS`
- `Delete`

Important dialogs:

- `Add New Lead`
- `Import from Apollo`
- `Send SMS`
- `Enroll in Campaign`
- `Contact Details`

Contact details tabs:

- `Overview`
- `Replies`
- `Activity`
- `GHL Messages`

Representative table content:

- Contact
- Company
- Validation status
- Campaign membership
- Data quality
- Last contacted
- Source
- Tags
- Permit metadata

### `/campaigns` - Campaigns

Purpose:

- Monitor and control multi-channel outreach activity

Major sections:

- Sticky page header
- Summary KPI card row
- Channel cards for `Email`, `SMS`, and `LinkedIn`
- `System Status` card
- `Recent Activity` feed

Primary actions:

- `Refresh Stats`
- `Open Instantly`
- `Open GoHighLevel`
- `Open PhantomBuster`
- `Configure Limits`
- `View Full Logs`
- `Auto-Enrollment` switch for LinkedIn

Channel card content patterns:

- Enrolled counts
- Sent counts
- Delivery / open / acceptance metrics
- Reply rates
- Failure or bounce counts
- External launch action

### `/integrations` - Integrations

Purpose:

- Show connection health and quick access for external systems

Major sections:

- Sticky page header
- System status banner
- Integration groups by category
- Configuration note / guidance card

Integration categories:

- `Infrastructure`
- `Lead Sources`
- `Outreach Channels`
- `Validation Services`

Infrastructure cards:

- `PostgreSQL (Supabase)`
- `Redis (Upstash)`
- `Backend API`

Lead source cards:

- `Shovels`
- `Clay`

Outreach channel cards:

- `Instantly`
- `GoHighLevel`
- `PhantomBuster`

Validation service cards:

- `NeverBounce`
- `Twilio Lookup`

Primary actions:

- `Refresh Status`
- `Test`
- `Docs`

State patterns:

- `Connected`
- `Not Connected`
- `Error`
- `Checking...`

### `/settings` - Settings

Purpose:

- Central control plane for pipeline operations, routing, scheduling, appearance, and templates

Top-level actions:

- `Save Changes`

Top-level tabs:

- `Pipeline`
- `Routing`
- `System`
- `Scrapers`
- `SMS Templates`
- `Cron Jobs`

#### `Pipeline` Tab

Major sections:

- Emergency stop banner
- `Pipeline Master Controls`
- `Outreach Channels`
- `Individual Job Controls`
- `Schedule Templates`
- `Maintenance Mode`

Primary actions:

- `Resume All`
- Master pipeline switch
- Cron scheduler switch
- `EMERGENCY STOP`
- Channel toggles for `Email`, `SMS`, `LinkedIn`
- Job toggles for scraper, enrich, merge, validate, auto-enroll
- Schedule template selection
- Custom schedule toggle
- `Save Custom Schedule`
- Maintenance mode toggle

#### `Routing` Tab

Major sections:

- `Campaign Routing Rules`
- `Test Routing`
- Create / edit rule dialog
- `Permit Routing Settings`

Primary actions:

- `New Rule`
- Reorder rule priority
- Active switch
- Edit rule
- Delete rule
- `Test`
- `Create Rule`
- `Save Changes`
- `Sync Campaigns`

Routing rule fields:

- Rule name
- Target campaign
- Description
- Match mode
- Lead source
- Industry
- State
- Country
- Tags
- Employee range

#### `System` Tab

Major sections:

- `LinkedIn Automation`
- `Rate Limits`
- `Appearance`

Primary actions:

- LinkedIn automation toggle
- `Save Rate Limits`
- Dark mode toggle

#### `Scrapers` Tab

Major sections:

- `Shovels Permit Scraper`
- `Employee Seniority / Department Filters`
- `Quick Tips`

Primary actions:

- `Run Now`
- `Save Shovels Settings`

Representative controls:

- Permit type inputs
- Geo / location inputs
- Date range
- Max results
- Employee contact toggle
- Include / exclude employee filters

#### `SMS Templates` Tab

Major sections:

- Template list
- New template form
- Inline edit state
- Template guidance panel

Primary actions:

- `New Template`
- `Save Template`
- `Set as default`
- `Edit`
- `Delete`
- `Save Changes`
- `Cancel`

#### `Cron Jobs` Tab

Major sections:

- Scheduler toggle
- Scheduled jobs list
- Schedule info note

Job types:

- `Shovels Permit Scraper`
- `Clay Enrichment`
- `Data Merge`
- `Email/Phone Validation`
- `Auto-Enrollment`

Primary actions:

- Scheduler switch
- `Run now`
- Per-job enable/disable switch

### `*` - Not Found

Purpose:

- Fail-safe page for invalid routes

Major sections:

- Centered not found message
- Minimal recovery action

Primary actions:

- `Return to Home`

## 7. Pencil Recreation Guidance

When recreating this app in Pencil:

- Start with the shared shell first: sidebar, sticky top header, and main content frame
- Reuse a consistent glass-card system across every page
- Keep page headers sticky and action-oriented
- Use badges, pills, switches, and progress states as core UI language
- Prefer modal workflows over separate sub-pages for operational tasks
- Preserve the dark-first theme with indigo as the dominant action color
- Keep tables dense but well-spaced enough for repeated daily use
- Use route-level pages for major workflows and tabs for secondary workflow depth

## 8. Priority Screens To Design First

If building this in phases, the best order is:

1. App shell
2. Overview dashboard
3. Leads database
4. Pipeline canvas
5. Settings
6. Campaigns
7. Integrations
8. Not found state
