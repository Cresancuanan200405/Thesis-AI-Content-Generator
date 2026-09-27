import { Link } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Download,
    Edit3,
    MoreVertical,
    Sparkles,
    Trash2,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CampaignData } from './types';

interface CampaignHeaderProps {
    campaign: CampaignData;
    onEdit: () => void;
    onDownloadAll: () => void;
    onArchive: () => void;
    onUnarchive: () => void;
    onDelete: () => void;
}

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    scheduled: 'Scheduled',
    completed: 'Completed',
    archived: 'Archived',
};

export function CampaignHeader({
    campaign,
    onEdit,
    onDownloadAll,
    onArchive,
    onUnarchive,
    onDelete,
}: CampaignHeaderProps) {
    const statusText = statusLabels[campaign.status] || campaign.status;

    const dateRangeText = campaign.start_date
        ? campaign.end_date && campaign.end_date !== campaign.start_date
            ? `${campaign.start_date} – ${campaign.end_date}`
            : campaign.start_date
        : 'Dates not set';

    const hasDesigns = campaign.designs && campaign.designs.length > 0;

    return (
        <header className="mb-6">
            {/* Campaign Identity & Primary Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
                        {campaign.name}
                    </h1>

                    {/* Clean plain-text meta line */}
                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                        {dateRangeText} • <span className="capitalize">{statusText}</span>
                    </p>
                </div>

                {/* Header Actions: Create Design (Text Button) + Kanban / Overflow Menu */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        asChild
                        size="sm"
                        className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                        <Link href={campaign.generator_url}>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Create Design</span>
                        </Link>
                    </Button>

                    <TooltipProvider>
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 shadow-none cursor-pointer"
                                            aria-label="More campaign options"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>More options</TooltipContent>
                            </Tooltip>

                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                    onClick={onEdit}
                                    className="cursor-pointer gap-2 text-xs"
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Edit Campaign
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={onDownloadAll}
                                    disabled={!hasDesigns}
                                    className="cursor-pointer gap-2 text-xs"
                                >
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    Download Assets ({campaign.designs?.length || 0})
                                </DropdownMenuItem>

                                {campaign.status !== 'archived' ? (
                                    <DropdownMenuItem
                                        onClick={onArchive}
                                        className="cursor-pointer gap-2 text-xs"
                                    >
                                        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                        Archive Campaign
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={onUnarchive}
                                        className="cursor-pointer gap-2 text-xs text-primary focus:text-primary"
                                    >
                                        <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                                        Restore to Active
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Campaign
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipProvider>
                </div>
            </div>
        </header>
    );
}
