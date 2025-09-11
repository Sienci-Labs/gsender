import { useState } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import get from 'lodash/get';
import { ToolDialog } from './ToolDialog';

export function ToolDisplay() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const currentTool = useTypedSelector((state) =>
        get(state, 'controller.tool.currentTool')
    );
    const isConnected = useTypedSelector((state) =>
        get(state, 'connection.isConnected', false)
    );

    const displayValue = isConnected && currentTool !== undefined ? `T${currentTool}` : '--';

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isConnected) {
            setIsDialogOpen(true);
        }
    };

    return (
        <>
            <div 
                className="absolute -top-2 -right-1 max-xl:-top-1 max-xl:-right-1 px-2 max-xl:px-1 py-1.5 max-xl:py-1 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tr items-center text-center rounded-bl-lg dark:bg-gray-700 dark:text-gray-400 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors select-none"
                onClick={handleClick}
                title="Click to open Tool Selection dialog"
                style={{ cursor: 'pointer', pointerEvents: 'all', zIndex: 100 }}
            >
                <span>
                    Tool:
                    <br /> <span className="text-blue-500 text-sm font-bold">{displayValue}</span>
                </span>
            </div>
            
            <ToolDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
            />
        </>
    );
}