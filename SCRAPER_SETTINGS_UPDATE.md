# Frontend Scraper Settings Update

## Overview
Updated the frontend Settings UI to include all configurable fields for both Apify (Google Maps) and Apollo scrapers, matching the backend schema changes.

## Files Modified

### 1. `/frontend/src/types/api.ts`
Updated TypeScript interfaces to match backend schema:

#### `ApifyScraperSettings` Interface
**OLD (Limited):**
- `query: string` (single query)
- `location: string` (single location)
- Basic filters only

**NEW (Comprehensive):**
```typescript
export interface ApifyScraperSettings {
  searchTerms: string[];           // ✅ Multiple search terms
  locations: string[];              // ✅ Multiple locations
  industries: string[];             // ✅ Multiple industries (HVAC, SOLAR, ROOFING)
  maxResults: number;
  minRating: number;
  requirePhone: boolean;
  requireWebsite: boolean;
  skipClosed: boolean;
  language?: string;                // ✅ New: Search language
  searchMatching?: 'all' | 'exact'; // ✅ New: Match mode
  scrapePlaceDetails?: boolean;     // ✅ New: Extended details
  scrapeContacts?: boolean;         // ✅ New: Contact info
  scrapeReviews?: boolean;          // ✅ New: Include reviews
  maxReviews?: number;              // ✅ New: Review limit
  scrapeSocialMedia?: any;          // ✅ New: Social media
  minReviewCount?: number;          // ✅ New: Min reviews filter
}
```

#### `ApolloScraperSettings` Interface
**OLD (Limited):**
- Basic person/location filters only
- No organization keyword filters
- No advanced filters

**NEW (Comprehensive):**
```typescript
export interface ApolloScraperSettings {
  industry: string;
  personTitles: string[];
  locations: string[];
  excludeLocations: string[];
  employeesMin: number | null;
  employeesMax: number | null;
  revenueMin: number | null;
  revenueMax: number | null;
  enrichLimit: number;
  enrichPhones: boolean;
  searchKeywords?: string;              // ✅ New: REQUIRED search keywords
  personLocations?: string[];           // ✅ New: Person location filter
  personSeniorities?: string[];         // ✅ New: Seniority filter
  organizationKeywordTags?: string[];   // ✅ New: Positive keywords
  negativeKeywordTags?: string[];       // ✅ New: Negative keywords
  technologies?: string[];              // ✅ New: Tech stack filter
  industryTagIds?: string[];            // ✅ New: Industry tags
  employeeGrowthRate?: string;          // ✅ New: Growth filter
  fundingStage?: string;                // ✅ New: Funding filter
  page?: number;                        // ✅ New: Pagination
  perPage?: number;                     // ✅ New: Results per page
}
```

### 2. `/frontend/src/components/settings/Settings.tsx`

#### Updated State Initialization
Changed default form states to match the new schema structure:

**Apify Form:**
- Changed from single `query` and `location` to arrays: `searchTerms`, `locations`, `industries`
- Added all new optional fields with appropriate defaults
- All required fields start empty (user must configure)

**Apollo Form:**
- Changed `industry` from default 'HVAC' to empty string (required)
- Changed `personTitles` and `locations` from pre-filled to empty arrays (required)
- Added `searchKeywords` field (required)
- Added all new optional fields

#### Updated Apify Configuration UI

**New Features:**
1. **Search Terms** (Required)
   - Multi-line textarea for entering multiple search terms
   - One per line format
   - Example: "HVAC contractor", "heating and cooling"

2. **Locations** (Required)
   - Multi-line textarea for multiple locations
   - One per line format
   - Example: "Denver, CO", "Austin, TX"

3. **Industries** (Required)
   - Multi-line textarea for industries
   - Typically: HVAC, SOLAR, ROOFING

4. **Language Selector**
   - Dropdown: English, Spanish, French, German

5. **Search Matching Mode**
   - "All" (broader) or "Exact" (stricter)

6. **Advanced Options**
   - Scrape Place Details toggle
   - Scrape Contacts toggle
   - Scrape Reviews toggle
   - Max Reviews field (conditional, shown only if reviews enabled)
   - Min Review Count field

7. **Validation**
   - Save button disabled if required fields are missing
   - Red "Required" badges on mandatory fields
   - Reset button to revert changes

#### Updated Apollo Configuration UI

**New Sections:**

1. **Required Fields** (with red badges)
   - Industry
   - Search Keywords (NEW - main search filter)
   - Person Titles
   - Organization Locations

2. **Person Filters Section**
   - Person Titles (textarea, required)
   - Person Locations (textarea, optional)
   - Person Seniorities (textarea, optional)
     - Examples: owner, c_suite, vp, director, manager

3. **Organization Filters Section**
   - Organization Locations (textarea, required)
   - Exclude Locations (textarea, optional)
   - Positive Keyword Tags (textarea)
   - Negative Keyword Tags (textarea)
   - Technologies (textarea)

4. **Company Size Filters**
   - Min/Max Employees (unchanged)
   - Min/Max Revenue (unchanged, added examples)

5. **Additional Filters Section**
   - Employee Growth Rate (dropdown: Growing, Stable, Declining)
   - Funding Stage (dropdown: Seed, Series A, B, C+)
   - Page Number (for pagination)
   - Results Per Page (1-100)

6. **Validation**
   - Save button disabled if required fields are missing
   - Red "Required" badges on mandatory fields
   - Reset button to revert changes

## UI/UX Improvements

1. **Clear Visual Hierarchy**
   - Section headers with icons
   - Separators between major sections
   - Grouped related fields

2. **Better Help Text**
   - Every field has descriptive helper text
   - Examples provided for complex fields
   - Format hints (e.g., "comma-separated", "one per line")

3. **Required Field Indicators**
   - Red "Required" badges on mandatory fields
   - Save buttons disabled until required fields are filled
   - Descriptive card descriptions

4. **Improved Input Methods**
   - Textareas for multi-value fields (better than comma-separated inputs)
   - Dropdowns for constrained options (language, growth rate, funding stage)
   - Number inputs with min/max constraints

5. **Reset Functionality**
   - Reset button on both forms
   - Reverts to last saved settings

## Behavior Changes

### Before
- Forms had default values that would save even if user didn't configure
- Single location and search term supported
- Limited filtering options
- Settings were "pre-configured" with hardcoded defaults

### After
- Forms start empty - user MUST configure before saving
- Multiple locations, search terms, and industries supported
- Comprehensive filtering options for both scrapers
- Save buttons disabled until required fields are filled
- Backend will reject jobs if settings aren't properly configured
- Clear visual feedback for required vs. optional fields

## Testing Checklist

- [ ] Open Settings page and navigate to "Scrapers" tab
- [ ] Verify Apify form shows all new fields
- [ ] Verify Apollo form shows all new fields
- [ ] Verify required field badges are visible
- [ ] Verify save buttons are disabled when required fields are empty
- [ ] Fill in required fields and verify save button becomes enabled
- [ ] Save Apify settings and verify success toast
- [ ] Save Apollo settings and verify success toast
- [ ] Reload page and verify settings persist
- [ ] Test Reset button on both forms
- [ ] Test multi-line textareas (search terms, locations, etc.)
- [ ] Test dropdown selectors (language, growth rate, funding stage)
- [ ] Test conditional field display (max reviews only shown if scrape reviews is enabled)

## Notes

- All changes are backward compatible with existing API
- The backend enforces validation, so these UI changes provide a better user experience
- Users will see clear error messages from backend if they try to run scrapers without proper configuration
- The UI now matches the comprehensive backend schema 1:1

