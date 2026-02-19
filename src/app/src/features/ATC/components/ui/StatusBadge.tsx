import { Badge } from 'app/features/ATC/components/ui/Badge';
import { ToolStatus } from 'app/features/ATC/components/ToolTable.tsx';
import cn from 'classnames';
import {
    getToolStateClasses,
    toolStateThemes,
} from 'app/features/ATC/utils/ATCiConstants.ts';

export const StatusBadge = ({ status }: { status: ToolStatus }) => {
    const config = toolStateThemes[status];
    const IconComponent = config.icon;
    return (
        <Badge
            className={cn(
                'gap-1 min-w-[110px] justify-center',
                getToolStateClasses(status),
            )}
        >
            <IconComponent size={16} />
            {config.label}
        </Badge>
    );
};
