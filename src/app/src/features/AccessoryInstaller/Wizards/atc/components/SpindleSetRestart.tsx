import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useState } from 'react';
import controller from 'app/lib/controller.ts';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';

export function SpindleSetRestart({ onComplete, onUncomplete }) {
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [hasSetupSpindle, setHasSetupSpindle] = useState<boolean>(false);
    const [hasConfiguredModbus, setHasConfiguredModbus] =
        useState<boolean>(false);

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const connectionPort = useTypedSelector(
        (state: RootState) => state.connection.port,
    );

    const canSetupSpindle = isConnected;
    const canConfigureModbus = isConnected && hasSetupSpindle;

    function setupSpindleProcess() {
        // Get port and connection type
        // Send EEPROM config
        // Reboot
        //reconnect
        // modbus
    }

    async function configureSpindleEEPROM() {
        controller.command('gcode', [
            '$30=24000',
            '$31=7500',
            '$340=5',
            '$394=11',
            '$539=11',
            '$374=3',
            '$375=50',
            '$681=0',
            '$395=2',
            '$REBOOT',
        ]);
    }

    async function configureModbusEEPROM() {
        controller.command('gcode', ['$476=2', '$REBOOT']);
    }

    async function setupSpindleAndReboot() {
        await configureSpindleEEPROM();
        setTimeout(() => {
            setHasSetupSpindle(true);
        }, 1500);
    }

    async function configureModbus() {
        await configureModbusEEPROM();
        setTimeout(() => {
            setHasConfiguredModbus(true);
            onComplete();
        }, 1500);
    }

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>
                Your spindle must now be configured. This will require a reboot
                before setting the modbus address.
            </p>
            <p>You board will disconnect and reconnect during this process</p>
            <StepActionButton
                label="Setup Spindle"
                runningLabel="Configuring..."
                onApply={setupSpindleProcess}
                isComplete={hasConfiguredModbus}
                error={error}
                disabled={!canSetupSpindle}
            />
            <p>
                <b>OR</b>
            </p>
            <StepActionButton
                label="Setup Spindle and Reboot"
                runningLabel="Configuring..."
                onApply={setupSpindleAndReboot}
                isComplete={hasSetupSpindle}
                error={error}
                disabled={!canSetupSpindle}
            />
            <p>
                Once you have reconnected to you device, configure the Modbus
                Address. This will also disconnect your controller.
            </p>
            <StepActionButton
                label="Configure Modbus"
                runningLabel="Configuring..."
                onApply={configureModbus}
                isComplete={hasConfiguredModbus}
                error={error}
                disabled={!canConfigureModbus}
            />
        </div>
    );
}
