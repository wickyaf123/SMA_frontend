import { useState, useCallback, useRef, useEffect } from 'react';
import { QuickReplyButtons } from '../QuickReplyButtons';
import { ConfirmationCard } from '../ConfirmationCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, AlertTriangle, Send } from 'lucide-react';
import type { WizardConfig, WizardStepDefinition } from './wizard-types';

interface SearchWizardProps {
  config: WizardConfig;
  onComplete: (payload: Record<string, any>) => void;
  onCancel: () => void;
}

export const SearchWizard = ({ config, onComplete, onCancel }: SearchWizardProps) => {
  const [state, setState] = useState<Record<string, any>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const steps = config.getSteps(state);
  const currentStep = steps[currentStepIndex] as WizardStepDefinition | undefined;
  const breadcrumb = config.formatBreadcrumb(state);

  // Auto-scroll to bottom when step changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStepIndex, showVolumeWarning]);

  const advanceOrComplete = useCallback(
    (newState: Record<string, any>) => {
      const updatedSteps = config.getSteps(newState);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex >= updatedSteps.length) {
        onComplete(config.buildPayload(newState));
      } else {
        setCurrentStepIndex(nextIndex);
      }
    },
    [config, currentStepIndex, onComplete],
  );

  const handleSelect = useCallback(
    (_id: string, value: string) => {
      if (!currentStep) return;

      // Handle "other" / "custom" values that need text input
      if (value === 'other' || value === 'custom') {
        setCustomInput('');
        // The step will re-render with a text input below
        setState((prev) => ({ ...prev, [`${currentStep.id}_needs_input`]: true }));
        return;
      }

      // Volume credit guardrail: warn if > 500
      if (currentStep.id === 'maxResults' && parseInt(value, 10) > 500 && !showVolumeWarning) {
        setState((prev) => ({ ...prev, [currentStep.id]: value }));
        setShowVolumeWarning(true);
        return;
      }

      const newState = { ...state, [currentStep.id]: value, [`${currentStep.id}_needs_input`]: false };
      setState(newState);
      advanceOrComplete(newState);
    },
    [currentStep, state, advanceOrComplete, showVolumeWarning],
  );

  const handleCustomSubmit = useCallback(() => {
    if (!currentStep || !customInput.trim()) return;

    // Volume guardrail for custom amounts
    if (currentStep.id === 'maxResults') {
      const num = parseInt(customInput, 10);
      if (isNaN(num) || num < 1) return;
      if (num > 1000) {
        // Hard stop
        return;
      }
      if (num > 500 && !showVolumeWarning) {
        setState((prev) => ({ ...prev, [currentStep.id]: String(num), [`${currentStep.id}_needs_input`]: false }));
        setShowVolumeWarning(true);
        return;
      }
    }

    const newState = { ...state, [currentStep.id]: customInput.trim(), [`${currentStep.id}_needs_input`]: false };
    setState(newState);
    setCustomInput('');
    advanceOrComplete(newState);
  }, [currentStep, customInput, state, advanceOrComplete, showVolumeWarning]);

  const handleVolumeWarningAction = useCallback(
    (_id: string, value: string) => {
      if (value === 'proceed') {
        setShowVolumeWarning(false);
        advanceOrComplete(state);
      } else {
        // Reduce to 500
        const newState = { ...state, maxResults: '500' };
        setState(newState);
        setShowVolumeWarning(false);
        advanceOrComplete(newState);
      }
    },
    [state, advanceOrComplete],
  );

  const handleConfirmAction = useCallback(
    (_id: string, value: string) => {
      if (!currentStep) return;
      if (value === 'confirm') {
        const newState = { ...state, [currentStep.id]: 'confirmed' };
        setState(newState);
        advanceOrComplete(newState);
      } else {
        // "Let me adjust" — go back to previous step
        const prevIndex = Math.max(0, currentStepIndex - 1);
        const prevStep = steps[prevIndex];
        if (prevStep) {
          const newState = { ...state };
          delete newState[prevStep.id];
          delete newState[currentStep.id];
          setState(newState);
          setCurrentStepIndex(prevIndex);
        }
      }
    },
    [currentStep, currentStepIndex, state, steps, advanceOrComplete],
  );

  const handleGoBack = useCallback(
    (targetIndex: number) => {
      if (targetIndex >= currentStepIndex) return;
      // Clear state for this step and all subsequent steps
      const newState = { ...state };
      for (let i = targetIndex; i < steps.length; i++) {
        delete newState[steps[i].id];
        delete newState[`${steps[i].id}_needs_input`];
      }
      setState(newState);
      setCurrentStepIndex(targetIndex);
      setShowVolumeWarning(false);
      setCustomInput('');
    },
    [currentStepIndex, state, steps],
  );

  const needsInput = currentStep && state[`${currentStep.id}_needs_input`];

  return (
    <div className="max-w-3xl mx-auto px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {config.wizardType === 'contractor' ? 'Find Contractors' : 'Find Homeowners'}
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Breadcrumb trail */}
      {breadcrumb && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 flex-wrap">
          {breadcrumb.split(' > ').map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
              <span className="truncate max-w-[120px]">{part}</span>
            </span>
          ))}
        </div>
      )}

      {/* Completed steps (read-only, clickable to go back) */}
      {steps.slice(0, currentStepIndex).map((step, i) => {
        const value = state[step.id];
        if (!value) return null;

        // Find the display label for the selected value
        let displayValue = value;
        if (step.type === 'confirm') {
          displayValue = 'Confirmed';
        } else if (step.multiSelect && value.includes(',')) {
          const values = value.split(',');
          const labels = values.map((v: string) => {
            const opt = step.options.find((o) => o.value === v);
            return opt?.label || v;
          });
          displayValue = labels.join(', ');
        } else {
          const opt = step.options.find((o) => o.value === value);
          displayValue = opt?.label || value;
        }

        return (
          <button
            key={step.id}
            onClick={() => handleGoBack(i)}
            className="w-full text-left mb-2 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 opacity-60 hover:opacity-90 hover:border-border/60 transition-all group"
          >
            <p className="text-xs text-muted-foreground">{step.label.replace(/\{trade\}/g, state.trade || '')}</p>
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{displayValue}</p>
          </button>
        );
      })}

      {/* Volume warning sub-step */}
      {showVolumeWarning && (
        <div className="mb-3">
          <ConfirmationCard
            id="volume-warning"
            title="Large batch warning"
            description={`Pulling ${state.maxResults || '1,000'}+ records uses more credits. Are you sure you want to continue?`}
            actions={[
              { label: 'Yes, continue', value: 'proceed', variant: 'default' },
              { label: 'Reduce to 500', value: 'reduce', variant: 'outline' },
            ]}
            onAction={handleVolumeWarningAction}
          />
        </div>
      )}

      {/* Current active step */}
      {currentStep && !showVolumeWarning && (
        <div className="mb-3">
          {currentStep.type === 'confirm' ? (
            <ConfirmationCard
              id={currentStep.id}
              title={currentStep.confirmTitle || 'Confirm'}
              description={currentStep.confirmDescription || ''}
              actions={currentStep.confirmActions || []}
              onAction={handleConfirmAction}
            />
          ) : needsInput ? (
            /* Custom text input mode */
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {currentStep.label.replace(/\{trade\}/g, state.trade || '')}
              </p>
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                  placeholder={
                    currentStep.id === 'city' ? 'Enter city name (e.g., Denver, CO)' :
                    currentStep.id === 'maxResults' ? 'Enter number (max 1,000)' :
                    'Enter your value...'
                  }
                  className="flex-1"
                  autoFocus
                />
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customInput.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Continue
                </Button>
              </div>
              {currentStep.id === 'maxResults' && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Maximum is 1,000 records per search
                </p>
              )}
            </div>
          ) : (
            /* Normal button selection */
            <QuickReplyButtons
              key={`${currentStep.id}-${currentStepIndex}`}
              id={currentStep.id}
              label={currentStep.label.replace(/\{trade\}/g, state.trade || '')}
              options={currentStep.options}
              onSelect={handleSelect}
              multiSelect={currentStep.multiSelect}
            />
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
