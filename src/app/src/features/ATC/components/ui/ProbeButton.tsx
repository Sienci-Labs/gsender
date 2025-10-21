import { Button } from 'app/components/Button/';
import { Settings } from 'lucide-react';
import { ToolStatus } from 'app/features/ATC/components/ToolTable.tsx';
import cn from 'classnames';

export const ProbeButton = ({
    status,
    onProbe,
    className,
}: {
    status: ToolStatus;
    onProbe?: () => void;
    className?: string;
}) => {
    const getButtonConfig = () => {
        switch (status) {
            case 'probed':
                return {
                    variant: 'primary' as const,
                    text: 'Probe Tool',
                };
            case 'unprobed':
                return {
                    variant: 'warning' as const,
                    text: 'Probe Tool',
                };
            case 'offrack':
                return {
                    variant: 'error' as const,
                    text: 'Off Rack',
                };
            default:
                return {
                    variant: 'error' as const,
                    text: 'Unknown',
                };
        }
    };

    const config = getButtonConfig();

    return (
        <Button
            variant={config.variant}
            size="sm"
            disabled={config.disabled}
            className={cn('w-[100px] justify-center gap-2 px-2', className)}
            onClick={onProbe}
        >
            <Settings size={14} />
            {config.text}
        </Button>
    );
};
