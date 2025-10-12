import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { humanReadableMachineName } from 'app/features/Config/utils/Settings.ts';
import defaultMachineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import store from 'app/store';
import find from 'lodash/find';

export function MachineProfileSelector() {
    const { setMachineProfile, machineProfile } = useSettings();

    function machineProfileLookup(idString) {
        const id = Number(idString);
        return find(defaultMachineProfiles, (o) => o.id === id);
    }

    function updateMachineProfileSelection(idString) {
        const id = Number(idString);
        const profile = machineProfileLookup(idString);
        if (!profile) {
            console.error('Unable to find matching machine profile');
            return {};
        }
        store.replace('workspace.machineProfile', profile);
        setMachineProfile(profile);
    }

    return (
        <Select
            onValueChange={updateMachineProfileSelection}
            value={`${machineProfile.id}`}
        >
            <SelectTrigger className="bg-white bg-opacity-100">
                <SelectValue
                    placeholder={humanReadableMachineName(machineProfile)}
                />
            </SelectTrigger>
            <SelectContent className="bg-white bg-opacity-100">
                {defaultMachineProfiles.map((o) => (
                    <SelectItem key={`${o.id}`} value={`${o.id}`}>
                        {humanReadableMachineName(o)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
