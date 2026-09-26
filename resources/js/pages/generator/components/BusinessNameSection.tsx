import { Building2 } from 'lucide-react';
import { HelpTooltip } from '@/components/help-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface BusinessNameSectionProps {
    includeBusinessName: boolean;
    onToggleIncludeBusinessName: (val: boolean) => void;
    businessName?: string;
}

export function BusinessNameSection({
    includeBusinessName,
    onToggleIncludeBusinessName,
    businessName,
}: BusinessNameSectionProps) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <Label
                    htmlFor="include_business_name_toggle"
                    className="cursor-pointer text-xs font-semibold text-foreground"
                >
                    Include Business Name
                </Label>
                <HelpTooltip text="When enabled, the AI incorporates your registered business or shop name into the generated marketing creative." />
                {businessName && (
                    <span className="text-[11px] text-muted-foreground">
                        ({businessName})
                    </span>
                )}
            </div>
            <Checkbox
                id="include_business_name_toggle"
                checked={includeBusinessName}
                onCheckedChange={(checked) => {
                    const val = Boolean(checked);
                    onToggleIncludeBusinessName(val);
                    localStorage.setItem('ai_studio_include_business_name', String(val));
                }}
                className="h-5 w-5 cursor-pointer rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-600"
            />
        </div>
    );
}
