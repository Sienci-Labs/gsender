import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LuCopy } from 'react-icons/lu';
import { LuPaintbrush } from 'react-icons/lu';
import { FaEllipsisH } from 'react-icons/fa';

import { Button } from 'app/components/Button';
import { Input } from 'app/components/Input';
import { addToInputHistory } from 'app/store/redux/slices/console.slice';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'app/components/shadcn/Dropdown';

const COPY_HISTORY_LIMIT = 50;

type Props = {
    onClear: () => void;
};

const TerminalInput = ({ onClear }: Props) => {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const { inputHistory, history } = useTypedSelector(
        (state) => state.console,
    );
    const [historyIndex, setHistoryIndex] = useState(-1);

    const handleCommandExecute = () => {
        const command = inputRef.current?.value;

        if (!command) {
            return;
        }

        controller.writeln(command);

        // Use addToInputHistory instead of setInputHistory
        dispatch(addToInputHistory(command));
        setHistoryIndex(-1);
        inputRef.current.value = '';
    };

    const navigateHistory = (direction: 'up' | 'down') => {
        if (inputHistory.length === 0) return;

        let newIndex = historyIndex;

        if (direction === 'up') {
            // If we're at -1 (no history selected), start from the most recent command
            newIndex =
                historyIndex === -1
                    ? inputHistory.length - 1
                    : Math.max(0, historyIndex - 1);
        } else {
            // If we're at the bottom of history, clear the input
            if (historyIndex >= inputHistory.length - 1) {
                setHistoryIndex(-1);
                inputRef.current.value = '';
                return;
            }
            newIndex = Math.min(inputHistory.length - 1, historyIndex + 1);
        }

        setHistoryIndex(newIndex);
        inputRef.current.value = inputHistory[newIndex];
    };

    const handleCopyHistory = async () => {
        try {
            const lastCommands = history.slice(-COPY_HISTORY_LIMIT);

            await navigator.clipboard.writeText(lastCommands.join('\n'));

            toast.success(
                `Copied last ${lastCommands.length} commands to clipboard`,
                {
                    duration: 3000,
                    position: 'bottom-right',
                },
            );
        } catch (error) {
            toast.error('Failed to copy commands to clipboard', {
                duration: 3000,
                position: 'bottom-right',
            });
            console.error('Failed to copy commands to clipboard:', error);
        }
    };

    return (
        <div className="flex gap-2 w-full flex-grow">
            <Input
                placeholder="Enter G-code here..."
                ref={inputRef}
                type="text"
                onKeyDown={(e) => {
                    switch (e.key) {
                        case 'Enter': {
                            handleCommandExecute();
                            break;
                        }
                        case 'ArrowUp': {
                            e.preventDefault();
                            navigateHistory('up');
                            break;
                        }
                        case 'ArrowDown': {
                            e.preventDefault();
                            navigateHistory('down');
                            break;
                        }
                        case 'Backspace': {
                            if (inputRef.current?.value.length <= 1) {
                                setHistoryIndex(-1);
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }}
            />

            <Button
                variant="primary"
                className="w-24"
                onClick={handleCommandExecute}
            >
                Run
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary">
                        <FaEllipsisH />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                    <DropdownMenuItem>
                        <Button
                            variant="outline"
                            className="w-full flex items-center gap-2"
                            onClick={handleCopyHistory}
                        >
                            <LuCopy />
                            Copy last 50 commands
                        </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Button
                            variant="outline"
                            className="w-full flex items-center gap-2"
                            onClick={onClear}
                        >
                            <LuPaintbrush />
                            Clear Console
                        </Button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default TerminalInput;
