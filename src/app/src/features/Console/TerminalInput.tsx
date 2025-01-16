import { useRef } from 'react';
import { LuCopy } from 'react-icons/lu';

import { Button } from 'app/components/shadcn/Button';
import { Input } from 'app/components/shadcn/Input';

import controller from 'app/lib/controller';

const TerminalInput = () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCommandExecute = () => {
        const command = inputRef.current.value;

        if (!command) {
            return;
        }

        controller.writeln(command);

        inputRef.current.value = '';
    };

    return (
        <div className="flex gap-2">
            <Input
                placeholder="Enter G-code here..."
                ref={inputRef}
                type="text"
                className="w-full"
                onKeyDown={(e) => {
                    switch (e.key) {
                        case 'Enter': {
                            handleCommandExecute();
                            break;
                        }
                        // TODO: add these back in
                        // case 'Backspace': {
                        //     const { value } = e.target;
                        //     //If there is only one character left and the user has pressed the backspace,
                        //     //this will mean the value is empty now
                        //     if (!value || [...value].length === 1) {
                        //         this.resetTerminalInputIndex();
                        //     }
                        //     break;
                        // }
                        // case 'ArrowUp': {
                        //     this.updateInputHistoryIndex(
                        //         terminalInputIndex - 1,
                        //     );
                        //     break;
                        // }

                        // case 'ArrowDown': {
                        //     this.updateInputHistoryIndex(
                        //         terminalInputIndex + 1,
                        //     );
                        //     break;
                        // }
                        default: {
                            break;
                        }
                    }
                }}
            />

            {/* TODO: add copy to clipboard functionality back in */}
            <Button className="border">
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
