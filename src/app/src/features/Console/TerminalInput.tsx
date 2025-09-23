import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LuCopy } from 'react-icons/lu';
import { LuPaintbrush } from 'react-icons/lu';
import { FaEllipsisH } from 'react-icons/fa';

import { Button } from 'app/components/Button';
import { Input } from 'app/components/shadcn/Input';
import { addToInputHistory } from 'app/store/redux/slices/console.slice';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';

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
                className="h-8 text-sm"
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
                className="h-8 w-24 text-sm"
                onClick={handleCommandExecute}
            >
                Run
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button 
                        variant="secondary"
                        className="h-8 text-sm"
                    >
                        <FaEllipsisH />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-white px-2 py-2 w-65">
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full flex gap-2 h-8 text-sm"
                            onClick={handleCopyHistory}
                            icon={<LuCopy />}
                            text="Copy last 50 lines"
                        />
                        <Button
                            variant="outline"
                            className="w-full flex gap-2 h-8 text-sm"
                            onClick={onClear}
                            icon={<LuPaintbrush />}
                            text="Clear Console"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default TerminalInput;
