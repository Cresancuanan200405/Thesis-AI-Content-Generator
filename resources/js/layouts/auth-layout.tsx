import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    logoClassName,
    titleClassName,
    children,
}: {
    title?: string;
    description?: string;
    logoClassName?: string;
    titleClassName?: string;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            logoClassName={logoClassName}
            titleClassName={titleClassName}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
