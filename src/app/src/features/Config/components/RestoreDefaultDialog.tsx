import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog.tsx';
import { ActionButton } from 'app/features/Config/components/ActionButton.tsx';
import { GrRevert } from 'react-icons/gr';
import store from 'app/store';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import machineProfiles from 'app/features/Config/assets/MachineDefaults/defaultMachineProfiles.ts';
import { toast } from 'app/lib/toaster';
import controller from 'app/lib/controller.ts';

function getMachineProfile(id) {
    const profile = machineProfiles.find((profile) => profile.id === id);
    if (!profile) {
        return null;
    }
    return profile;
}

function restoreEEPROMDefaults(type = '') {
    let eepromSettings = [];

    const selectedMachineProfile = store.get('workspace.machineProfile');
    const profile = getMachineProfile(selectedMachineProfile.id);

    if (type === 'grblHAL') {
        eepromSettings = profile?.grblHALeepromSettings;
    } else {
        eepromSettings = profile?.eepromSettings;
    }

    const hasOrderedSettings = !!profile.orderedSettings;

    const values = [];

    for (let [key, value] of Object.entries(eepromSettings)) {
        if (hasOrderedSettings && orderedSettings.has(key)) {
            continue;
        }

        values.push(`${key}=${value}`);
    }

    if (hasOrderedSettings) {
        for (const [k, v] of profile.orderedSettings) {
            values.push(`${k}=${v}`);
        }
    }
    values.push('$$');

    controller.command('gcode', values);

    toast.success('Restored default settings for your machine.');
}

export function RestoreDefaultDialog({ fileLoaded, handleFileReload }) {
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const controllerType = useSelector(
        (state: RootState) => state.controller.type,
    );

    const machineProfile = store.get('workspace.machineProfile', {});
    const machineName = `${machineProfile.name} ${machineProfile.type}`;
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <ActionButton
                    icon={<GrRevert />}
                    label="Defaults"
                    disabled={!isConnected}
                />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Restore Defaults</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to restore your{' '}
                        <b>{machineName}</b> back to its default state?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className={'flex flex-col'}>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => restoreEEPROMDefaults(controllerType)}
                    >
                        Restore Defaults
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
