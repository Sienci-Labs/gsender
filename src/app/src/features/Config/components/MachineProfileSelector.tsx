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
import { useEffect, useRef } from 'react';

export function MachineProfileSelector() {
    const {
        setMachineProfile,
        machineProfile,
        setProfileChangedSinceDefaults,
        profileChangedSinceDefaults,
    } = useSettings();
    const baselineProfileId = useRef<number | null>(null);

    if (
        baselineProfileId.current === null &&
        machineProfile?.id !== undefined
    ) {
        baselineProfileId.current = machineProfile.id;
    }

    function machineProfileLookup(idString: string) {
        const id = Number(idString);
        return find(defaultMachineProfiles, (o) => o.id === id);
    }

    function updateMachineProfileSelection(idString: string) {
        const id = Number(idString);
        const profile = machineProfileLookup(idString);
        if (!profile) {
            console.error('Unable to find matching machine profile');
            return {};
        }
        store.replace('workspace.machineProfile', profile);
        setMachineProfile(profile);
        const isSienci = profile.company === 'Sienci Labs';
        setProfileChangedSinceDefaults(
            isSienci && id !== baselineProfileId.current,
        );
    }

    useEffect(() => {
        // if profileChangedSinceDefaults is false, that means we're on the baseline profile we have saved, or the current profile has been defaulted
        // if it's the second case, we need to update our saved baseline profile to the current one,
        // and if it's the first, nothing changes by running this code
        if (!profileChangedSinceDefaults) {
            baselineProfileId.current = machineProfile.id;
        }
    }, [profileChangedSinceDefaults]);

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
