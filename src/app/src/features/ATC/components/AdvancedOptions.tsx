import { Pointer, PointerOff } from 'lucide-react';
import Button from 'app/components/Button';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCIConfiguration } from 'app/features/ATC/components/Configuration';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';

export function AdvancedOptions() {
    const {
        disabled,
        setLoadToolMode,
        setLoadToolOpen,
        currentTool,
    } = useToolChange();
    const handleManualLoad = () => {
        setLoadToolMode('load');
        setLoadToolOpen(true);
    };

    const handleManualUnload = () => {
        setLoadToolMode('save');
        setLoadToolOpen(true);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4">
            <div className="flex items-center justify-end gap-2">
                <ATCIConfiguration compact />
                <ToolDisplayModal />
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
                <Button
                    onClick={handleManualLoad}
                    size="sm"
                    disabled={disabled}
                    variant="ghost"
                    className="grid grid-cols-[20px_1fr] items-center justify-start gap-3 text-gray-600 text-left"
                >
                    <span className="flex h-5 w-5 items-center justify-center">
                        <Pointer className="h-4 w-4" />
                    </span>
                    Manual Load
                </Button>
                <Button
                    onClick={handleManualUnload}
                    size="sm"
                    disabled={disabled || currentTool === 0}
                    variant="ghost"
                    className="grid grid-cols-[20px_1fr] items-center justify-start gap-3 text-gray-600 text-left"
                >
                    <span className="flex h-5 w-5 items-center justify-center">
                        <PointerOff className="h-4 w-4" />
                    </span>
                    Manual Unload
                </Button>
            </div>
        </div>
    );
}
