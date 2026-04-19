import type { WizardConfig, WizardStepDefinition, WizardStepOption } from './wizard-types';

// ── Q1: Trade ──────────────────────────────────────────────────────────
const TRADE_OPTIONS: WizardStepOption[] = [
  { label: 'Solar', value: 'solar', description: 'Solar panel installations', icon: 'sun' },
  { label: 'HVAC', value: 'hvac', description: 'Heating & cooling systems', icon: 'thermometer' },
  { label: 'Roofing', value: 'roofing', description: 'Roof repairs & replacement', icon: 'home' },
  { label: 'Electrical', value: 'electrical', description: 'Electrical work & wiring', icon: 'zap' },
  { label: 'Pool & Spa', value: 'pool_spa', description: 'Pool & spa construction', icon: 'droplets' },
  { label: 'General Contractor', value: 'general_contractor', description: 'General contracting work', icon: 'wrench' },
];

// ── Q2: Targeting Intent ───────────────────────────────────────────────
const INTENT_OPTIONS: WizardStepOption[] = [
  {
    label: 'New {trade} install',
    value: 'cross_permit',
    description: 'Homeowners showing buying signals who don\'t have {trade} yet',
    icon: 'search',
  },
  {
    label: 'Aging {trade} system',
    value: 'aging',
    description: 'Homeowners with existing {trade} that may need replacement',
    icon: 'clock',
  },
];

// ── Permit Type Matrix ─────────────────────────────────────────────────
const PERMIT_TYPE_MAP: Record<string, string[]> = {
  solar_cross_permit: ['pool', 'ev_charger', 'electrical_panel_upgrade', 'hvac', 'adu', 'new_construction', 'roof_replacement', 'generator', 'kitchen_remodel', 'home_addition'],
  solar_aging: ['solar', 'hvac'],
  hvac_cross_permit: ['new_construction', 'home_addition', 'electrical_panel_upgrade', 'adu', 'pool'],
  hvac_aging: ['hvac', 'water_heater', 'window_door'],
  roofing_cross_permit: ['storm_damage', 'home_addition', 'solar', 'adu'],
  roofing_aging: ['roofing', 'original_construction', 'solar'],
  electrical_cross_permit: ['ev_charger', 'solar', 'adu', 'hot_tub_spa', 'pool', 'new_construction'],
  electrical_aging: ['electrical', 'original_construction', 'generator'],
  pool_spa_cross_permit: ['home_addition', 'landscaping', 'new_construction'],
  pool_spa_aging: ['pool', 'pool_equipment', 'spa'],
  general_contractor_cross_permit: ['adu', 'home_addition', 'kitchen_bath_remodel', 'garage_conversion', 'demolition'],
  general_contractor_aging: ['original_construction', 'multiple_small_permits'],
};

// Readable descriptions for permit confirm step
const PERMIT_TYPE_LABELS: Record<string, string> = {
  pool: 'Pool permits', ev_charger: 'EV charger permits', electrical_panel_upgrade: 'Electrical panel upgrades',
  hvac: 'HVAC permits', adu: 'ADU permits', new_construction: 'New construction', roof_replacement: 'Roof replacement',
  generator: 'Generator permits', kitchen_remodel: 'Kitchen remodels', home_addition: 'Home additions',
  solar: 'Solar permits', water_heater: 'Water heater permits', window_door: 'Window/door permits',
  storm_damage: 'Storm damage permits', original_construction: 'Original construction', roofing: 'Roofing permits',
  electrical: 'Electrical permits', hot_tub_spa: 'Hot tub/spa permits', landscaping: 'Landscaping permits',
  pool_equipment: 'Pool equipment permits', spa: 'Spa permits', kitchen_bath_remodel: 'Kitchen/bath remodels',
  garage_conversion: 'Garage conversions', demolition: 'Demolition permits', multiple_small_permits: 'Multiple small permits',
};

// ── Q3: Recency ─────��──────────────────────────────────────────────────
const RECENCY_CROSS_OPTIONS: WizardStepOption[] = [
  { label: 'Last 6 months', value: '6months', description: 'Most recent activity', icon: 'clock' },
  { label: 'Last 1 year', value: '1year', description: 'Past 12 months', icon: 'calendar' },
  { label: 'Last 2 years', value: '2years', description: 'Wider search window', icon: 'calendar' },
  { label: 'Last 3 years', value: '3years', description: 'Broader coverage', icon: 'calendar' },
  { label: 'Last 5 years', value: '5years', description: 'Maximum coverage', icon: 'calendar' },
  { label: 'Custom range', value: 'custom', description: 'Specify exact dates', icon: 'calendar' },
];

const RECENCY_AGING_OPTIONS: WizardStepOption[] = [
  { label: '5-7 years ago', value: '5-7years', description: 'Early replacement window', icon: 'clock' },
  { label: '7-10 years ago', value: '7-10years', description: 'Mid-life replacement', icon: 'clock' },
  { label: '10-15 years ago', value: '10-15years', description: 'End of life systems', icon: 'clock' },
  { label: '15-20 years ago', value: '15-20years', description: 'Overdue for replacement', icon: 'clock' },
  { label: 'Custom range', value: 'custom', description: 'Specify exact dates', icon: 'calendar' },
];

// ── Q4: Location ───────────────────────────────────────────────────────
const CITY_OPTIONS: WizardStepOption[] = [
  { label: 'Scottsdale, AZ', value: 'scottsdale_az', description: 'Maricopa County', icon: 'map-pin' },
  { label: 'Phoenix, AZ', value: 'phoenix_az', description: 'Maricopa County', icon: 'map-pin' },
  { label: 'Los Angeles, CA', value: 'los_angeles_ca', description: 'Los Angeles County', icon: 'map-pin' },
  { label: 'Austin, TX', value: 'austin_tx', description: 'Travis County', icon: 'map-pin' },
  { label: 'Miami, FL', value: 'miami_fl', description: 'Miami-Dade County', icon: 'map-pin' },
  { label: 'Other city', value: 'other', description: 'Type a different city or zip code', icon: 'search' },
];

// ── Q4.5: Metro Neighborhoods ────���─────────────────────────────────────
const METRO_NEIGHBORHOODS: Record<string, WizardStepOption[]> = {
  los_angeles_ca: [
    { label: 'Hollywood', value: '90028', description: 'Median ~$703K', icon: 'map-pin' },
    { label: 'Silver Lake', value: '90026', description: 'Median ~$1.42M', icon: 'map-pin' },
    { label: 'Hollywood Hills', value: '90068', description: 'Median ~$1.72M', icon: 'map-pin' },
    { label: 'South LA', value: '90003', description: 'Median ~$749K', icon: 'map-pin' },
    { label: 'Downtown LA', value: '90012', description: 'Central DTLA', icon: 'map-pin' },
    { label: 'All of LA', value: 'los_angeles_ca', description: 'Full metro search', icon: 'search' },
  ],
  phoenix_az: [
    { label: 'Central Phoenix', value: '85004', description: 'Downtown core', icon: 'map-pin' },
    { label: 'Arcadia', value: '85018', description: 'Median ~$1.1M', icon: 'map-pin' },
    { label: 'Ahwatukee', value: '85044', description: 'Median ~$480K', icon: 'map-pin' },
    { label: 'Desert Ridge', value: '85050', description: 'Median ~$550K', icon: 'map-pin' },
    { label: 'All of Phoenix', value: 'phoenix_az', description: 'Full metro search', icon: 'search' },
  ],
  miami_fl: [
    { label: 'Miami Beach', value: '33139', description: 'Median ~$520K', icon: 'map-pin' },
    { label: 'Coral Gables', value: '33134', description: 'Median ~$1.2M', icon: 'map-pin' },
    { label: 'Brickell', value: '33131', description: 'Median ~$580K', icon: 'map-pin' },
    { label: 'Coconut Grove', value: '33133', description: 'Median ~$1.4M', icon: 'map-pin' },
    { label: 'All of Miami', value: 'miami_fl', description: 'Full metro search', icon: 'search' },
  ],
  new_york_ny: [
    { label: 'Brooklyn Heights', value: '11201', description: 'Median ~$1.1M', icon: 'map-pin' },
    { label: 'Astoria', value: '11102', description: 'Median ~$680K', icon: 'map-pin' },
    { label: 'Park Slope', value: '11215', description: 'Median ~$1.5M', icon: 'map-pin' },
    { label: 'Upper East Side', value: '10021', description: 'Median ~$1.3M', icon: 'map-pin' },
    { label: 'All of NYC', value: 'new_york_ny', description: 'Full metro search', icon: 'search' },
  ],
};

// ── Q5: Property Value Bands ───────���───────────────────────────────────
const METRO_VALUE_BANDS: Record<string, WizardStepOption[]> = {
  los_angeles_ca: [
    { label: 'Under $800K', value: 'under_800k', description: 'Lower-end for LA', icon: 'home' },
    { label: '$800K - $1.5M', value: '800k-1500k', description: 'Mid-range', icon: 'home' },
    { label: '$1.5M+', value: '1500k+', description: 'High-end', icon: 'building' },
    { label: 'Any value', value: 'any', description: 'No filter', icon: 'search' },
  ],
  _default: [
    { label: 'Under $400K', value: 'under_400k', description: 'Entry-level properties', icon: 'home' },
    { label: '$400K - $700K', value: '400k-700k', description: 'Mid-range properties', icon: 'home' },
    { label: '$700K - $1M', value: '700k-1m', description: 'Upper mid-range', icon: 'home' },
    { label: '$1M+', value: '1m+', description: 'Premium properties', icon: 'building' },
    { label: 'Any value', value: 'any', description: 'No filter', icon: 'search' },
  ],
};

// ── Q6: Volume ��────────────────────────────��───────────────────────────
const VOLUME_OPTIONS: WizardStepOption[] = [
  { label: '100 records', value: '100', description: 'Small targeted batch', icon: 'users' },
  { label: '250 records', value: '250', description: 'Standard batch (recommended)', icon: 'users' },
  { label: '500 records', value: '500', description: 'Large batch', icon: 'users' },
  { label: '1,000 records', value: '1000', description: 'Maximum batch', icon: 'users' },
  { label: 'Custom amount', value: 'custom', description: 'Specify your own number', icon: 'search' },
];

// ── Q7: Channels ───────────────────────────────────────────────────────
const CHANNEL_OPTIONS: WizardStepOption[] = [
  { label: 'Email', value: 'email', description: 'Email outreach sequences', icon: 'mail' },
  { label: 'SMS', value: 'sms', description: 'Text message outreach', icon: 'phone' },
  { label: 'Both', value: 'both', description: 'Email + SMS multi-channel', icon: 'message-circle' },
  { label: 'LinkedIn', value: 'linkedin', description: 'LinkedIn connection requests', icon: 'users' },
  { label: 'Just pull the data', value: 'data_only', description: 'No outreach — export only', icon: 'file-text' },
];

// ── Trade display labels ───────────────────────────────────────────────
const TRADE_LABELS: Record<string, string> = {
  solar: 'Solar', hvac: 'HVAC', roofing: 'Roofing', electrical: 'Electrical',
  pool_spa: 'Pool & Spa', general_contractor: 'General Contractor',
};

// ── Helpers ────────────────────────────────────────────────────────────

function interpolate(template: string, state: Record<string, any>): string {
  return template.replace(/\{trade\}/g, TRADE_LABELS[state.trade] || state.trade || '');
}

function interpolateOptions(options: WizardStepOption[], state: Record<string, any>): WizardStepOption[] {
  return options.map((opt) => ({
    ...opt,
    label: opt.label ? interpolate(opt.label, state) : opt.label,
    description: opt.description ? interpolate(opt.description, state) : opt.description,
  }));
}

function getPermitConfirmDescription(state: Record<string, any>): string {
  const key = `${state.trade}_${state.targetingMode}`;
  const types = PERMIT_TYPE_MAP[key] || [];
  const labels = types.map((t) => PERMIT_TYPE_LABELS[t] || t);
  return `Based on what you sell, I'm going to look for homeowners who pulled:\n\n${labels.map((l) => `  - ${l}`).join('\n')}\n\nSound right?`;
}

// ── Config ────────────────────────────────────────────────��────────────

export const homeownerWizardConfig: WizardConfig = {
  wizardType: 'homeowner',
  eventName: 'homeowner_search_ready',

  getSteps(state: Record<string, any>): WizardStepDefinition[] {
    const steps: WizardStepDefinition[] = [
      // Q1: Trade
      {
        id: 'trade',
        label: 'What do you sell?',
        type: 'single_select',
        options: TRADE_OPTIONS,
      },
      // Q2: Targeting Intent
      {
        id: 'targetingMode',
        label: interpolate(
          "Are you looking for homeowners who don't have {trade} yet, or those due for replacement?",
          state,
        ),
        type: 'single_select',
        options: interpolateOptions(INTENT_OPTIONS, state),
      },
      // Q2.5: Permit Type Confirmation
      {
        id: 'permitConfirm',
        label: 'Permit types to search for',
        type: 'confirm',
        options: [],
        confirmTitle: 'Permit Type Confirmation',
        confirmDescription: getPermitConfirmDescription(state),
        confirmActions: [
          { label: 'Looks good', value: 'confirm', variant: 'default' },
          { label: 'Let me adjust', value: 'cancel', variant: 'outline' },
        ],
      },
      // Q3: Recency
      {
        id: 'dateRanges',
        label: state.targetingMode === 'aging'
          ? 'How old should the existing permits be? (select all that apply)'
          : 'How recent should the permits be? (select all that apply)',
        type: 'multi_select',
        options: state.targetingMode === 'aging' ? RECENCY_AGING_OPTIONS : RECENCY_CROSS_OPTIONS,
        multiSelect: true,
        submitLabel: 'Continue with {count} selected',
      },
      // Q4: Location
      {
        id: 'city',
        label: 'Which area should I search in?',
        type: 'single_select',
        options: CITY_OPTIONS,
      },
    ];

    // Q4.5: Neighborhood sub-step (only for major metros)
    if (state.city && METRO_NEIGHBORHOODS[state.city]) {
      steps.push({
        id: 'neighborhood',
        label: 'Want to narrow down to a specific neighborhood?',
        type: 'single_select',
        options: METRO_NEIGHBORHOODS[state.city],
      });
    }

    // Q5: Property Value (market-aware bands)
    const valueBands = METRO_VALUE_BANDS[state.city] || METRO_VALUE_BANDS._default;
    steps.push({
      id: 'propertyValueRange',
      label: 'Filter by property value?',
      type: 'single_select',
      options: valueBands,
    });

    // Q6: Volume
    steps.push({
      id: 'maxResults',
      label: 'How many homeowner records do you want?',
      type: 'single_select',
      options: VOLUME_OPTIONS,
    });

    // Q7: Channels
    steps.push({
      id: 'channels',
      label: 'How do you want to reach these homeowners?',
      type: 'single_select',
      options: CHANNEL_OPTIONS,
    });

    return steps;
  },

  buildPayload(state: Record<string, any>) {
    const key = `${state.trade}_${state.targetingMode}`;
    const permitTypes = PERMIT_TYPE_MAP[key] || [];

    // Resolve geoId: neighborhood zip takes precedence over city
    const geoId = state.neighborhood && state.neighborhood !== state.city
      ? state.neighborhood  // zip code
      : undefined;          // let LLM resolve via lookup_geo_id

    return {
      trade: state.trade,
      targetingMode: state.targetingMode,
      permitTypes,
      dateRanges: state.dateRanges ? state.dateRanges.split(',') : [],
      city: state.city,
      geoId,
      propertyValueRange: state.propertyValueRange !== 'any' ? state.propertyValueRange : undefined,
      maxResults: parseInt(state.maxResults, 10) || 250,
      channels: state.channels,
    };
  },

  formatBreadcrumb(state: Record<string, any>): string {
    const parts: string[] = [];
    if (state.trade) parts.push(TRADE_LABELS[state.trade] || state.trade);
    if (state.targetingMode) parts.push(state.targetingMode === 'cross_permit' ? 'New install signals' : 'Aging replacement');
    if (state.dateRanges) {
      const count = state.dateRanges.split(',').length;
      parts.push(count > 1 ? `${count} date ranges` : state.dateRanges);
    }
    if (state.city) {
      const cityOpt = CITY_OPTIONS.find((c) => c.value === state.city);
      parts.push(cityOpt?.label || state.city);
    }
    if (state.neighborhood) {
      const neighborhoods = METRO_NEIGHBORHOODS[state.city];
      if (neighborhoods) {
        const nbOpt = neighborhoods.find((n) => n.value === state.neighborhood);
        if (nbOpt && nbOpt.value !== state.city) parts.push(nbOpt.label);
      }
    }
    if (state.propertyValueRange && state.propertyValueRange !== 'any') parts.push(state.propertyValueRange);
    if (state.maxResults) parts.push(`${state.maxResults} records`);
    if (state.channels) parts.push(state.channels);
    return parts.join(' > ');
  },
};
