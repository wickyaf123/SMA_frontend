import { useState, useCallback, useRef, useEffect } from 'react';
import { QuickReplyButtons } from '../QuickReplyButtons';
import { ConfirmationCard } from '../ConfirmationCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Send, X } from 'lucide-react';
import type { WizardConfig, WizardStepDefinition } from './wizard-types';

interface InlineChatWizardProps {
  config: WizardConfig;
  onComplete: (payload: Record<string, any>) => void;
  onCancel: () => void;
}

export const InlineChatWizard = ({ config, onComplete, onCancel }: InlineChatWizardProps) => {
  const [state, setState] = useState<Record<string, any>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const steps = config.getSteps(state);
  const currentStep = steps[currentStepIndex] as WizardStepDefinition | undefined;

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

      if (value === 'other' || value === 'custom') {
        setCustomInput('');
        setState((prev) => ({ ...prev, [`${currentStep.id}_needs_input`]: true }));
        return;
      }

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

    if (currentStep.id === 'maxResults') {
      const num = parseInt(customInput, 10);
      if (isNaN(num) || num < 1) return;
      if (num > 1000) return;
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

  const needsInput = currentStep && state[`${currentStep.id}_needs_input`];

  // Get display value for a completed step
  const getDisplayValue = (step: WizardStepDefinition, value: string): string => {
    if (step.type === 'confirm') return 'Confirmed';
    if (step.multiSelect && value.includes(',')) {
      const values = value.split(',');
      return values.map((v: string) => {
        const opt = step.options.find((o) => o.value === v);
        return opt?.label || v;
      }).join(', ');
    }
    const opt = step.options.find((o) => o.value === value);
    return opt?.label || value;
  };

  return (
    <>
      {/* Completed steps as chat message pairs */}
      {steps.slice(0, currentStepIndex).map((step, i) => {
        const value = state[step.id];
        if (!value) return null;

        return (
          <div key={step.id} className="contents">
            {/* Assistant message with question */}
            <div className="flex gap-4 w-full">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                <span className="text-white font-bold text-sm leading-none">J</span>
              </div>
              <div className="max-w-[85%] flex flex-col gap-1.5 min-w-0">
                <div className="text-[15px] leading-relaxed text-foreground py-1">
                  <p className="leading-relaxed">{step.label.replace(/\{trade\}/g, state.trade || '')}</p>
                </div>
              </div>
            </div>
            {/* User message with selection */}
            <div className="flex gap-4 w-full flex-row-reverse">
              <div className="flex flex-col gap-1.5 min-w-0 items-end max-w-[70%]">
                <div className="text-[15px] leading-relaxed bg-muted text-foreground px-5 py-2.5 rounded-3xl">
                  <span className="whitespace-pre-wrap break-words leading-relaxed">
                    {getDisplayValue(step, value)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Volume warning */}
      {showVolumeWarning && (
        <div className="flex gap-4 w-full">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <span className="text-white font-bold text-sm leading-none">J</span>
          </div>
          <div className="max-w-[85%] flex flex-col gap-1.5 min-w-0">
            <div className="text-[15px] leading-relaxed text-foreground py-1">
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
          </div>
        </div>
      )}

      {/* Current active step as assistant message */}
      {currentStep && !showVolumeWarning && (
        <div className="flex gap-4 w-full">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <span className="text-white font-bold text-sm leading-none">J</span>
          </div>
          <div className="max-w-[85%] flex flex-col gap-1.5 min-w-0">
            <div className="text-[15px] leading-relaxed text-foreground py-1">
              {currentStep.type === 'confirm' ? (
                <ConfirmationCard
                  id={currentStep.id}
                  title={currentStep.confirmTitle || 'Confirm'}
                  description={currentStep.confirmDescription || ''}
                  actions={currentStep.confirmActions || []}
                  onAction={handleConfirmAction}
                />
              ) : needsInput ? (
                <div>
                  <p className="leading-relaxed mb-3">
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
                      Go
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
                <div>
                  <QuickReplyButtons
                    key={`${currentStep.id}-${currentStepIndex}`}
                    id={currentStep.id}
                    label={currentStep.label.replace(/\{trade\}/g, state.trade || '')}
                    options={currentStep.options}
                    onSelect={handleSelect}
                    multiSelect={currentStep.multiSelect}
                  />
                </div>
              )}

              {/* Cancel link */}
              {currentStepIndex === 0 && (
                <button
                  onClick={onCancel}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground mt-2 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </>
  );
};
