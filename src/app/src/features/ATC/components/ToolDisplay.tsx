import Button from 'app/components/Button';
import { unimplemented } from 'app/features/ATC/utils/ATCFunctions.ts';

export function ToolDisplay() {
    return (
        <div className="w-full flex flex-col gap-4">
            Current Tool
            <div className="flex flex-row gap-4 w-full">
                <Button variant="primary" onClick={unimplemented}>
                    Load
                </Button>
                <Button variant="primary" onClick={unimplemented}>
                    Unload
                </Button>
                <Button onClick={unimplemented}>Replace</Button>
            </div>
        </div>
    );
}
