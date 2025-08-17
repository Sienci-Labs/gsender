import { useState, forwardRef } from 'react';
import cn from 'classnames';
import { FaEllipsisH, FaEdit, FaTrashAlt } from 'react-icons/fa';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import Tooltip from 'app/components/Tooltip';
import { toast } from 'app/lib/toaster';
import Button from 'app/components/Button';
import cx from 'classnames';

type Macro = {
    id: string;
    name: string;
    description: string;
};

type MacroItemProps = {
    macro: Macro;
    onRun: (macro: Macro) => void;
    onEdit: (macro: Macro) => void;
    onDelete: (id: string) => void;
    disabled?: boolean;
};

type MacroButtonProps = {
    onMacroRun: () => void;
    disabled: boolean;
    macro: Macro;
};

const MacroButton = forwardRef<HTMLButtonElement, MacroButtonProps>(
    ({ onMacroRun, disabled, macro }, ref) => {
        const [running, setRunning] = useState<boolean>(false);

        const run = () => {
            setRunning(true);
            onMacroRun();
            setTimeout(() => setRunning(false), 4000);
        };

        return (
            <Button
                ref={ref}
                onClick={run}
                disabled={disabled}
                className={cn('block h-10 rounded-md w-full text-base', {
                    'animate-pulse bg-gradient-to-r from-green-500 via-green-500 to-green-100 ':
                        running,
                    'opacity-50 cursor-not-allowed': disabled,
                })}
                active={running}
                variant="ghost"
                size="custom"
            >
                <span className="w-[12ch] text-left truncate whitespace-nowrap text-overflow-ellipsis max-w-[12ch]">
                    {running ? 'Running...' : macro.name}
                </span>
            </Button>
        );
    },
);

MacroButton.displayName = 'MacroButton';

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
        toast.info(`Started running macro '${macro.name}'!`, {
            position: 'bottom-right',
        });
    };
    return (
        <div
            className={cx(
                'flex items-center justify-between rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-2 border dark:text-white dark:bg-dark',
                {
                    'bg-gray-300 border-gray-400 cursor-not-allowed': disabled,
                    'bg-white border-gray-200 dark:border-dark-lighter':
                        !disabled,
                },
            )}
        >
            <Tooltip
                content={
                    macro.description.trim() !== ''
                        ? macro.name + ': ' + macro.description
                        : macro.name
                }
            >
                <MacroButton
                    onMacroRun={onMacroRun}
                    disabled={disabled}
                    macro={macro}
                />
            </Tooltip>

            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-gray-200 rounded dark:hover:bg-dark-lighter">
                    <FaEllipsisH className="text-xl" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white p-2 z-40">
                    <DropdownMenuItem
                        onClick={() => onEdit(macro)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100"
                    >
                        <FaEdit className="mr-3 text-xl" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete(macro.id)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100"
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
