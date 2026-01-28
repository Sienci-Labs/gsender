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

    return <div className="flex flex-col gap-5 justify-start">
        <p><b>You are able to complete this step while the controller is still alarmed</b></p>
        <p className="dark:text-white">
            Now that your Spindle has been configured and controller rebooted, you must configure the Modbus
            Address. This will also disconnect your controller.
        </p>
        <StepActionButton
            label="Configure Modbus"
            runningLabel="Configuring..."
            onApply={configureModbus}
            isComplete={hasConfiguredModbus}
            error={error}
            disabled={!isConnected}
        />
    </div>
}
