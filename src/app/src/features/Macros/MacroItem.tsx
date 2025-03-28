import { FaEllipsisH, FaEdit, FaTrashAlt } from 'react-icons/fa';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import Tooltip from 'app/components/Tooltip';
import cn from 'classnames';

import { toast } from 'app/lib/toaster';
import { useState } from 'react';

interface Macro {
    id: string;
    name: string;
    description: string;
}

interface MacroItemProps {
    macro: Macro;
    onRun: (macro: Macro) => void;
    onEdit: (macro: Macro) => void;
    onDelete: (id: string) => void;
    disabled?: boolean;
}

const MacroButton = ({ onMacroRun, disabled, macro }) => {
    const [running, setRunning] = useState<boolean>(false);

    const run = () => {
        setRunning(true);
        onMacroRun();
        setTimeout(() => setRunning(false), 4000);
    };

    return (
        <button
            onClick={run}
            disabled={disabled}
            className={cn(
                `flex-grow text-left p-2 rounded-md ${
                    disabled && 'opacity-50 cursor-not-allowed'
                }`,
                {
                    'animate-pulse bg-gradient-to-r from-green-500 via-green-500 to-green-100':
                        running,
                },
            )}
        >
            {running ? 'Running...' : macro.name}
        </button>
    );
};

/**
 * Macro Item Component
 */
const MacroItem = ({
    macro,
    onRun,
    onEdit,
    onDelete,
    disabled = false,
}: MacroItemProps) => {
    const onMacroRun = () => {
        if (disabled) {
            return;
        }

        onRun(macro);
        toast.info(`Started running macro '${macro.name}'!`);
    };

    return (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-2 dark:bg-dark dark:border-dark-lighter dark:text-white">
            {
                <Tooltip content={macro.description.trim()}>
                    <MacroButton
                        onMacroRun={onMacroRun}
                        disabled={disabled}
                        macro={macro}
                    />
                </Tooltip>
            }

            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-gray-200 rounded-full dark:hover:bg-dark-lighter">
                    <FaEllipsisH className="text-xl" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white p-2 z-50">
                    <DropdownMenuItem
                        onClick={() => onEdit(macro)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100 rounded"
                    >
                        <FaEdit className="mr-3 text-xl" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete(macro.id)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100 rounded"
                    >
                        <FaTrashAlt className="mr-3 text-xl" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default MacroItem;
