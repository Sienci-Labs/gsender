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
export function ToolDisplay({ tools }) {
    const [loadToolPopoverOpen, setLoadToolPopoverOpen] = useState(false);
    const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );

    return (
        <div className="w-full flex flex-col gap-1">
            <div className="flex flex-row gap-4">
                <span>Current Tool:</span>
                <span className="font-bold">{currentTool || 'Empty'}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4">
                    <span>Tool Name:</span>
                    <span className="font-bold">
                        {lookupToolName(currentTool)}
                    </span>
                </div>
                <div className="flex flex-row gap-4">
                    <span>Offset:</span>
                    <span className="font-bold">
                        {getToolAxisOffset(currentTool, 'Z', tools)}
                    </span>
                </div>
            </div>
            <div className="flex flex-row gap-4 w-full">
                <LoadToolPopover
                    isOpen={loadToolPopoverOpen}
                    setIsOpen={setLoadToolPopoverOpen}
                    tools={tools}
                />
                <Button
                    className="flex flex-row gap-2 items-center"
                    variant="primary"
                    onClick={unloadTool}
                >
                    <PiEmpty />
                    Unload
                </Button>
                <Button onClick={unimplemented}>Replace</Button>
            </div>
        </div>
    );
}
