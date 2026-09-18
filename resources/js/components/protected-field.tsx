import { Lock } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface ProtectedFieldProps {
    label: string;
    value?: React.ReactNode;
    badgeText?: string;
    helperText?: string;
    icon?: React.ElementType;
    className?: string;
}

export function ProtectedField({
    label,
    value,
    badgeText = 'Protected after onboarding',
    helperText,
    icon: Icon,
    className = '',
}: ProtectedFieldProps) {
    const displayValue =
        value !== undefined && value !== null && value !== '' ? value : '—';

    return (
        <div className={`space-y-1.5 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                    {label}
                </Label>
                <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                    <Lock className="h-2.5 w-2.5 shrink-0" />
                    <span>{badgeText}</span>
                </Badge>
            </div>

            <div className="flex min-h-10 items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 text-sm font-medium text-foreground">
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && (
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{displayValue}</span>
                </div>
            </div>

            {helperText && (
                <p className="text-[11px] text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    );
}

export default ProtectedField;
