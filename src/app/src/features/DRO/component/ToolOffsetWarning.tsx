import { AlertTriangle } from 'lucide-react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';

import { useToolOffsetApplied } from '../utils/useToolOffsetApplied';

export function ToolOffsetWarning() {
    const toolOffsetApplied = useToolOffsetApplied();

    if (toolOffsetApplied) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="flex flex-row gap-1 items-center justify-center py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-500 cursor-default"
                        role="status"
                    >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Tool offset not applied</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">
                    The loaded tool has a length in the tool table, but the
                    controller is in G49 so the work Z below does not include
                    it. Run a tool change or send G43 to apply it, and set a
                    startup line ($N0=G43) to have it re-applied automatically
                    after homing.
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
