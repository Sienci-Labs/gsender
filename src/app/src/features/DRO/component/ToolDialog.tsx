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
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import get from 'lodash/get';
import { RiToolsFill, RiEjectLine } from 'react-icons/ri';
import { MdPrecisionManufacturing } from 'react-icons/md';

// Simple CNC Bit SVG Component
const CNCBitIcon = ({ className = "w-6 h-6" }) => (
    <svg 
        viewBox="0 0 24 24" 
        className={className}
        fill="currentColor"
    >
        <path d="M12 2L10 4H8v2h8V4h-2L12 2zM8 8v2h8V8H8zM9 12v10h6V12H9zM10 14h4v2h-4v-2zM10 17h4v2h-4v-2z" />
    </svg>
);

interface ToolDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ToolDialog: React.FC<ToolDialogProps> = ({ isOpen, onOpenChange }) => {
    const numberOfTools = store.get('workspace.toolChange.numberOfTools', 8);
    const currentTool = useTypedSelector((state) =>
        get(state, 'controller.tool.currentTool')
    );

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
            <DialogContent className="flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 min-h-[350px] p-6 w-[520px] z-50 shadow-xl">
                <DialogHeader className="text-blue-700 dark:text-blue-400 flex items-center justify-center mb-6 w-full">
                    <DialogTitle className="text-center w-full text-xl font-semibold flex items-center justify-center gap-2">
                        <RiToolsFill className="w-6 h-6" />
                        Tool Selection
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {toolNumbers.map((toolNumber) => {
                        const isCurrentTool = currentTool === toolNumber;
                        return (
                            <Button
                                key={toolNumber}
                                onClick={() => !isCurrentTool && handleToolChange(toolNumber)}
                                disabled={isCurrentTool}
                                className={`min-w-[90px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg shadow-md transition-all duration-200 ${
                                    isCurrentTool
                                        ? 'bg-green-600 text-white border-2 border-green-400 shadow-green-200 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg transform hover:scale-105 cursor-pointer'
                                }`}
                                variant="primary"
                            >
                                <CNCBitIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    Tool {toolNumber}
                                    {isCurrentTool && (
                                        <span className="block text-xs opacity-90">Current</span>
                                    )}
                                </span>
                            </Button>
                        );
                    })}
                </div>
                
                <div className="flex gap-4 justify-center">
                    <Button
                        onClick={handleUnloadTool}
                        disabled={currentTool === 0 || currentTool === null || currentTool === undefined}
                        className={`min-w-[140px] h-14 flex items-center justify-center gap-2 rounded-lg shadow-md transition-all duration-200 ${
                            currentTool === 0 || currentTool === null || currentTool === undefined
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                                : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg'
                        }`}
                        variant="secondary"
                    >
                        <RiEjectLine className="w-5 h-5" />
                        <span className="font-medium">Unload Tool</span>
                    </Button>
                    <Button
                        onClick={handleLoad3DProbe}
                        className="min-w-[140px] h-14 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        variant="secondary"
                    >
                        <MdPrecisionManufacturing className="w-5 h-5" />
                        <span className="font-medium">Manual Tool Load</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};