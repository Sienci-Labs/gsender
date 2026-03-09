import cn from 'classnames';
import { Badge } from 'app/features/ATC/components/ui/Badge';
import {
    getToolStateClasses,
    manualChipTheme,
    toolStateThemes,
} from 'app/features/ATC/utils/ATCiConstants.ts';
import { ToolProbeState } from 'app/features/ATC/types.ts';

const sizeClasses = {
    xs: {
        container: 'gap-1',
        pill: 'h-4 px-1.5 py-0 text-[10px]',
        pillIcon: 12,
        pillIconOnly: 'h-4 w-4 p-0 text-[10px]',
        chip: 'h-4 w-4',
        chipIcon: 12,
    },
    sm: {
        container: 'gap-1',
        pill: 'h-5 px-2 py-0 text-xs',
        pillIcon: 14,
        pillIconOnly: 'h-5 w-5 p-0 text-xs',
        chip: 'h-5 w-5',
        chipIcon: 14,
    },
    md: {
        container: 'gap-1.5',
        pill: 'h-6 px-2.5 py-0 text-xs',
        pillIcon: 16,
        pillIconOnly: 'h-6 w-6 p-0 text-xs',
        chip: 'h-6 w-6',
        chipIcon: 16,
    },
} as const;

export function ToolStatusBadges({
    probeState,
    isManual = false,
    size = 'md',
    showLabel = true,
    manualPosition = 'before',
    className,
}: {
    probeState: ToolProbeState;
    isManual?: boolean;
    size?: 'xs' | 'sm' | 'md';
    showLabel?: boolean;
    manualPosition?: 'before' | 'after';
    className?: string;
}) {
    const sizeConfig = sizeClasses[size];
    const statusTheme = toolStateThemes[probeState];
    const StatusIcon = statusTheme.icon;
    const ManualIcon = manualChipTheme.icon;

    const statusBadge = (
        <Badge
            className={cn(
                'justify-center',
                getToolStateClasses(probeState),
                showLabel ? 'gap-1 min-w-[82px]' : 'gap-0',
                showLabel ? sizeConfig.pill : sizeConfig.pillIconOnly,
            )}
        >
            <StatusIcon size={sizeConfig.pillIcon} />
            {showLabel ? statusTheme.label : null}
        </Badge>
    );

    const manualBadge = isManual ? (
        <Badge
            className={cn(
                'justify-center p-0 rounded-full border',
                manualChipTheme.backgroundColor,
                manualChipTheme.borderColor,
                manualChipTheme.textColor,
                sizeConfig.chip,
            )}
            title="Manual (off-rack)"
            aria-label="Manual tool (off-rack)"
        >
            <ManualIcon size={sizeConfig.chipIcon} aria-hidden />
        </Badge>
    ) : null;

    return (
        <div
            className={cn('inline-flex items-center', sizeConfig.container, className)}
        >
            {manualPosition === 'before' ? manualBadge : null}
            {statusBadge}
            {manualPosition === 'after' ? manualBadge : null}
        </div>
    );
}
