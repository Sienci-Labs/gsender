import { ToolRackFunctions } from 'app/features/ATC/components/ToolRackFunctions.tsx';
import { ToolDisplay } from 'app/features/ATC/components/ToolDisplay.tsx';

export function ATC() {
    return (
        <div className="flex flex-col  w-full gap-4">
            <ToolDisplay />
            <ToolRackFunctions />
        </div>
    );
}
