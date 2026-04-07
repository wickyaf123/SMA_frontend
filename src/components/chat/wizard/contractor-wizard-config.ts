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
    label: 'Find {trade} contractors',
    value: 'aging',
    description: 'Contractors already pulling {trade} permits — target those due for upgrade or replacement',
    icon: 'search',
  },
  {
    label: 'Sell {trade} to other trades',
    value: 'cross_permit',
    description: 'Contractors in related trades (HVAC, roofing, etc.) who could add {trade}',
    icon: 'target',
  },
];

// ── Q3: Revenue Range ──────────────────────────────────────────────────
const REVENUE_OPTIONS: WizardStepOption[] = [
  { label: 'Under $500K', value: 'under_500k', description: 'Small contractors', icon: 'dollar-sign' },
  { label: '$500K - $1M', value: '500k-1m', description: 'Growing contractors', icon: 'dollar-sign' },
  { label: '$1M - $10M', value: '1m-10m', description: 'Established contractors', icon: 'dollar-sign' },
  { label: '$10M+', value: '10m+', description: 'Large contractors', icon: 'dollar-sign' },
  { label: 'Any size', value: 'any', description: 'No revenue filter', icon: 'search' },
];

// ── Q4: Location ───────────────────────────────────────────────────────
const CITY_OPTIONS: WizardStepOption[] = [
  { label: 'Scottsdale, AZ', value: 'scottsdale_az', description: 'Maricopa County', icon: 'map-pin' },
  { label: 'Phoenix, AZ', value: 'phoenix_az', description: 'Maricopa County', icon: 'map-pin' },
  { label: 'Los Angeles, CA', value: 'los_angeles_ca', description: 'Los Angeles County', icon: 'map-pin' },
  { label: 'Austin, TX', value: 'austin_tx', description: 'Travis County', icon: 'map-pin' },
  { label: 'Miami, FL', value: 'miami_fl', description: 'Miami-Dade County', icon: 'map-pin' },
  { label: 'Other city', value: 'other', description: 'Type a different city', icon: 'search' },
];

// ── Q5: Recency (cross_permit mode) ────────────────────────────────────
const RECENCY_CROSS_OPTIONS: WizardStepOption[] = [
  { label: 'Last 30 days', value: '30days', description: 'Most recent activity', icon: 'clock' },
  { label: 'Last 90 days', value: '90days', description: 'Past 3 months', icon: 'clock' },
  { label: 'Last 6 months', value: '6months', description: 'Past 6 months', icon: 'calendar' },
  { label: 'Last 12 months', value: '12months', description: 'Past year', icon: 'calendar' },
  { label: 'Custom range', value: 'custom', description: 'Specify exact dates', icon: 'calendar' },
];

// ── Q5: Recency (aging mode) ───────────────────────────────────────────
const RECENCY_AGING_OPTIONS: WizardStepOption[] = [
  { label: '5-7 years ago', value: '5-7years', description: 'Early replacement window', icon: 'clock' },
  { label: '7-10 years ago', value: '7-10years', description: 'Mid-life replacement', icon: 'clock' },
  { label: '10-15 years ago', value: '10-15years', description: 'End of life systems', icon: 'clock' },
  { label: '15-20 years ago', value: '15-20years', description: 'Overdue for replacement', icon: 'clock' },
  { label: 'Custom range', value: 'custom', description: 'Specify exact dates', icon: 'calendar' },
];

// ── Q6: Volume ─────────────────────────────────────────────────────────
const VOLUME_OPTIONS: WizardStepOption[] = [
  { label: '100 records', value: '100', description: 'Small targeted batch', icon: 'users' },
  { label: '250 records', value: '250', description: 'Standard batch (recommended)', icon: 'users' },
  { label: '500 records', value: '500', description: 'Large batch', icon: 'users' },
  { label: '1,000 records', value: '1000', description: 'Maximum batch', icon: 'users' },
  { label: 'Custom amount', value: 'custom', description: 'Specify your own number', icon: 'search' },
];

// ── Q7: Channels ───────────────────────────────────────────────────────
const CHANNEL_OPTIONS: WizardStepOption[] = [
  { label: 'Email only', value: 'email', description: 'Email outreach via Instantly', icon: 'mail' },
  { label: 'SMS only', value: 'sms', description: 'Text outreach via GHL', icon: 'phone' },
  { label: 'Email first, then SMS', value: 'email_then_sms', description: 'Email sequence with SMS follow-up', icon: 'message-circle' },
  { label: 'All channels', value: 'all', description: 'Email + SMS + LinkedIn', icon: 'users' },
  { label: 'Just pull the data', value: 'data_only', description: 'No outreach — export only', icon: 'file-text' },
];

// ── Permit Type Mapping ────────────────────────────────────────────────
// Maps trade + targeting intent to the permit types to search for
const PERMIT_TYPE_MAP: Record<string, string[]> = {
  // cross_permit: search for contractors in ADJACENT trades
  solar_cross_permit: ['hvac', 'roofing', 'electrical', 'pool'],
  hvac_cross_permit: ['electrical', 'plumbing', 'roofing', 'solar'],
  roofing_cross_permit: ['solar', 'hvac', 'electrical', 'general'],
  electrical_cross_permit: ['solar', 'hvac', 'plumbing', 'pool'],
  pool_spa_cross_permit: ['electrical', 'general'],
  general_contractor_cross_permit: ['hvac', 'electrical', 'roofing', 'plumbing', 'solar'],
  // aging: search for contractors in the SAME trade
  solar_aging: ['solar'],
  hvac_aging: ['hvac'],
  roofing_aging: ['roofing'],
  electrical_aging: ['electrical'],
  pool_spa_aging: ['pool'],
  general_contractor_aging: ['general'],
};

// ── Trade display labels ───────────────────────────────────────────────
const TRADE_LABELS: Record<string, string> = {
  solar: 'Solar',
  hvac: 'HVAC',
  roofing: 'Roofing',
  electrical: 'Electrical',
  pool_spa: 'Pool & Spa',
  general_contractor: 'General Contractor',
};

// ── Permit type labels (for confirmation step) ────────────────────────
const PERMIT_TYPE_LABELS: Record<string, string> = {
  hvac: 'HVAC permits', roofing: 'Roofing permits', electrical: 'Electrical permits',
  pool: 'Pool permits', plumbing: 'Plumbing permits', solar: 'Solar permits', general: 'General contractor permits',
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
  const key = `${state.trade}_${state.targetingIntent}`;
  const types = PERMIT_TYPE_MAP[key] || [];
  const labels = types.map((t) => PERMIT_TYPE_LABELS[t] || t);
  return `I'll search for contractors with these permit types:\n\n${labels.map((l) => `  - ${l}`).join('\n')}\n\nLook right?`;
}

// ── Config ─────────────────────────────────────────────────────────────

export const contractorWizardConfig: WizardConfig = {
  wizardType: 'contractor',
  eventName: 'contractor_search_ready',

  getSteps(state: Record<string, any>): WizardStepDefinition[] {
    const steps: WizardStepDefinition[] = [
      {
        id: 'trade',
        label: 'What do you sell?',
        type: 'single_select',
        options: TRADE_OPTIONS,
      },
      {
        id: 'targetingIntent',
        label: interpolate('What type of {trade} leads are you looking for?', state),
        type: 'single_select',
        options: interpolateOptions(INTENT_OPTIONS, state),
      },
      {
        id: 'permitConfirm',
        label: 'Permit types to search',
        type: 'confirm',
        options: [],
        confirmTitle: 'Search Confirmation',
        confirmDescription: getPermitConfirmDescription(state),
        confirmActions: [
          { label: 'Looks good', value: 'confirm', variant: 'default' },
          { label: 'Let me adjust', value: 'cancel', variant: 'outline' },
        ],
      },
      {
        id: 'revenueRange',
        label: 'For the contractors you\'re targeting, what annual revenue range? Select all that apply.',
        type: 'multi_select',
        options: REVENUE_OPTIONS,
        multiSelect: true,
        submitLabel: 'Continue with {count} selected',
      },
      {
        id: 'city',
        label: 'Which city should I search in?',
        type: 'single_select',
        options: CITY_OPTIONS,
      },
      {
        id: 'dateRanges',
        label: state.targetingIntent === 'aging'
          ? 'How old should the existing permits be? (select all that apply)'
          : 'How recent should the permits be? (select all that apply)',
        type: 'multi_select',
        options: state.targetingIntent === 'aging' ? RECENCY_AGING_OPTIONS : RECENCY_CROSS_OPTIONS,
        multiSelect: true,
        submitLabel: 'Continue with {count} selected',
      },
      {
        id: 'maxResults',
        label: 'How many contractor records do you want?',
        type: 'single_select',
        options: VOLUME_OPTIONS,
      },
      {
        id: 'channels',
        label: 'How do you want to reach these contractors?',
        type: 'single_select',
        options: CHANNEL_OPTIONS,
      },
    ];

    return steps;
  },

  buildPayload(state: Record<string, any>) {
    const key = `${state.trade}_${state.targetingIntent}`;
    const permitTypes = PERMIT_TYPE_MAP[key] || [state.trade];

    return {
      trade: state.trade,
      targetingIntent: state.targetingIntent,
      revenueRange: state.revenueRange ? state.revenueRange.split(',') : [],
      permitTypes,
      city: state.city,
      dateRanges: state.dateRanges ? state.dateRanges.split(',') : [],
      maxResults: parseInt(state.maxResults, 10) || 250,
      channels: state.channels,
    };
  },

  formatBreadcrumb(state: Record<string, any>): string {
    const parts: string[] = [];
    if (state.trade) parts.push(TRADE_LABELS[state.trade] || state.trade);
    if (state.targetingIntent) parts.push(state.targetingIntent === 'cross_permit' ? 'Cross-trade' : 'Same-trade');
    if (state.revenueRange) parts.push(state.revenueRange.split(',').length > 1 ? 'Multiple revenue ranges' : state.revenueRange);
    if (state.city) {
      const cityOpt = CITY_OPTIONS.find((c) => c.value === state.city);
      parts.push(cityOpt?.label || state.city);
    }
    if (state.dateRanges) {
      const count = state.dateRanges.split(',').length;
      parts.push(count > 1 ? `${count} date ranges` : state.dateRanges);
    }
    if (state.maxResults) parts.push(`${state.maxResults} records`);
    if (state.channels) parts.push(state.channels);
    return parts.join(' > ');
  },
};
