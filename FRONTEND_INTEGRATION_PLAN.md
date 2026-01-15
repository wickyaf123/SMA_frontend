# Frontend Integration Plan
## Connecting Frontend to Backend

**Created:** January 12, 2026  
**Status:** Ready to Build  
**Backend URL:** `http://localhost:3000`  
**Authentication:** None (trusted local environment)

---

## 📋 Summary of Decisions

| Decision | Choice |
|----------|--------|
| Backend URL | `http://localhost:3000` |
| Authentication | None needed (same machine) |
| Channels Tab | **REMOVE** → Replace with **Integrations Status** |
| Settings Tab | **Simplify** → LinkedIn toggle, Rate limits, Cron jobs only |
| New Tab | **Campaigns** (full CRUD) |
| Theme | Dark/Light toggle |
| Responsive | Desktop only |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Overview │  │  Leads   │  │Campaigns │  │ Pipeline │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐     │
│  │              React Query + API Client              │     │
│  └────────────────────────┬──────────────────────────┘     │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Express Backend (localhost:3000)       │     │
│  │  /contacts  /campaigns  /companies  /health        │     │
│  └────────────────────────────────────────────────────┘     │
│                        BACKEND                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📑 Tab Structure (Final)

| Tab | Purpose | Backend Endpoints |
|-----|---------|-------------------|
| **Overview** | Dashboard with real stats | `/contacts/stats`, `/campaigns`, `/health`, `/activity` (new) |
| **Pipeline** | Visual flow + real stats | `/contacts/stats` (by status) |
| **Leads** | Contact management | `/contacts/*`, `/companies/*` |
| **Campaigns** | **NEW** - Campaign CRUD | `/campaigns/*` |
| **Analytics** | Funnel + performance | `/contacts/stats`, `/campaigns/:id/stats` |
| **Integrations** | **REPLACES Channels** - Status only | `/health`, `/ghl/status` (new) |
| **Settings** | Simplified ops config | `/api/v1/settings`, `/jobs/status` (new) |

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Day 1)
**Goal:** Set up API client and data fetching infrastructure

- [ ] Create `src/lib/api.ts` - API client with base URL
- [ ] Create `src/hooks/useApi.ts` - React Query hooks
- [ ] Create `src/types/api.ts` - TypeScript types matching backend
- [ ] Create `src/lib/queryClient.ts` - React Query configuration
- [ ] Add environment variable support (`.env.local`)
- [ ] Test connection to backend `/health` endpoint

**Files to create:**
```
frontend/src/
├── lib/
│   ├── api.ts          # API client
│   └── queryClient.ts  # React Query config
├── hooks/
│   └── useApi.ts       # Data fetching hooks
└── types/
    └── api.ts          # TypeScript interfaces
```

---

### Phase 2: Leads Tab - Core (Day 2-3)
**Goal:** Full leads management with real data

#### 2.1 Data Fetching
- [ ] `useContacts()` hook - fetch paginated contacts
- [ ] `useContact(id)` hook - fetch single contact
- [ ] `useContactStats()` hook - fetch statistics
- [ ] `useCompany(id)` hook - fetch company details

#### 2.2 UI Updates
- [ ] Replace mock data with real API calls
- [ ] Implement server-side pagination
- [ ] Implement all filters:
  - Status (new, validated, in_sequence, replied, bounced)
  - Source (apollo, import, manual, google_maps, hunter)
  - Email/Phone validation status
  - Date range
- [ ] Implement sorting (server-side)

#### 2.3 Lead Actions
- [ ] **View Details** - Modal with all contact fields + company info
- [ ] **Edit Lead** - Form to update contact via `PATCH /contacts/:id`
- [ ] **Delete Lead** - Confirmation + `DELETE /contacts/:id`
- [ ] **Add to Campaign** - Modal to select campaign + enroll
- [ ] **Send SMS** - Modal with message input (uses `POST /contacts/:id/sms`)
- [ ] **Export Selected** - Download CSV via `/contacts/export`

#### 2.4 Add Lead
- [ ] "Add Lead" button opens modal form
- [ ] Form fields matching backend schema
- [ ] Submit via `POST /contacts`

#### 2.5 Imports
- [ ] **Apollo Import Modal:**
  - Industry selector (HVAC, Solar, Roofing)
  - Location filters
  - Title filters
  - Employee count range
  - Submit via `POST /contacts/import/apollo`
  - Progress tracking via `GET /contacts/import/:jobId/status`
  
- [ ] **CSV Import Modal:**
  - File upload (drag & drop)
  - Column mapping preview
  - Submit via `POST /contacts/import/csv`
  - Progress toast notifications

#### 2.6 Highlight Replied Contacts
- [ ] Add visual indicator for `status === 'replied'`
- [ ] Special row styling (e.g., green left border)

---

### Phase 3: Overview Dashboard (Day 4)
**Goal:** Real-time dashboard with live data

#### 3.1 Stats Cards
- [ ] Total Leads → `GET /contacts/stats`
- [ ] Validated → count where `emailValidationStatus === 'valid'`
- [ ] Active Outreach → contacts in campaigns
- [ ] Replies → count where `status === 'replied'`

#### 3.2 System Health
- [ ] Ping `GET /health` endpoint
- [ ] Show Database status
- [ ] Show Redis status
- [ ] Show API status

#### 3.3 Activity Feed (Requires Backend)
**New Backend Endpoint Needed:** `GET /activity`
- [ ] Create `src/routes/activity.routes.ts`
- [ ] Create `src/services/activity.service.ts`
- [ ] Log events: imports, enrollments, replies, webhook events
- [ ] Frontend: Fetch and display recent activity

#### 3.4 Channel Performance
- [ ] Fetch campaign stats by channel type
- [ ] Calculate sent/delivered/opened rates

---

### Phase 4: Campaigns Tab - NEW (Day 5-6)
**Goal:** Full campaign management UI

#### 4.1 Campaign List
- [ ] Create `src/components/campaigns/Campaigns.tsx`
- [ ] Table with: Name, Type, Status, Contacts, Created
- [ ] Filters: Status (draft, active, paused, completed), Channel (email, sms, linkedin)

#### 4.2 Create Campaign
- [ ] "New Campaign" button opens form
- [ ] Fields:
  - Name
  - Channel (Email, SMS, LinkedIn)
  - Instantly Campaign ID (for email)
  - Google Sheet ID (for LinkedIn)
  - LinkedIn enabled toggle
- [ ] Submit via `POST /campaigns`

#### 4.3 Campaign Details
- [ ] View campaign with enrollments
- [ ] Stats: Total enrolled, Active, Completed, Replied
- [ ] Enrollment list with status

#### 4.4 Enroll Contacts
- [ ] "Enroll Contacts" button
- [ ] Contact selector (multi-select from Leads)
- [ ] Submit via `POST /campaigns/:id/enroll`

#### 4.5 Campaign Actions
- [ ] Pause/Resume campaign
- [ ] View enrollments
- [ ] Stop enrollment for contact

---

### Phase 5: Analytics Tab (Day 7)
**Goal:** Real analytics with funnel and campaign performance

#### 5.1 Contact Funnel
- [ ] Visual funnel chart:
  - Total Contacts
  - → Validated
  - → Enrolled in Campaign
  - → Replied
- [ ] Data from `/contacts/stats`

#### 5.2 Campaign Performance Table
- [ ] Fetch all campaigns via `GET /campaigns`
- [ ] Show: Name, Contacts, Open Rate, Reply Rate, Status
- [ ] Sort by performance metrics

#### 5.3 Channel Distribution
- [ ] Pie chart of campaigns by channel
- [ ] Real data from campaigns

---

### Phase 6: Pipeline Tab Updates (Day 8)
**Goal:** Show real stats on pipeline nodes

#### 6.1 Real Stats
- [ ] Lead Ingestion node → Total contacts count
- [ ] Validation node → Validated count
- [ ] Outreach node → Active enrollments count
- [ ] Reply Detection node → Replied count
- [ ] CRM Sync node → (keep as placeholder)

#### 6.2 Click Actions
- [ ] Click node → Show stats modal with breakdown
- [ ] Add visual indicators for active processes

---

### Phase 7: Integrations Tab - REPLACES Channels (Day 9)
**Goal:** Read-only integration status dashboard

#### 7.1 Create New Tab
- [ ] Create `src/components/integrations/Integrations.tsx`
- [ ] Replace "Channels" in sidebar navigation

#### 7.2 Integration Cards (Read-Only)
- [ ] **Apollo** - Connection status, last sync
- [ ] **Instantly** - Connection status, campaign linked
- [ ] **GoHighLevel** - Phone number, webhook URL, status
- [ ] **PhantomBuster** - Agent IDs configured
- [ ] **NeverBounce** - API status
- [ ] **Hunter.io** - API status
- [ ] **Apify** - Scraper status

#### 7.3 Backend Support
**New Endpoint Needed:** `GET /integrations/status`
- [ ] Check each integration's health
- [ ] Return status object for frontend

#### 7.4 Test Connection Buttons
- [ ] "Test" button for each integration
- [ ] Shows success/failure toast

---

### Phase 8: Settings Tab - Simplified (Day 10)
**Goal:** Operational settings only

#### 8.1 Remove Unnecessary Sections
- [ ] Remove Profile tab
- [ ] Remove Notifications tab (complex)
- [ ] Keep System tab (simplified)
- [ ] Keep Cron Jobs tab

#### 8.2 System Settings
- [ ] **LinkedIn Global Toggle** → `POST /api/v1/settings/linkedin/enable|disable`
- [ ] **Rate Limits Display** (read from backend config)
  - Emails per hour
  - SMS per hour
  - LinkedIn per day
- [ ] **Notification Email** input

#### 8.3 Cron Jobs Status
**New Backend Endpoint Needed:** `GET /jobs/status`
- [ ] Show job list with:
  - Name (Scrape, Enrich, Merge, Validate)
  - Last run time
  - Next run time
  - Status (running, paused, error)
- [ ] Manual "Run Now" trigger

#### 8.4 Theme Toggle
- [ ] Add dark/light mode toggle
- [ ] Persist preference in localStorage
- [ ] Use `next-themes` (already in dependencies)

---

### Phase 9: Webhook/Activity Logs (Day 11)
**Goal:** See what's happening in the system

#### 9.1 Backend Endpoint
**New Endpoint:** `GET /webhooks/logs`
- [ ] Store webhook events in DB
- [ ] Return recent webhook calls

#### 9.2 Logs UI
- [ ] Add "Activity" or "Logs" section (could be in Settings or separate)
- [ ] Show:
  - Timestamp
  - Source (Instantly, PhantomBuster, GHL, Apollo)
  - Event type
  - Status (success/error)
  - Details (expandable)

---

### Phase 10: Polish & Testing (Day 12)
**Goal:** Final touches and testing

#### 10.1 Toast Notifications
- [ ] Import complete notifications
- [ ] Campaign enrollment success
- [ ] Reply detected alerts
- [ ] Error handling toasts

#### 10.2 Loading States
- [ ] Skeleton loaders for tables
- [ ] Loading spinners for actions
- [ ] Disabled states during operations

#### 10.3 Error Handling
- [ ] API error display
- [ ] Retry mechanisms
- [ ] Offline indicator

#### 10.4 Testing
- [ ] Test all CRUD operations
- [ ] Test imports (Apollo + CSV)
- [ ] Test campaign enrollment
- [ ] Test filters and pagination

---

## 📁 New Backend Endpoints Needed

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET /activity` | Recent system activity | Medium |
| `GET /integrations/status` | All integration health | Medium |
| `GET /jobs/status` | Cron job status | Medium |
| `GET /webhooks/logs` | Webhook event logs | Low |
| `POST /jobs/:name/run` | Manual job trigger | Low |

---

## 🎨 UI Component Changes

### Sidebar Navigation (Final)
```
├── Overview      (Dashboard)
├── Pipeline      (Visual Flow)
├── Leads         (Contact Management)
├── Campaigns     (NEW - Campaign CRUD)
├── Analytics     (Funnel + Stats)
├── Integrations  (REPLACES Channels)
└── Settings      (Simplified)
```

### Theme Support
- Dark mode (current default)
- Light mode option
- System preference detection
- Toggle in header or settings

---

## 📊 Data Flow Examples

### Fetching Contacts
```typescript
// hooks/useContacts.ts
export function useContacts(filters: ContactFilters) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => api.get('/contacts', { params: filters }),
  });
}
```

### Creating a Campaign
```typescript
// hooks/useCampaigns.ts
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) => api.post('/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created!');
    },
  });
}
```

---

## ✅ Success Criteria

- [ ] All tabs display real data from backend
- [ ] CRUD operations work for Contacts and Campaigns
- [ ] Imports (Apollo + CSV) work with progress indication
- [ ] Health check shows real backend status
- [ ] Theme toggle works and persists
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive enough for desktop use

---

## 🚦 Ready to Start

**Next Step:** Begin Phase 1 - Foundation

Run in terminal:
```bash
cd frontend
npm run dev
```

Backend should be running:
```bash
cd backend
npm run dev
```

---

*Document auto-generated based on requirements discussion*

