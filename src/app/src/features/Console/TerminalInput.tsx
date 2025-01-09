import { useRef, useState } from 'react';
import { LuCopy } from 'react-icons/lu';
import { useDispatch } from 'react-redux';

import { Button } from 'app/components/shadcn/Button';
import { Input } from 'app/components/shadcn/Input';
import { addToInputHistory } from 'app/store/redux/slices/console.slice';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';

const COPY_HISTORY_LIMIT = 50;

const TerminalInput = () => {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const inputHistory = useTypedSelector(
        (state) => state.console.inputHistory,
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
            const lastCommands = inputHistory.slice(-COPY_HISTORY_LIMIT);
            await navigator.clipboard.writeText(lastCommands.join('\n'));

            toast.success('Copied last 50 commands to clipboard', {
                duration: 3000,
                position: 'bottom-left',
            });
        } catch (error) {
            console.error('Failed to copy commands to clipboard:', error);
        }
    };

    return (
        <div className="flex gap-2">
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
                className="border"
                onClick={handleCopyHistory}
                title="Copy last 50 commands"
            >
                <LuCopy />
            </Button>

            <Button
                variant="default"
                className="bg-blue-500 text-white w-32"
                onClick={handleCommandExecute}
            >
                Run
            </Button>
        </div>
    );
};

export default TerminalInput;
