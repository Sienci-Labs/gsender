import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { homingString } from 'app/lib/eeprom.ts';
import get from 'lodash/get';
import { truncatePort } from 'app/features/Stats/utils/statUtils.ts';
import store from 'app/store';
import { MachineProfile } from 'app/definitions/firmware';

function ConfigRow({
    label,
    children,
    connected = false,
}: {
    label: string;
    children: ReactNode;
    connected: boolean;
}) {
    return (
        <div className="relative flex flex-row justify-between w-full items-center leading-7 border-dotted border-b-gray-300 border-b-2 overflow-visible h-[3px] mt-3 mb-3 dark:text-white dark:bg-dark">
            <div className="text-gray-700 bg-white pr-2 dark:text-white dark:bg-dark">
                {label}
            </div>
            <div className="bg-white pl-2 dark:text-white dark:bg-dark">
                {connected ? children : <b>-</b>}
            </div>
        </div>
    );
}

export function Configuration() {
    const machineProfile: MachineProfile = store.get(
        'workspace.machineProfile',
        {},
    );
    const baudrate = useSelector(
        (state: RootState) => state.connection.baudrate,
    );
    const connectionPort = useSelector(
        (state: RootState) => state.connection.port,
    );
    const connected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const controllerState = useSelector(
        (state: RootState) => state.controller.state,
    ); // axes.axes
    const axesList = get(controllerState, 'axes.axes', ['X', 'Y', 'Z']);

    // 20, 13, 23
    const settings = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );

    const { $20, $13, $23 } = settings;

    const reportInchesString = $13 === '1' ? 'Enabled' : 'Disabled';
    const softLimitsString = $23 === '1' ? 'Enabled' : 'Disabled';
    const homingEnabledString = Number($20) > 0 ? 'Enabled' : 'Disabled';

    return (
        <div className="flex flex-col gap-1">
            <div className="font-bold mb-2 dark:text-white">
                {machineProfile.company + ' ' + machineProfile.name + ' '}
                <span className="font-normal">{machineProfile.type}</span>
            </div>
            <ConfigRow connected={connected} label={'Connection'}>
                <b>{truncatePort(connectionPort)}</b> at <b>{baudrate}</b> baud
            </ConfigRow>
            <ConfigRow connected={connected} label={'Axes'}>
                <b>{axesList.join(', ')}</b>
            </ConfigRow>
            <ConfigRow connected={connected} label={'Soft Limits'}>
                <b>{softLimitsString}</b>
            </ConfigRow>
            <ConfigRow connected={connected} label={'Homing'}>
                <b>{homingEnabledString}</b>
            </ConfigRow>
            <ConfigRow connected={connected} label={'Home Location'}>
                <b>{homingString($20)}</b>
            </ConfigRow>
            <ConfigRow connected={connected} label={'Report Inches'}>
                <b>{reportInchesString}</b>
            </ConfigRow>
        </div>
    );
}
