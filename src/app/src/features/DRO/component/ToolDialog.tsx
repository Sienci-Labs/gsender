import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { Button } from 'app/components/Button';
import controller from 'app/lib/controller';
import store from 'app/store';

interface ToolDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ToolDialog: React.FC<ToolDialogProps> = ({ isOpen, onOpenChange }) => {
    const numberOfTools = store.get('workspace.toolChange.numberOfTools', 8);

    const handleToolChange = (toolNumber: number) => {
        const gcode = `M6 T${toolNumber}`;
        controller.command('gcode', [gcode]);
        onOpenChange(false);
    };

    const handleUnloadTool = () => {
        controller.command('gcode', ['M6 T0']);
        onOpenChange(false);
    };

    const handleLoad3DProbe = () => {
        controller.command('gcode', ['M6 T100']);
        onOpenChange(false);
    };

    // Generate array of tool numbers based on configuration
    const toolNumbers = Array.from({length: numberOfTools}, (_, i) => i + 1);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col justify-center items-center bg-gray-100 min-h-[300px] p-6 w-[500px] z-50">
                <DialogHeader className="text-robin-700 flex items-start justify-center mb-4">
                    <DialogTitle>Tool Selection</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {toolNumbers.map((toolNumber) => (
                        <Button
                            key={toolNumber}
                            onClick={() => handleToolChange(toolNumber)}
                            className="min-w-[80px] h-12"
                            variant="primary"
                        >
                            Tool {toolNumber}
                        </Button>
                    ))}
                </div>
                
                <div className="flex gap-3">
                    <Button
                        onClick={handleUnloadTool}
                        className="min-w-[120px] h-12"
                        variant="secondary"
                    >
                        Unload Tool
                    </Button>
                    <Button
                        onClick={handleLoad3DProbe}
                        className="min-w-[120px] h-12"
                        variant="secondary"
                    >
                        Load 3D Probe
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};