import store from 'app/store';
import { Input } from 'app/components/shadcn/Input.tsx';
import { useEffect, useState } from 'react';

function lookupToolName(id: number): string {
    return store.get(`widgets.atc.toolMap.${id}`, '-');
}

function setToolName(id, value) {
    store.set(`widgets.atc.toolMap.${id}`, value);
}

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
