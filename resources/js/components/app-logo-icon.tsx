import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AppLogoIconProps extends ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

export default function AppLogoIcon({
    className,
    alt = 'MarketPilot Logomark',
    ...props
}: AppLogoIconProps) {
    return (
        <img
            src="/MarketPilot.png"
            alt={alt}
            className={cn(
                'aspect-square object-contain select-none',
                className,
            )}
            loading="eager"
            decoding="async"
            {...props}
        />
    );
}
