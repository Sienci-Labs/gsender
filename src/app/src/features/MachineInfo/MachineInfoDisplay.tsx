import { Switch } from 'app/components/shadcn/Switch';
import { KeepoutToggle } from 'app/features/ATC/components/KeepOut/KeepOutToggle.tsx';
import ModalRow from 'app/features/MachineInfo/ModalRow.tsx';
import PinRow from 'app/features/MachineInfo/PinRow.tsx';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { useAppTranslation } from 'app/i18n';
import controller from 'app/lib/controller.ts';
import store from 'app/store';
import get from 'lodash/get';
import { IoClose } from 'react-icons/io5';
import { TiPin, TiPinOutline } from 'react-icons/ti';
import { shallowEqual } from 'react-redux';

interface MachineInfoDisplayProps {
    pinned: boolean;
    setPinned: (pinned: boolean) => void;
    onClose?: () => void;
}

export function MachineInfoDisplay({
    pinned,
    setPinned,
    onClose,
}: MachineInfoDisplayProps) {
    const { t } = useAppTranslation();
    const { pins, keepoutFlags, modals, isConnected, settings, currentTool } =
        useTypedSelector(
            (state) => ({
                pins: state.controller.state.status?.pinState,
                modals: state.controller.modal,
                isConnected: state.connection.isConnected,
                settings: state.controller.settings,
                currentTool: state.controller.state.status?.currentTool,
                keepoutFlags: state.controller.state.status?.keepout?.flags,
            }),
            shallowEqual,
        );
    const probeSelection = store.get('widgets.probe.probeCommand');
    const stepperState = get(settings, 'settings.$1', '0');
    // We do some firmware version finagling
    const reportedFirmwareVersion = settings?.version;
    const firmwareVersion = (() => {
        const disconnectedValue = t(
            'workspace:machineInfo.firmwareDisconnected',
        );

        if (!isConnected) return disconnectedValue;

        if (typeof reportedFirmwareVersion === 'string') {
            const version = reportedFirmwareVersion as string;
            const sanitizedVersion = version.trim();
            return sanitizedVersion || disconnectedValue;
        }

        if (
            reportedFirmwareVersion &&
            typeof reportedFirmwareVersion === 'object'
        ) {
            const semver = get(reportedFirmwareVersion, 'semver');

            if (typeof semver === 'string' || typeof semver === 'number') {
                const sanitizedSemver = String(semver).trim();
                return sanitizedSemver || disconnectedValue;
            }
        }

        return disconnectedValue;
    })();

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
            <div className="flex flex-row w-full justify-between items-center mb-2">
                <div>
                    <span className="font-bold text-2xl">
                        {t('workspace:machineInfo.title')}
                    </span>
                    <div className="my-3">
                        <b>{t('workspace:machineInfo.firmwareVersion')}</b>{' '}
                        {firmwareVersion}
                    </div>
                </div>

                <div className="flex flex-row items-center gap-2">
                    <div className="text-2xl text-gray-600 max-sm:hidden dark:text-content-primary cursor-pointer hover:text-blue-600 transition-colors">
                        {pinned ? (
                            <TiPin
                                onClick={() => setPinned(!pinned)}
                                aria-label={t('workspace:machineInfo.unpin')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setPinned(!pinned);
                                    }
                                }}
                            />
                        ) : (
                            <TiPinOutline
                                onClick={() => setPinned(!pinned)}
                                aria-label={t('workspace:machineInfo.pin')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setPinned(!pinned);
                                    }
                                }}
                            />
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-2xl text-gray-600 dark:text-content-primary hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label={t('workspace:machineInfo.close')}
                        >
                            <IoClose />
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-[3fr_2fr]">
                <div className="flex flex-col pr-4">
                    <span className="underline float-left">
                        {t('workspace:machineInfo.cncModals')}
                    </span>
                    <div className="flex flex-col justify-between items-center">
                        <ModalRow
                            label={t('workspace:machineInfo.modals.probeStyle')}
                            value={isConnected ? probeSelection : '-'}
                        />
                        <ModalRow
                            label={t(
                                'workspace:machineInfo.modals.coordinateSystem',
                            )}
                            value={isConnected ? modals.wcs : '-'}
                        />
                        <ModalRow
                            label={t(
                                'workspace:machineInfo.modals.planeSelection',
                            )}
                            value={isConnected ? modals.plane : '-'}
                        />
                        <ModalRow
                            label={t('workspace:machineInfo.modals.units')}
                            value={isConnected ? modals.units : '-'}
                        />
                        <ModalRow
                            label={t(
                                'workspace:machineInfo.modals.distanceMode',
                            )}
                            value={isConnected ? modals.distance : '-'}
                        />
                        <ModalRow
                            label={t('workspace:machineInfo.modals.feed')}
                            value={isConnected ? modals.feedrate : '-'}
                        />
                        <ModalRow
                            label={t('workspace:machineInfo.modals.spindle')}
                            value={isConnected ? modals.spindle : '-'}
                        />
                        <ModalRow
                            label={t('workspace:machineInfo.modals.coolant')}
                            value={isConnected ? modals.coolant : '-'}
                        />
                    </div>
                </div>
                <div className="flex flex-col border-l-2 border-l-gray-200 pl-4">
                    <span className="underline float-left">
                        {t('workspace:machineInfo.pins')}
                    </span>
                    <div className="flex flex-col justify-between items-center">
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.xLimit')}
                            on={pins?.X}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.yLimit')}
                            on={pins?.Y}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.zLimit')}
                            on={pins?.Z}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.aLimit')}
                            on={pins?.A}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.probe')}
                            on={pins?.P}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.door')}
                            on={pins?.D}
                        />
                        <PinRow
                            label={t(
                                'workspace:machineInfo.pinLabels.cycleStart',
                            )}
                            on={pins?.S}
                        />
                        <PinRow
                            label={t('workspace:machineInfo.pinLabels.hold')}
                            on={pins?.H}
                        />
                        <PinRow
                            label={t(
                                'workspace:machineInfo.pinLabels.softReset',
                            )}
                            on={pins?.R}
                        />
                    </div>
                </div>
            </div>
            {currentTool >= 0 && (
                <div className="text-gray-600 flex w-full gap-4">
                    <span className="text-gray-600 dark:text-content-primary">
                        {t('workspace:machineInfo.currentTool')}{' '}
                    </span>
                    <span className="text-black dark:text-content-primary">
                        T{currentTool}
                    </span>
                </div>
            )}
            <div className="flex flex-row gap-4 items-center mt-4">
                <span
                    className="text-gray-600 dark:text-content-primary"
                    id="lock-stepper-label"
                >
                    {t('workspace:machineInfo.lockStepperMotors')}
                </span>
                <Switch
                    aria-labelledby="lock-stepper-label"
                    onChange={handleStepperMotorToggle}
                    checked={stepperState === '255'}
                    disabled={!isConnected}
                />
            </div>

            {keepoutFlags && (
                <div className="flex flex-row gap-2 items-center mt-2">
                    <span className="text-gray-600 dark:text-content-primary">
                        {t('workspace:machineInfo.keepout')}
                    </span>
                    <KeepoutToggle />
                </div>
            )}
        </>
    );
}
