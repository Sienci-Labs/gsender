import { CurrentToolInfo } from 'app/features/ATC/components/CurrentToolInfo.tsx';
import LoadToolPopover from 'app/features/ATC/components/LoadToolPopover.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
export function ToolDisplay() {
    const { tools, disabled, loadToolOpen, setLoadToolOpen } = useToolChange();

    return (
        <div className="relative w-full h-full flex flex-col gap-3">
            <CurrentToolInfo disabled={disabled} />
            <LoadToolPopover
                isOpen={loadToolOpen}
                setIsOpen={setLoadToolOpen}
                tools={tools}
                disabled={disabled}
                trigger={<span className="absolute left-0 top-0 h-0 w-0" />}
                contentSide="right"
                contentAlign="start"
                contentAlignOffset={-8}
                contentSideOffset={0}
            />
        </div>
    );
}
