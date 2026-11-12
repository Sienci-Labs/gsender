import Button from 'app/components/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';
import Tooltip from 'app/components/Tooltip';
import { i18n, useAppTranslation } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import cn from 'classnames';
import cx from 'classnames';
import { forwardRef, useState } from 'react';
import { FaEdit, FaEllipsisH, FaTrashAlt } from 'react-icons/fa';

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
        const { t } = useAppTranslation();
        const [running, setRunning] = useState<boolean>(false);

        const run = () => {
            setRunning(true);
            onMacroRun();
            setTimeout(() => setRunning(false), 4000);
        };

        return (
            <button
                ref={ref}
                onClick={run}
                disabled={disabled}
                className={cn(
                    'block h-10 rounded-md w-full text-base overflow-hidden text-ellipsis px-2',
                    {
                        'animate-pulse bg-gradient-to-r from-green-500 via-green-500 to-green-100 ':
                            running,
                        'opacity-50 cursor-not-allowed': disabled,
                    },
                )}
            >
                <span className="block w-full text-left whitespace-nowrap overflow-hidden text-ellipsis">
                    {running ? t('workspace:macros.running') : macro.name}
                </span>
            </button>
        );
    },
);

const MacroItem = ({
    macro,
    onRun,
    onEdit,
    onDelete,
    disabled = false,
}: MacroItemProps) => {
    const { t } = useAppTranslation();
    const onMacroRun = () => {
        if (disabled) {
            return;
        }

        onRun(macro);
        toast.info(
            i18n.t('notifications:macros.started', { name: macro.name }),
            {
                position: 'bottom-right',
            },
        );
    };

    const hasDescription = macro.description.trim() !== '';

    const content = (
        <div
            className={cx(
                'flex items-center justify-between rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 p-1 border dark:text-content-primary dark:bg-surface-raised',
                {
                    'bg-gray-300 border-gray-400 cursor-not-allowed': disabled,
                    'bg-white border-gray-200 dark:border-outline': !disabled,
                },
            )}
        >
            <MacroButton
                onMacroRun={onMacroRun}
                disabled={disabled}
                macro={macro}
            />

            <DropdownMenu>
                <DropdownMenuTrigger
                    className="flex items-center justify-center w-10 h-8 cursor-pointer hover:bg-gray-200 rounded dark:hover:bg-dark-lighter"
                    aria-label={t('workspace:macros.optionsFor', {
                        name: macro.name,
                    })}
                >
                    <FaEllipsisH className="text-xl" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white p-2 z-40">
                    <DropdownMenuItem
                        onClick={() => onEdit(macro)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100"
                    >
                        <FaEdit className="mr-3 text-xl" />
                        <span>{t('workspace:macros.edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete(macro.id)}
                        className="cursor-pointer py-3 px-4 text-lg hover:bg-gray-100"
                    >
                        <FaTrashAlt className="mr-3 text-xl" />
                        <span>{t('common:actions.delete')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    if (hasDescription) {
        return <Tooltip content={`${macro.description}`}>{content}</Tooltip>;
    }

    return content;
};

export default MacroItem;
