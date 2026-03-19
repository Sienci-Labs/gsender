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
import { resolveGrblCoreDefaults } from 'app/features/Config/utils/grblCoreMigration.ts';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';
import { cn } from 'app/lib/utils.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'app/components/shadcn/Tooltip.tsx';

function getMachineProfile(id: number) {
    const profile = machineProfiles.find((profile) => profile.id === id);
    if (!profile) {
        return null;
    }
    return profile;
}

function restoreEEPROMDefaults(
    type = '',
    firmwareSemver: number | undefined,
) {
    let eepromSettings = {};
    let orderedSettings: Map<string, string> | undefined;

    const selectedMachineProfile = store.get('workspace.machineProfile');
    const profile = getMachineProfile(selectedMachineProfile.id);

    if (type === 'grblHAL') {
        const resolved = resolveGrblCoreDefaults({
            firmwareSemver,
            baseDefaults: profile?.grblHALeepromSettings || {},
            orderedSettings: profile?.orderedSettings,
        });
        eepromSettings = resolved.defaults;
        orderedSettings = resolved.ordered;
    } else {
        eepromSettings = profile?.eepromSettings || {};
        orderedSettings = profile?.orderedSettings;
    }

    const hasOrderedSettings = !!orderedSettings;

    const values = [];

    for (let [key, value] of Object.entries(eepromSettings)) {
        if (hasOrderedSettings && orderedSettings.has(key)) {
            continue;
        }

        values.push(`${key}=${value}`);
    }

    if (hasOrderedSettings) {
        for (const [k, v] of orderedSettings) {
            values.push(`${k}=${v}`);
        }
    }
    values.push('$$');
    console.log(JSON.stringify(values));
    const localSettings = { ...controller.settings };
    console.log(JSON.stringify(localSettings));
    controller.command('gcode', values);


    toast.success('Restored default settings for your machine.', {
        position: 'bottom-right',
    });
}

export function RestoreDefaultDialog({ isSienciMachine = false }: { isSienciMachine?: boolean }) {
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const controllerType = useSelector(
        (state: RootState) => state.controller.type,
    );
    const firmwareSemver = useSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    const { profileChangedSinceDefaults, setProfileChangedSinceDefaults } = useSettings();

    const machineProfile = store.get('workspace.machineProfile', {});
    const machineName = `${machineProfile.name} ${machineProfile.type}`;
    return (
        <TooltipProvider>
            <Tooltip open={profileChangedSinceDefaults || undefined}>
                <TooltipTrigger asChild>
                    <div className={cn('ring rounded relative', {
                        'ring-blue-400': profileChangedSinceDefaults,
                        'ring-transparent': !profileChangedSinceDefaults,
                    })}>
                        {profileChangedSinceDefaults && (
                            <span className="w-4 h-4 animate-ping absolute -top-2 -left-2 bg-blue-400 rounded-xl z-10" />
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <ActionButton
                                    icon={<GrRevert />}
                                    label="Defaults"
                                    disabled={!isConnected || !isSienciMachine}
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
                                        onClick={() => {
                                            restoreEEPROMDefaults(controllerType, firmwareSemver);
                                            setProfileChangedSinceDefaults(false);
                                        }}
                                    >
                                        Restore Defaults
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                    Make sure you click to apply your defaults to your controller
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
