import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
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
}

export const QuickReplyButtons = ({
  id,
  label,
  options,
  onSelect,
  disabled,
}: QuickReplyButtonsProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const isDisabled = disabled || selectedValue !== null;
  const useCardLayout = options.some((o) => o.description || o.icon);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onSelect(id, value);
  };

  if (useCardLayout) {
    return (
      <div className="max-w-[90%]">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const IconComponent = option.icon ? iconMap[option.icon] : null;

            return (
              <button
                key={option.value}
                disabled={isDisabled && !isSelected}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'rounded-xl border border-border/50 bg-card px-4 py-3 text-left transition-all',
                  'hover:border-primary/40 hover:bg-muted/40',
                  isSelected && 'ring-2 ring-primary border-primary bg-primary/5',
                  isDisabled && !isSelected && 'opacity-40 cursor-not-allowed hover:bg-card hover:border-border/50',
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
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Legacy pill buttons
  return (
    <div className="max-w-[90%]">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <Button
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              disabled={isDisabled && !isSelected}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'text-xs transition-all',
                isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                isDisabled && !isSelected && 'opacity-40',
              )}
            >
              {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
