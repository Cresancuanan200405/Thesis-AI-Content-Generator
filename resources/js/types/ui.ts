import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};

export type OpenAIUsageTelemetry = {
    status?: 'active' | 'unavailable' | 'stale';
    application_configured_limit?: number;
    application_configured_limit_formatted?: string;
    budget_limit?: number;
    total_spent?: number | null;
    total_spent_formatted?: string;
    input_tokens?: number | null;
    input_tokens_formatted?: string;
    total_tokens?: number | null;
    total_tokens_formatted?: string;
    total_requests?: number | null;
    total_requests_formatted?: string;
    total_images?: number | null;
    images_generated_formatted?: string;
    api_credit_balance?: number | null;
    api_credit_balance_formatted?: string;
    credit_balance_available?: boolean;
    credit_balance_source?: string;
    credit_balance_status?: string;
    credit_balance_message?: string;
    remaining_configured_limit?: number | null;
    remaining_app_limit_formatted?: string;
    remaining_budget?: number | null;
    budget_percentage?: number | null;
    percentage_used?: number | null;
    is_limit_reached?: boolean;
    is_live_account?: boolean;
    source?: string;
    reporting_period?: string;
    last_synced_at?: string;
    last_synced_formatted?: string;
    organization_id?: string | null;
    organization_name?: string | null;
    error_message?: string | null;
};
