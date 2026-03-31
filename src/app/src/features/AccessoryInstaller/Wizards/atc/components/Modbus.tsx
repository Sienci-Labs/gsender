import {StepActionButton} from "app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx";
import controller from "app/lib/controller.ts";
import {StepProps} from "app/features/AccessoryInstaller/types";
import {useState} from "react";
import {useTypedSelector} from "app/hooks/useTypedSelector.ts";
import {RootState} from "app/store/redux";

export function Modbus({ onComplete, onUncomplete }: StepProps) {
    const [hasConfiguredModbus, setHasConfiguredModbus] =
        useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    async function configureModbusEEPROM() {
        controller.command('gcode', ['$476=2', '$REBOOT']);
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
                Additional spindle settings are applied in this step.
            </p>
            <ol className="list-decimal">
                <li>
                Reconnect to your controller.
                Please ignore any alarms that pop-up.
                </li>
                <li>Press <b>"Apply and Restart"</b></li>
            </ol>
            <StepActionButton
                label="Apply and Restart"
                runningLabel="Applying..."
                onApply={configureModbus}
                isComplete={hasConfiguredModbus}
                error={error}
                disabled={!isConnected}
            />
        </div>
    );
}
