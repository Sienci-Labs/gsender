import { ToolRackFunctions } from 'app/features/ATC/components/ToolRackFunctions.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';
import Button from 'app/components/Button';
import { useState } from 'react';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import controller from 'app/lib/controller.ts';

export function ATC() {
    const [showToolTable, setShowToolTable] = useState(false);

    function toggleToolTable(isOpen) {
        if (isOpen) {
            controller.command('gcode', ['$#']);
        }

        setShowToolTable(!showToolTable);
    }

    return (
        <div className="flex flex-col  w-full gap-4 relative">
            <div className="flex flex-row w-full justify-end absolute top-0 right-2">
                <ToolDisplayModal
                    showToolTable={showToolTable}
                    onOpenChange={toggleToolTable}
                />
            </div>
            <ToolDisplay />
            <ToolRackFunctions />

        </div>
    );
}
