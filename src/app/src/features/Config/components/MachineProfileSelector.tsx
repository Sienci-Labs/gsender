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
import { find } from 'lodash';

export function MachineProfileSelector() {
    const { setMachineProfile, machineProfile } = useSettings();

    function updateMachineProfileSelection(idString) {
        const id = Number(idString);
        const profile = find(defaultMachineProfiles, (o) => o.id === id);
        console.log(profile);
        if (!profile) {
            console.error('Unable to find matching machine profile');
            return;
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
                    <SelectItem value={`${o.id}`}>
                        {humanReadableMachineName(o)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
