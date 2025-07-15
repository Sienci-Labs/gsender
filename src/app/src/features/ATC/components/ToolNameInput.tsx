import { Input } from 'app/components/shadcn/Input.tsx';
import { useEffect, useState } from 'react';
import {
    lookupToolName,
    setToolName,
} from 'app/features/ATC/utils/ATCFunctions.ts';

export function ToolNameInput({ id = 0 }: { id: number }) {
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
        <div>
            <Input type="text" value={name} onChange={handleNameRemap} />
        </div>
    );
}
