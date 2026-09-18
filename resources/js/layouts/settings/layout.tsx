import type { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
            {children}
        </div>
    );
}
