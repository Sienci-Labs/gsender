import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import { useContext, useEffect, useState } from 'react';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import controller from 'app/lib/controller.ts';
import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';
import {
    ToolChangeContext,
    ToolchangeProvider,
    useToolChange,
} from 'app/features/ATC/utils/ToolChangeContext.tsx';

export function ATC() {
    const { tools, disabled, loadToolOpen, setLoadToolOpen } = useToolChange();

    return (
        <ToolchangeProvider>
            <div className="flex flex-col  w-full gap-2 relative">
                <div className="flex flex-col gap-2 w-36 justify-end absolute top-0 right-16">
                    <ToolDisplayModal />
                    <AdvancedOptions disabled={disabled} />
                </div>

                <ToolDisplay
                    tools={tools}
                    disabled={disabled}
                    loadToolPopoverOpen={loadToolOpen}
                    setLoadToolPopoverOpen={setLoadToolOpen}
                />
            </div>
        </ToolchangeProvider>
    );
}
