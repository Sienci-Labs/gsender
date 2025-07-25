import { Dialog, DialogContent } from 'app/components/shadcn/Dialog.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { DialogTitle } from '@radix-ui/react-dialog';
import { ToolTable } from 'app/features/ATC/components/ToolTable.tsx';
import Button from 'app/components/Button';

export function ToolDisplayModal({
    showToolTable = false,
    onOpenChange = () => {},
}) {
    const toolTableData = useTypedSelector(
        (state: RootState) => state.controller.settings.toolTable,
    );

    return (
        <Dialog open={showToolTable} onOpenChange={onOpenChange}>
            <DialogTitle>
                <Button onClick={onOpenChange}>Tool Table</Button>
            </DialogTitle>
            <DialogContent className="overflow-hidden p-0 shadow-lg w-2/5">
                <div className="flex flex-col bg-white overflow-y-auto h-full p-4 gap-4">
                    <ToolTable tools={toolTableData} hideFunctions={false} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
