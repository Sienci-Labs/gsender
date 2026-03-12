import {StepActionButton} from "app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx";
import {useState} from "react";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";
import controller from "app/lib/controller.ts";
import {firmwarePastVersion} from "app/lib/firmwareSemver.ts";
import {ATCI_SUPPORTED_VERSION} from "app/features/ATC/utils/ATCiConstants.ts";

export const sienciHalGcode = [
    '$30=24000',
    '$31=7500',
    '$340=5',
    '$374=3',
    '$375=50',
    '$392=11',
    '$395=6',
    '$476=2',
    '$$',
];

export const grblCoreGcode = [
    '$30=24000',
    '$31=7500',
    '$340=5',
    '$374=3',
    '$375=50',
    '$394=11',
    '$395=2',
    '$539=11',
    '$681=0',
    '$$',
    '$REBOOT',
];

export function SpindleConfig({ onComplete, onUncomplete }) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [hasSetupSpindle, setHasSetupSpindle] = useState<boolean>(false);


    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const canSetupSpindle = isConnected;

    function setupSienciHalSpindle() {
        controller.command('gcode', sienciHalGcode)
    }

    function setupGrblCoreSpindle() {
        controller.command('gcode', grblCoreGcode)
    }

    async function setupSpindleAndReboot() {
        if (firmwarePastVersion(ATCI_SUPPORTED_VERSION)) {
            setupGrblCoreSpindle();
        } else {
            setupSienciHalSpindle()
        }
    }

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Your spindle must now be configured. This will require a reboot
                before setting the modbus address.
            </p>
            <StepActionButton
                label="Setup Spindle and Reboot"
                runningLabel="Configuring..."
                onApply={setupSpindleAndReboot}
                isComplete={hasSetupSpindle}
                error={error}
                disabled={!canSetupSpindle}
            />
        </div>
    )
}