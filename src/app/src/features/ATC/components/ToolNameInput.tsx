import { Input } from 'app/components/shadcn/Input.tsx';
import { useEffect, useState } from 'react';
import {
    lookupToolName,
    setToolName,
} from 'app/features/ATC/utils/ATCFunctions.ts';

export function ToolNameInput({
    id = 0,
    nickname = '-',
}: {
    id: number;
    nickname: string;
}) {
    const [name, setName] = useState('-');

    useEffect(() => {
        setName(lookupToolName(id));
    }, []);

    function handleNameRemap(e) {
        const value = e.target.value;
        setToolName(id, value);
        setName(value);
    }

    return (
        <div className="text-xs text-muted">
            <Input
                className="bg-gray-50 px-1 py-0 text-xs border-gray-200 text-gray-400 font-italic"
                type="text"
                value={name}
                onChange={handleNameRemap}
                disabled={id < 1}
            />
        </div>
    );
}
