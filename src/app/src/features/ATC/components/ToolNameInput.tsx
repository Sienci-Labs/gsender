import { useEffect, useMemo, useState } from 'react';
import {
    lookupToolName,
    setToolName,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { Input } from 'app/components/shadcn/Input.tsx';
import pubsub from 'pubsub-js';

const TOOL_OPTIONS = {
    options: [
        'Surfacing Bit - 1-1/2"',
        'Surfacing Bit - 22mm',
        'End Mill (Up Cut) - 3/8"',
        'End Mill (Up Cut) - 1/4"',
        'End Mill (Up Cut) - 1/8"',
        'End Mill (Up Cut) - 1/16"',
        'End Mill (Down Cut) - 3/8"',
        'End Mill (Down Cut) - 1/4"',
        'End Mill (Down Cut) - 1/8"',
        'End Mill (Down Cut) - 1/16"',
        'End Mill (Compression) - 3/8"',
        'End Mill (Compression) - 1/4"',
        'End Mill (Compression) - 1/8"',
        'End Mill (Roughing) - 3/8"',
        'End Mill (Roughing) - 1/4"',
        'End Mill (Roughing) - 1/8"',
        'End Mill (Single Flute) - 1/4"',
        'End Mill (Single Flute) - 1/8"',
        'End Mill (Tapered Ball Nose) - 3/8"',
        'End Mill (Tapered Ball Nose) - 1/4"',
        'End Mill (Tapered Ball Nose) - 1/8"',
        'End Mill (Ball Nose) - 3/8"',
        'End Mill (Ball Nose) - 1/4"',
        'End Mill (Ball Nose) - 1/8"',
        'End Mill (Corncob) - 1/16" / 1.6mm',
        'V-Bit - 120 Degree',
        'V-Bit - 90 Degree',
        'V-Bit - 60 Degree',
        'V-Bit - 30 Degree',
        'V-Bit (Down Cut) - 90 Degree',
        'V-Bit (Down Cut) - 60 Degree',
        'V-Bit (Down Cut) - 30 Degree',
        'Round Groove Bit - 1" x 1-1/4"',
        'Round Groove Bit - 3/4" x 1-1/4"',
        'Round Groove Bit - 1/2" x 1-1/4"',
        'Bowl Bit - 1" x 3/4" x R3/8"',
        'Bowl Bit - 5/8" x 5/8" x R1/4"',
        'Bowl Bit - 3/8" x 1/2" x R1/8"',
        'Roundover Bit - R3/8"',
        'Roundover Bit - R1/4"',
        'Roundover Bit - R1/8"',
        'Drill Bit - 1/4"',
        'Drill Bit - 1/8"',
    ],
};

export function ToolNameInput({
    id = 0,
    nickname = '-',
}: {
    id: number;
    nickname: string;
}) {
    const [name, setName] = useState('-');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const storedName = lookupToolName(id);
        const initialName = storedName === '-' ? nickname : storedName;
        setName(initialName === '-' ? '' : initialName);
    }, []);

    useEffect(() => {
        const token = pubsub.subscribe('toolnameinput:open', (_msg, openId) => {
            if (openId !== id) {
                setOpen(false);
            }
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [id]);

    function handleNameRemap(e) {
        const value = e.target.value;
        setToolName(id, value);
        setName(value);
    }

    const filteredOptions = useMemo(() => {
        const normalizedName = name === '-' ? '' : name;
        const query = normalizedName.trim().toLowerCase();
        if (!query) return TOOL_OPTIONS.options;
        return TOOL_OPTIONS.options.filter((option) =>
            option.toLowerCase().includes(query),
        );
    }, [name]);

    return (
        <div className="text-xs text-muted w-full relative">
            <Input
                className="w-full h-7 bg-white bg-opacity-100 dark:border-gray-500 ring-1 ring-gray-300 rounded-md px-2 py-1 text-xs text-gray-700"
                type="text"
                value={name}
                onChange={handleNameRemap}
                onFocus={() => {
                    setOpen(true);
                    pubsub.publish('toolnameinput:open', id);
                }}
                onClick={() => {
                    setOpen(true);
                    pubsub.publish('toolnameinput:open', id);
                }}
                onBlur={() => setOpen(false)}
                disabled={id < 1}
                wrapperClassName="relative"
            />
            {open && id >= 1 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-600 dark:bg-dark">
                    {filteredOptions.map((option) => (
                        <div
                            key={option}
                            className="cursor-pointer px-2 py-2 portrait:py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setToolName(id, option);
                                setName(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
