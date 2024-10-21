import { FaEllipsisH, FaEdit, FaTrashAlt } from 'react-icons/fa';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import Tooltip from 'app/components/Tooltip';

import { Toaster, TOASTER_INFO } from '../../lib/toaster/ToasterLib';

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
        Toaster.pop({
            msg: `Started running macro '${macro.name}'!`,
            type: TOASTER_INFO,
        });
    };

    const MacroButton = () => (
        <button
            onClick={onMacroRun}
            disabled={disabled}
            className={`flex-grow text-left ${
                disabled && 'opacity-50 cursor-not-allowed'
            }`}
        >
            {macro.name}
        </button>
    );

    return (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-2">
            {macro.description.trim() ? (
                <Tooltip content={macro.description}>
                    <MacroButton />
                </Tooltip>
            ) : (
                <MacroButton />
            )}

            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-gray-200 rounded-full">
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
