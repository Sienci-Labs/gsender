import cx from 'classnames';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import { state } from '../../../../../server/api';
import { homingString } from 'app/lib/eeprom.ts';

function ConfigRow({ label, children }) {
    return (
        <div className="relative flex flex-row justify-between w-full items-center leading-7 border-dotted border-b-gray-300 border-b-2 overflow-visible h-[3px] mt-3 mb-3">
            <div className="text-gray-700 bg-white pr-2">{label}</div>
            <div className="bg-white pl-2">{children}</div>
        </div>
    );
}

export function Configuration() {
    const baudrate = useSelector(
        (state: RootState) => state.connection.baudrate,
    );
    const connectionPort = useSelector(
        (state: RootState) => state.connection.port,
    );

    const axes = useSelector((state: RootState) => state.controller.state.axes); // axes.axes
    const axesList = axes.axes || ['X', 'Y', 'Z'];

    // 20, 13, 23
    const settings = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );

    const { $20, $13, $23 } = settings;
    console.log($13);

    const reportInchesString = $13 === '1' ? 'Enabled' : 'Disabled';
    const softLimitsString = $23 === '1' ? 'Enabled' : 'Disabled';
    const homingEnabledString = Number($20) > 0 ? 'Enabled' : 'Disabled';

    return (
        <div className="flex flex-col gap-1">
            <div className="font-bold mb-2">
                Sienci Labs LongMill MK2{' '}
                <span className="font-normal">30X30</span>
            </div>
            <ConfigRow label={'Connection'}>
                <b>{connectionPort}</b> at <b>{baudrate}</b> baud
            </ConfigRow>
            <ConfigRow label={'Axes'}>
                <b>{axesList.join(', ')}</b>
            </ConfigRow>
            <ConfigRow value="test" label={'Soft Limits'}>
                <b>{softLimitsString}</b>
            </ConfigRow>
            <ConfigRow value="test" label={'Homing'}>
                <b>{homingEnabledString}</b>
            </ConfigRow>
            <ConfigRow value="test" label={'Home Location'}>
                <b>{homingString($20)}</b>
            </ConfigRow>
            <ConfigRow label={'Report Inches'}>
                <b>{reportInchesString}</b>
            </ConfigRow>
        </div>
    );
}
