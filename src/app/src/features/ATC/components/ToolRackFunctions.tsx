import Button from 'app/components/Button';
import { unimplemented } from 'app/features/ATC/utils/ATCFunctions.ts';

export function ToolRackFunctions() {
    return (
        <div className="flex flex-row w-full gap-4">
            <Button onClick={unimplemented}>Initialize Rack</Button>
            <Button onClick={unimplemented}>Initialize Tool</Button>
        </div>
    );
}
