import {StepActionButton} from "app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx";
import {useState} from "react";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";
import controller from "app/lib/controller.ts";
import {firmwarePastVersion} from "app/lib/firmwareSemver.ts";
import {ATCI_SUPPORTED_VERSION} from "app/features/ATC/utils/ATCiConstants.ts";
import store from "app/store";

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

        store.set('workspace.spindleFunctions', true);
        setTimeout(() => {
            setHasSetupSpindle(true)
            onComplete();
        }, 500)
    }

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Your spindle settings are applied in this step and the controller will restart automatically.
            </p>
            <ol className="list-decimal p-5 gap-4 space-y-2">
                <li>
                    Press <b>"Apply And Restart"</b>
                </li>
                {
                    !firmwarePastVersion(ATCI_SUPPORTED_VERSION) && (
                        <li>Reboot your controller using the power switch and reconnect</li>
                    )
                }
                <li>Click <b>"Next"</b></li>
            </ol>
            <StepActionButton
                label="Setup Spindle"
                runningLabel="Configuring..."
                onApply={setupSpindleAndReboot}
                isComplete={hasSetupSpindle}
                error={error}
                disabled={!canSetupSpindle}
            />
        </div>
    )
}