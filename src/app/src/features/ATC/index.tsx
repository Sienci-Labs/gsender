import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';

import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';

import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import { ToolchangeProvider } from 'app/features/ATC/utils/ToolChangeContext.tsx';

export function ATC() {
    return (
        <ToolchangeProvider>
            <div className="grid grid-cols-[2fr_2fr] w-full relative box-border">
                <div className="flex flex-col justify-end absolute top-2 right-2">
                    <ToolDisplayModal />
                </div>
                <div className="bg-red-500">
                    <ToolDisplay />
                </div>
                <AdvancedOptions />
            </div>
        </ToolchangeProvider>
    );
}
