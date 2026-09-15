import { usePostHog } from '@posthog/react';
import { Button } from 'app/components/Button';
import { Input } from 'app/components/shadcn/Input';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { addToInputHistory } from 'app/store/redux/slices/console.slice';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { consoleWrite } from '../consoleStore';

export function ConsoleInput() {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const { inputHistory } = useTypedSelector((state) => state.console);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const posthog = usePostHog();

    const handleCommandExecute = () => {
        const command = inputRef.current?.value;

        if (!command) {
            return;
        }

        controller.writeln(command);
        // The server does not echo commands written straight from a client,
        // so the operator would otherwise only see the reply.
        consoleWrite({ message: command, type: 'gcode' });

        dispatch(addToInputHistory(command));
        setHistoryIndex(-1);
        inputRef.current.value = '';

        posthog?.capture('console_command_executed', { command });
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

    return (
        <div className="flex gap-2 w-full shrink-0">
            <Input
                className="h-10 text-sm font-mono"
                placeholder="Enter G-code here..."
                ref={inputRef}
                type="text"
                aria-label="Console command"
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
                className="h-10 w-24 text-sm"
                onClick={handleCommandExecute}
            >
                Run
            </Button>
        </div>
    );
}

export default ConsoleInput;
