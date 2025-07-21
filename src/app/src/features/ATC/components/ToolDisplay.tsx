import Button from 'app/components/Button';
import {
    getToolAxisOffset,
    lookupToolName,
    unimplemented,
    unloadTool,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import {LoadToolFlyout} from "app/features/ATC/components/LoadToolFlyout.tsx";

export function ToolDisplay() {
    const currentTool = useTypedSelector(
        (state: RootState) => state.controller.state.status?.currentTool,
    );
    const toolTable = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
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
                        {getToolAxisOffset(currentTool, 'Z', toolTable)}
                    </span>
                </div>
            </div>
            <div className="flex flex-row gap-4 w-full">
                <LoadToolFlyout />
                <Button variant="primary" onClick={unloadTool}>
                    Unload
                </Button>
                <Button onClick={unimplemented}>Replace</Button>
            </div>
        </div>
    );
}
