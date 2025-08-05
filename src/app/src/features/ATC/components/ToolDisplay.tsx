import Button from 'app/components/Button';
import {
    getToolAxisOffset,
    lookupToolName,
    unimplemented,
    unloadTool,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { LoadToolFlyout } from 'app/features/ATC/components/LoadToolFlyout.tsx';
import LoadToolPopover from 'app/features/ATC/components/LoadToolPopover.tsx';
import { PiEmpty } from 'react-icons/pi';
import { useState } from 'react';
import { CurrentToolInfo } from 'app/features/ATC/components/CurrentToolInfo.tsx';
export function ToolDisplay({
    tools,
    disabled,
    loadToolPopoverOpen,
    setLoadToolPopoverOpen,
}) {
    return (
        <div className="w-full flex flex-col gap-1">
            <div className="flex flex-col gap-2">
                <CurrentToolInfo disabled={disabled} />
            </div>
            <div className="flex flex-row gap-4 w-full">
                <LoadToolPopover
                    isOpen={loadToolPopoverOpen}
                    setIsOpen={setLoadToolPopoverOpen}
                    tools={tools}
                    disabled={disabled}
                />
                <Button
                    className="flex flex-row gap-2 items-center"
                    variant="primary"
                    onClick={unloadTool}
                    disabled={disabled}
                >
                    <PiEmpty />
                    Unload
                </Button>
            </div>
        </div>
    );
}
