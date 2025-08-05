import { ToolRackFunctions } from 'app/features/ATC/components/ToolRackFunctions.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import Button from 'app/components/Button';
import { useEffect, useState } from 'react';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { mapToolNicknamesAndStatus } from 'app/features/ATC/utils/ATCFunctions.ts';
import { ToolInstance } from 'app/features/ATC/components/ToolTable.tsx';
import { AdvancedOptions } from 'app/features/ATC/components/AdvancedOptions.tsx';

export function ATC() {
    const [showToolTable, setShowToolTable] = useState(false);
    const [tools, setTools] = useState<ToolInstance[]>([]);

    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const disabledButton = !isConnected;

    useEffect(() => {
        setTools(mapToolNicknamesAndStatus(toolTableData));
    }, [toolTableData]);

    function toggleToolTable(isOpen) {
        if (!isConnected) {
            return;
        }

        if (isOpen) {
            controller.command('gcode', ['$#']);
        }

        setShowToolTable(!showToolTable);
    }

    return (
        <div className="flex flex-col  w-full gap-2 relative">
            <div className="flex flex-col gap-2 w-36 justify-end absolute top-0 right-16">
                <ToolDisplayModal
                    showToolTable={showToolTable}
                    onOpenChange={toggleToolTable}
                    tools={tools}
                    disabled={disabledButton}
                />
                <AdvancedOptions />
            </div>

            <ToolDisplay tools={tools} disabled={disabledButton} />
        </div>
    );
}
