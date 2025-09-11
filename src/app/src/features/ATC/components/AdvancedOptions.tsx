import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from 'app/components/shadcn/Collapsible.tsx';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import Button from 'app/components/Button';
import { useState } from 'react';
import { LuHardHat } from 'react-icons/lu';
import { releaseToolFromSpindle } from 'app/features/ATC/utils/ATCFunctions.ts';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCIConfiguration } from 'app/features/ATC/components/Configuration';

export function AdvancedOptions() {
    const {
        disabled,
        setLoadToolMode,
        setLoadToolOpen,
        currentTool,
        connected,
    } = useToolChange();
    const [isOpen, setIsOpen] = useState(false);

    const handleLoadAndSave = () => {
        setLoadToolMode('loadAndSave');
        setLoadToolOpen(true);
    };

    const handleSaveToRack = () => {
        setLoadToolMode('save');
        setLoadToolOpen(true);
    };

    const loadAndSaveDisabled = !connected || currentTool === 0;

    return (
        <div className="flex flex-col w-full pt-10 mt-2">
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full"
            >
                <CollapsibleTrigger asChild className="p-0 w-full">
                    <button
                        variant="ghost"
                        className="flex w-full flex-row px-1 py-1 items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                        <div className="flex items-center gap-1">
                            <LuHardHat className="h-4 w-4" />
                            <span>Advanced Options</span>
                        </div>
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="flex flex-col gap-1">
                        <Button
                            onClick={releaseToolFromSpindle}
                            size="sm"
                            disabled={disabled}
                            variant="primary"
                        >
                            Release from Spindle
                        </Button>

                        <Button
                            onClick={handleSaveToRack}
                            size="sm"
                            disabled={disabled}
                            variant="primary"
                        >
                            Save to Rack
                        </Button>

                        <Button
                            onClick={handleLoadAndSave}
                            size="sm"
                            disabled={loadAndSaveDisabled}
                            variant="primary"
                        >
                            Load and Save to Rack
                        </Button>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
