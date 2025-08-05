import { Dialog, DialogContent } from 'app/components/shadcn/Dialog.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { DialogTitle } from '@radix-ui/react-dialog';
import { ToolTable } from 'app/features/ATC/components/ToolTable.tsx';
import Button from 'app/components/Button';
import { LuTable } from 'react-icons/lu';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import controller from 'app/lib/controller.ts';

export function ToolDisplayModal() {
    const { connected, setShowTable, showTable, tools, disabled } =
        useToolChange();
    function onOpenChange(isOpen) {
        if (!connected) {
            return;
        }

        if (isOpen) {
            controller.command('gcode', ['$#']);
        }

        setShowTable(!showTable);
    }

    return (
        <Dialog open={showTable} onOpenChange={onOpenChange}>
            <DialogTitle>
                <Button
                    onClick={onOpenChange}
                    className="flex flex-row items-center gap-2"
                    disabled={disabled}
                >
                    <LuTable />
                    Tools
                </Button>
            </DialogTitle>
            <DialogContent className="overflow-hidden p-0 shadow-lg w-3/5">
                <div className="flex flex-col bg-white overflow-y-auto h-full p-4 gap-4">
                    <ToolTable
                        tools={tools}
                        hideFunctions={false}
                        disabled={disabled}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
