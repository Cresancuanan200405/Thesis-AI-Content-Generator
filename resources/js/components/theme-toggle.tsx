import { Moon, Sun } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps extends React.ComponentProps<typeof Button> {
    className?: string;
}

export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent p-0 shadow-none transition-all duration-200 hover:bg-transparent hover:opacity-80 active:scale-90 cursor-pointer dark:border-0 dark:bg-transparent dark:hover:bg-transparent dark:hover:opacity-80',
                className,
            )}
            data-test="theme-toggle"
            {...props}
        >
            {isDark ? (
                <Sun className="h-5 w-5 text-amber-400 transition-transform duration-200" />
            ) : (
                <Moon className="h-5 w-5 text-zinc-700 transition-transform duration-200" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

export default ThemeToggle;
