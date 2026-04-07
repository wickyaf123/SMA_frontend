import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Send,
  Sun,
  Thermometer,
  Zap,
  Droplets,
  Home,
  Wrench,
  MapPin,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  MessageCircle,
  Search,
  Building,
  FileText,
  DollarSign,
  Target,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  sun: Sun,
  thermometer: Thermometer,
  zap: Zap,
  droplets: Droplets,
  home: Home,
  wrench: Wrench,
  'map-pin': MapPin,
  calendar: Calendar,
  clock: Clock,
  users: Users,
  mail: Mail,
  phone: Phone,
  'message-circle': MessageCircle,
  search: Search,
  building: Building,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  target: Target,
};

export interface QuickReplyOption {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

export interface QuickReplyButtonsProps {
  id: string;
  label: string;
  options: QuickReplyOption[];
  onSelect: (id: string, value: string) => void;
  disabled?: boolean;
  multiSelect?: boolean;
}

export const QuickReplyButtons = ({
  id,
  label,
  options,
  onSelect,
  disabled,
  multiSelect,
}: QuickReplyButtonsProps) => {
  // Single-select state
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  // Multi-select state
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [multiSubmitted, setMultiSubmitted] = useState(false);

  const singleDisabled = disabled || selectedValue !== null;
  const useCardLayout = options.some((o) => o.description || o.icon);

  const handleSingleSelect = (value: string) => {
    setSelectedValue(value);
    onSelect(id, value);
  };

  const handleMultiToggle = (value: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleMultiSubmit = () => {
    if (selectedValues.size === 0) return;
    setMultiSubmitted(true);
    const commaSeparated = Array.from(selectedValues).join(',');
    onSelect(id, commaSeparated);
  };

  // --- Card layout ---
  if (useCardLayout) {
    return (
      <div className="max-w-[90%]">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => {
            const IconComponent = option.icon ? iconMap[option.icon] : null;

            if (multiSelect) {
              const isChecked = selectedValues.has(option.value);
              const isItemDisabled = disabled || multiSubmitted;

              return (
                <button
                  key={option.value}
                  disabled={isItemDisabled}
                  onClick={() => handleMultiToggle(option.value)}
                  className={cn(
                    'rounded-xl border border-border/50 bg-card px-4 py-3 text-left transition-all overflow-hidden',
                    'hover:border-primary/40 hover:bg-muted/40',
                    isChecked && 'ring-2 ring-primary border-primary bg-primary/5',
                    isItemDisabled && !isChecked && 'opacity-40 cursor-not-allowed hover:bg-card hover:border-border/50',
                    isItemDisabled && isChecked && 'cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {(IconComponent || isChecked) && (
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : IconComponent ? (
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                        ) : null}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug truncate">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            }

            // Single-select card
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                disabled={singleDisabled && !isSelected}
                onClick={() => handleSingleSelect(option.value)}
                className={cn(
                  'rounded-xl border border-border/50 bg-card px-4 py-3 text-left transition-all overflow-hidden',
                  'hover:border-primary/40 hover:bg-muted/40',
                  isSelected && 'ring-2 ring-primary border-primary bg-primary/5',
                  singleDisabled && !isSelected && 'opacity-40 cursor-not-allowed hover:bg-card hover:border-border/50',
                )}
              >
                <div className="flex items-start gap-3">
                  {(IconComponent || isSelected) && (
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : IconComponent ? (
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      ) : null}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug truncate">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {multiSelect && selectedValues.size > 0 && (
          <div className="mt-3">
            <Button
              variant="default"
              size="sm"
              disabled={multiSubmitted}
              onClick={handleMultiSubmit}
              className="transition-all"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Search with {selectedValues.size} selected
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Legacy pill buttons ---
  return (
    <div className="max-w-[90%]">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          if (multiSelect) {
            const isChecked = selectedValues.has(option.value);
            const isItemDisabled = disabled || multiSubmitted;

            return (
              <Button
                key={option.value}
                variant={isChecked ? 'default' : 'outline'}
                size="sm"
                disabled={isItemDisabled && !isChecked}
                onClick={() => handleMultiToggle(option.value)}
                className={cn(
                  'text-xs transition-all',
                  isChecked && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                  isItemDisabled && !isChecked && 'opacity-40',
                  isItemDisabled && isChecked && 'cursor-not-allowed',
                )}
              >
                {isChecked && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {option.label}
              </Button>
            );
          }

          // Single-select pill
          const isSelected = selectedValue === option.value;
          return (
            <Button
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              disabled={singleDisabled && !isSelected}
              onClick={() => handleSingleSelect(option.value)}
              className={cn(
                'text-xs transition-all',
                isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                singleDisabled && !isSelected && 'opacity-40',
              )}
            >
              {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {option.label}
            </Button>
          );
        })}
      </div>
      {multiSelect && selectedValues.size > 0 && (
        <div className="mt-3">
          <Button
            variant="default"
            size="sm"
            disabled={multiSubmitted}
            onClick={handleMultiSubmit}
            className="transition-all"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Search with {selectedValues.size} selected
          </Button>
        </div>
      )}
    </div>
  );
};
