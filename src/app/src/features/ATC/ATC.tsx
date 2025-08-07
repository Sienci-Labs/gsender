import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCUnavailable } from 'app/features/ATC/components/ATCUnavailable.tsx';
import { Disconnected } from 'app/features/ATC/components/Disconnected.tsx';

export function ATC() {
    const { atcAvailable, connected } = useToolChange();

    if (!connected) {
        return <Disconnected />;
    }
    if (!atcAvailable) {
        return <ATCUnavailable />;
    }
    return (
        <div className="w-full relative box-border">
            <div className="flex flex-col justify-end absolute top-2 right-2">
                <ToolDisplayModal />
            </div>
            <div className="grid grid-cols-[3fr_2fr] gap-0">
                <div>
                    <ToolDisplay />
                </div>
                <AdvancedOptions />
            </div>
        </div>
    );
}
