import { Badge } from 'app/features/ATC/components/ui/Badge';

export type ToolStatus = 'probed' | 'unprobed' | 'off-rack';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }: { status: ToolStatus }) => {
    const statusConfig = {
        probed: {
            variant: 'success' as const,
            icon: CheckCircle,
            label: 'Probed',
        },
        unprobed: {
            variant: 'warning' as const,
            icon: AlertCircle,
            label: 'Unprobed',
        },
        'off-rack': {
            variant: 'error' as const,
            icon: XCircle,
            label: 'Off Rack',
        },
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;
    return (
        <Badge
            variant={config.variant}
            className="gap-1 min-w-[90px] justify-center"
        >
            <IconComponent size={16} />
            {config.label}
        </Badge>
    );
};
