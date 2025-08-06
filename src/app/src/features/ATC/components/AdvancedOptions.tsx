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

export function AdvancedOptions() {
    const { disabled, setLoadToolMode, setLoadToolOpen } = useToolChange();
    const [isOpen, setIsOpen] = useState(false);

    const handleLoadAndSave = () => {
        setLoadToolMode('loadAndSave');
        setLoadToolOpen(true);
    };

    const handleSaveToRack = () => {
        setLoadToolMode('save');
        setLoadToolOpen(true);
    };

    return (
        <div className="flex w-36">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="justify-between px-3 py-2 h-auto text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-b border-b-blue-500"
                    >
                        <div className="flex items-center gap-2">
                            <LuHardHat className="h-4 w-4" />
                            <span>Advanced Options</span>
                        </div>
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="px-3 pb-1 space-y-1">
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
                            disabled={disabled}
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
