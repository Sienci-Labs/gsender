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

function getMachineProfile(id) {
    const profile = machineProfiles.find((profile) => profile.id === id);
    if (!profile) {
        return null;
    }
    return profile;
}

function restoreEEPROMDefaults(type) {
    let eepromSettings = [];

    const machineProfile = store.get('workspace.machineProfile');
    const profile = getMachineProfile(machineProfile.id);
    console.log(profile);
    if (type === 'grblHAL') {
        eepromSettings =
            machineProfile?.grblHALeepromSettings ?? defaultGRBLHALSettings;
    } else {
        eepromSettings = machineProfile?.eepromSettings ?? defaultGRBLSettings;
    }

    const value = [];
}

export function ReloadFileAlert({ fileLoaded, handleFileReload }) {
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const machineProfile = store.get('workspace.machineProfile', {});
    console.log(machineProfile);
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
                    <AlertDialogAction onClick={handleFileReload}>
                        Restore Defaults
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
