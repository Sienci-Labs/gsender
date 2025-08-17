import { TiPin, TiPinOutline } from 'react-icons/ti';
import ModalRow from 'app/features/MachineInfo/ModalRow.tsx';
import PinRow from 'app/features/MachineInfo/PinRow.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import store from 'app/store';
import { Switch } from 'app/components/shadcn/Switch';
import controller from 'app/lib/controller.ts';
import get from 'lodash/get';

interface MachineInfoDisplayProps {
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
}

export function MachineInfoDisplay({
    pinned,
    setPinned,
}: MachineInfoDisplayProps) {
    const { pins, modals, isConnected, settings } = useTypedSelector(
        (state) => ({
            pins: state.controller.state.status?.pinState,
            modals: state.controller.modal,
            isConnected: state.connection.isConnected,
            settings: state.controller.settings,
        }),
    );
    const probeSelection = store.get('widgets.probe.probeCommand');
    const stepperState = get(settings, 'settings.$1', '0');

    const handleStepperMotorToggle = (value: boolean) => {
        if (!controller.settings?.settings) {
            return;
        }

        if (value) {
            store.replace(
                'workspace.diagnostics.stepperMotor.storedValue',
                controller.settings.settings.$1,
            );
            controller.command('gcode', ['$1=255', '$$']);
            return;
        }

        const storedValue = store.get(
            'workspace.diagnostics.stepperMotor.storedValue',
            50,
        );

        if (storedValue === null) {
            controller.command('gcode', [`$1=50`, '$$']);
        } else {
            controller.command('gcode', [`$1=${storedValue}`, '$$']);
        }

        store.replace('workspace.diagnostics.stepperMotor.storedValue', null);
    };

    return (
        <>
            <div className="flex flex-row w-full justify-between">
                <span className="float-left font-bold text-2xl pb-2">
                    Machine Information
                </span>
                <div className="text-2xl float-right pt-1 text-gray-600 max-sm:hidden dark:text-white cursor-pointer">
                    {pinned ? (
                        <TiPin onClick={() => setPinned(!pinned)} />
                    ) : (
                        <TiPinOutline onClick={() => setPinned(!pinned)} />
                    )}
                </div>
            </div>
            <div className="grid grid-cols-[3fr_2fr]">
                <div className="flex flex-col pr-4">
                    <span className="underline float-left">
                        CNC Modals
                    </span>
                    <div className="flex flex-col justify-between items-center">
                        <ModalRow
                            label="Probe style"
                            value={isConnected ? probeSelection : '-'}
                        />
                        <ModalRow
                            label="Coordinate system"
                            value={isConnected ? modals.wcs : '-'}
                        />
                        <ModalRow
                            label="Plane selection"
                            value={isConnected ? modals.plane : '-'}
                        />
                        <ModalRow
                            label="Units"
                            value={isConnected ? modals.units : '-'}
                        />
                        <ModalRow
                            label="Distance mode"
                            value={isConnected ? modals.distance : '-'}
                        />
                        <ModalRow
                            label="Feed"
                            value={isConnected ? modals.feedrate : '-'}
                        />
                        <ModalRow
                            label="Spindle"
                            value={isConnected ? modals.spindle : '-'}
                        />
                        <ModalRow
                            label="Coolant"
                            value={isConnected ? modals.coolant : '-'}
                        />
                    </div>
                </div>
                <div className="flex flex-col border-l-2 border-l-gray-200 pl-4">
                    <span className="underline float-left">Pins</span>
                    <div className="flex flex-col justify-between items-center">
                        <PinRow label="X limit" on={pins?.X} />
                        <PinRow label="Y limit" on={pins?.Y} />
                        <PinRow label="Z limit" on={pins?.Z} />
                        <PinRow label="A limit" on={pins?.A} />
                        <PinRow label="Probe/TLS" on={pins?.P} />
                        <PinRow label="Door" on={pins?.D} />
                        <PinRow label="Cycle start" on={pins?.S} />
                        <PinRow label="Hold" on={pins?.H} />
                        <PinRow label="Soft reset" on={pins?.R} />
                    </div>
                </div>
            </div>
            <div className="flex flex-row gap-4 items-center mt-4">
                <span className="text-gray-500 dark:text-white">
                    Lock stepper motors
                </span>
                <Switch
                    onChange={handleStepperMotorToggle}
                    checked={stepperState === '255'}
                    disabled={!isConnected}
                />
            </div>
        </>
    );
}
