import {useState} from "react";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";
import controller from "app/lib/controller.ts";
import {StepActionButton} from "app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx";
import {StepProps} from "app/features/AccessoryInstaller/types";
import {firmwarePastVersion} from "app/lib/firmwareSemver.ts";
import {ATCI_SUPPORTED_VERSION} from "app/features/ATC/utils/ATCiConstants.ts";

export function ModbusConfig({ onComplete, onUncomplete }: StepProps) {
    const [hasConfiguredModbus, setHasConfiguredModbus] =
        useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    async function configureModbusEEPROM() {
        const code = [
            '$476=2'
        ]

        if (firmwarePastVersion(ATCI_SUPPORTED_VERSION)) {
            code.push('$REBOOT')
        }

        controller.command('gcode', code);
    }

    async function configureModbus() {
        await configureModbusEEPROM();
        setTimeout(() => {
            setHasConfiguredModbus(true);
            onComplete();
        }, 1500);
    }

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="text-gray-900 dark:text-white">
                <b>
                    You are able to complete this step while the controller is
                    still alarmed
                </b>
            </p>
            <p className="dark:text-white">
                Now that your Spindle has been configured and controller
                rebooted, you must configure the Modbus Address.
            </p>
            <p>If you are one a modern grblHAL version this will automatically restart your controller</p>
            <p>If you are an older version of grblHAL, you'll need to restart the controller using the switch manually.</p>
            <StepActionButton
                label="Configure Modbus"
                runningLabel="Configuring..."
                onApply={configureModbus}
                isComplete={hasConfiguredModbus}
                error={error}
                disabled={!isConnected}
            />
        </div>
    )
}