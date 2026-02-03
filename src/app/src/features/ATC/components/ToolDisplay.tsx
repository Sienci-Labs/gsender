import Button from 'app/components/Button';
import { unloadTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import LoadToolPopover from 'app/features/ATC/components/LoadToolPopover.tsx';
import { Download, Upload } from 'lucide-react';
import { CurrentToolInfo } from 'app/features/ATC/components/CurrentToolInfo.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
export function ToolDisplay() {
    const { tools, disabled, loadToolOpen, setLoadToolOpen } = useToolChange();

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <CurrentToolInfo disabled={disabled} />
            <div className="mt-auto grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                <LoadToolPopover
                    isOpen={loadToolOpen}
                    setIsOpen={setLoadToolOpen}
                    tools={tools}
                    disabled={disabled}
                    buttonSize="md"
                    buttonClassName="h-11 text-sm"
                />
                <Button
                    className="flex flex-row gap-2 items-center h-11 text-sm"
                    variant="secondary"
                    size="md"
                    onClick={unloadTool}
                    disabled={disabled}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Unload
                </Button>
            </div>
        </div>
    );
}
