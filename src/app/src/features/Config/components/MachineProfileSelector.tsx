import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { humanReadableMachineName } from 'app/features/Config/utils/Settings.ts';
import defaultMachineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';

export function MachineProfileSelector() {
    return (
        <Select>
            <SelectTrigger className="bg-white bg-opacity-100">
                <SelectValue
                    placeholder={humanReadableMachineName(
                        defaultMachineProfiles[0],
                    )}
                />
            </SelectTrigger>
            <SelectContent className="bg-white bg-opacity-100">
                {defaultMachineProfiles.map((o) => (
                    <SelectItem value={`${o.id}`}>
                        {humanReadableMachineName(o)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
