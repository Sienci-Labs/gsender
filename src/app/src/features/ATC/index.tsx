import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';

import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';

import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import { ToolchangeProvider } from 'app/features/ATC/utils/ToolChangeContext.tsx';

export function ATC() {
    return (
        <ToolchangeProvider>
            <div className="flex flex-col  w-full gap-2 relative">
                <div className="flex flex-col gap-2 w-36 justify-end absolute top-0 right-16">
                    <ToolDisplayModal />
                    <AdvancedOptions />
                </div>

                <ToolDisplay />
            </div>
        </ToolchangeProvider>
    );
}
