import {
    Card,
    CardContent,
    CardDescription,
} from 'app/components/shadcn/Card.tsx';
import cx from 'classnames';
import { TiPin, TiPinOutline } from 'react-icons/ti';
import ModalRow from 'app/features/MachineInfo/ModalRow.tsx';
import PinRow from 'app/features/MachineInfo/PinRow.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import store from 'app/store';
import Toggle from 'app/components/Switch/Toggle.tsx';
import controller from 'app/lib/controller.ts';
import get from 'lodash/get';

interface MachineInfoDisplayProps {
    open: boolean;
    pinned: boolean;
    onClose: () => void;
    setPinned: (pinned: boolean) => void;
}

export function MachineInfoDisplay({
    open,
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

    const handleStepperMotorToggle = (value) => {
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

        controller.command('gcode', [`$1=${storedValue}`, '$$']);
        store.replace('workspace.diagnostics.stepperMotor.storedValue', null);
    };

    return (
        <Card
            className={cx({
                hidden: !open,
            })}
        >
            <CardContent className="max-sm:block -mt-4 -ml-4 p-4 pt-2 absolute z-10 flex flex-col justify-center bg-gray-50 w-[400px] min-h-[300px] rounded-md [box-shadow:_0px_0px_2px_1px_var(--tw-shadow-color)] shadow-gray-400 dark:bg-dark dark:text-white dark:border-dark-lighter">
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
                    <CardDescription className="flex flex-col pr-4">
                        <span className="underline float-left">
                            Firmware Modals
                        </span>
                        <div className="flex flex-col justify-between items-center">
                            <ModalRow
                                label="Probe Selection"
                                value={isConnected ? probeSelection : '-'}
                            />
                            <ModalRow
                                label="Coordinate System"
                                value={isConnected ? modals.wcs : '-'}
                            />
                            <ModalRow
                                label="Plane Selection"
                                value={isConnected ? modals.plane : '-'}
                            />
                            <ModalRow
                                label="Units"
                                value={isConnected ? modals.units : '-'}
                            />
                            <ModalRow
                                label="Distance Mode"
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
                    </CardDescription>
                    <CardDescription className="flex flex-col border-l-2 border-l-gray-200 pl-4">
                        <span className="underline float-left">Pins</span>
                        <div className="flex flex-col justify-between items-center">
                            <PinRow label="X Limit" on={pins?.X} />
                            <PinRow label="Y Limit" on={pins?.Y} />
                            <PinRow label="Z Limit" on={pins?.Z} />
                            <PinRow label="A Limit" on={pins?.A} />
                            <PinRow label="Probe/TLS" on={pins?.P} />
                            <PinRow label="Door" on={pins?.D} />
                            <PinRow label="Cycle-Start" on={pins?.S} />
                            <PinRow label="Hold" on={pins?.H} />
                            <PinRow label="Soft-Reset" on={pins?.R} />
                        </div>
                    </CardDescription>
                </div>
                <div className="flex flex-row gap-4 items-center mt-4">
                    <span className="text-gray-500 dark:text-white">
                        Lock Stepper Motors
                    </span>
                    <Toggle
                        onChange={handleStepperMotorToggle}
                        checked={stepperState === '255'}
                        disabled={!isConnected}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
