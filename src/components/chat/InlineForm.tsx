import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';

export interface InlineFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: (string | { label: string; value: string })[];
  defaultValue?: string;
}

export interface InlineFormProps {
  id: string;
  title: string;
  fields: InlineFormField[];
  submitLabel: string;
  onSubmit: (id: string, data: Record<string, any>) => void;
  disabled?: boolean;
}

export const InlineForm = ({
  id,
  title,
  fields,
  submitLabel,
  onSubmit,
  disabled,
}: InlineFormProps) => {
  const buildInitialValues = () => {
    const values: Record<string, any> = {};
    for (const field of fields) {
      if (field.type === 'checkbox') {
        values[field.name] = field.defaultValue === 'true';
      } else {
        values[field.name] = field.defaultValue ?? '';
      }
    }
    return values;
  };

  const [values, setValues] = useState<Record<string, any>>(buildInitialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const isDisabled = disabled || submitted;

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required) {
        const val = values[field.name];
        if (field.type === 'checkbox') {
          if (!val) newErrors[field.name] = 'This field is required';
        } else if (!val || (typeof val === 'string' && val.trim() === '')) {
          newErrors[field.name] = 'This field is required';
        }
      }
      if (field.type === 'email' && values[field.name]) {
        const emailVal = String(values[field.name]).trim();
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
          newErrors[field.name] = 'Invalid email address';
        }
      }
      if (field.type === 'number' && values[field.name]) {
        const numVal = String(values[field.name]).trim();
        if (numVal && isNaN(Number(numVal))) {
          newErrors[field.name] = 'Must be a number';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    onSubmit(id, values);
  };

  const renderField = (field: InlineFormField) => {
    const error = errors[field.name];
    const fieldId = `${id}-${field.name}`;

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={fieldId} className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Select
              value={values[field.name] || undefined}
              onValueChange={(val) => setValue(field.name, val)}
              disabled={isDisabled}
            >
              <SelectTrigger id={fieldId} className={cn('h-9 text-xs', error && 'border-destructive')}>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((opt) => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={fieldId} className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={values[field.name] || ''}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={cn('text-xs min-h-[60px] resize-none', error && 'border-destructive')}
            />
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center gap-2 py-1">
            <Checkbox
              id={fieldId}
              checked={!!values[field.name]}
              onCheckedChange={(checked) => setValue(field.name, !!checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={fieldId} className="text-xs font-normal cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {error && <p className="text-[11px] text-destructive ml-1">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={fieldId} className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              value={values[field.name] || ''}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={cn('h-9 text-xs', error && 'border-destructive')}
            />
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Card className="max-w-md border-border/50 overflow-hidden">
      <form onSubmit={handleSubmit}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-3">
          {fields.map(renderField)}
        </CardContent>

        <CardFooter className="p-4 pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={isDisabled}
            className="text-xs"
          >
            {submitted && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {submitted ? 'Submitted' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
