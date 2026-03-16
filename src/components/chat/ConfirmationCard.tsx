import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ConfirmationCardProps {
  id: string;
  title: string;
  description: string;
  actions: Array<{
    label: string;
    value: string;
    variant: 'destructive' | 'default' | 'outline' | 'secondary';
  }>;
  onAction: (id: string, value: string) => void;
  disabled?: boolean;
}

export const ConfirmationCard = ({
  id,
  title,
  description,
  actions,
  onAction,
  disabled,
}: ConfirmationCardProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const isDisabled = disabled || selectedValue !== null;
  const hasDestructive = actions.some((a) => a.variant === 'destructive');

  const handleAction = (value: string) => {
    setSelectedValue(value);
    onAction(id, value);
  };

  return (
    <Card className={cn(
      'max-w-md border-border/50 overflow-hidden',
      hasDestructive && !isDisabled && 'border-destructive/30',
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-2.5">
          {hasDestructive ? (
            <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
            <CardDescription className="text-xs mt-1 leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="p-4 pt-3 gap-2 flex-wrap">
        {actions.map((action) => {
          const isSelected = selectedValue === action.value;
          return (
            <Button
              key={action.value}
              variant={action.variant}
              size="sm"
              disabled={isDisabled}
              onClick={() => handleAction(action.value)}
              className={cn(
                'text-xs',
                isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
              )}
            >
              {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {action.label}
            </Button>
          );
        })}
      </CardFooter>
    </Card>
  );
};
