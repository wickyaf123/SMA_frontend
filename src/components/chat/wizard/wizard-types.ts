export type WizardStepType = 'single_select' | 'multi_select' | 'confirm' | 'text_input';

export interface WizardStepOption {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

export interface WizardStepDefinition {
  id: string;
  label: string;
  type: WizardStepType;
  options: WizardStepOption[];
  multiSelect?: boolean;
  submitLabel?: string;
  /** Confirmation card fields (for type: 'confirm') */
  confirmTitle?: string;
  confirmDescription?: string;
  confirmActions?: Array<{
    label: string;
    value: string;
    variant: 'destructive' | 'default' | 'outline' | 'secondary';
  }>;
}

export interface WizardConfig {
  wizardType: 'contractor' | 'homeowner';
  eventName: string;
  /** Returns the ordered list of step definitions based on current wizard state */
  getSteps: (state: Record<string, any>) => WizardStepDefinition[];
  /** Builds the final SYSTEM_EVENT payload from wizard state */
  buildPayload: (state: Record<string, any>) => Record<string, any>;
  /** Generates breadcrumb text from state */
  formatBreadcrumb: (state: Record<string, any>) => string;
}
