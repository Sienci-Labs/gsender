import { ToolStatus } from 'app/features/ATC/components/ui/StatusBadge.tsx';
import { Button } from 'app/components/Button/';
import { Settings } from 'lucide-react';

export const ProbeButton = ({
    status,
    onProbe,
}: {
    status: ToolStatus;
    onProbe?: () => void;
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
            case 'off-rack':
                return {
                    variant: 'error' as const,
                    text: 'Off Rack',
                };
        }
    };

    const config = getButtonConfig();

    return (
        <Button
            variant={config.variant}
            size="sm"
            disabled={config.disabled}
            onClick={onProbe}
            className="w-[100px] justify-center gap-2 px-2"
        >
            <Settings size={14} />
            {config.text}
        </Button>
    );
};
