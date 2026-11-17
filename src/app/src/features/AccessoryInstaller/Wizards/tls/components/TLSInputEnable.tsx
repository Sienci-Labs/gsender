import { useState } from 'react';
import { useSelector } from 'react-redux';
import get from 'lodash/get';
import { RootState } from 'app/store/redux';
import controller from 'app/lib/controller.ts';
import { SettingBadge } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSContinuitySidebar.tsx';

export function TLSInputEnable() {
    const [sent, setSent] = useState<boolean>(false);

    const boardId = useSelector(
        (state: RootState) => state.controller.settings.info?.BOARD,
    );
    const eepromSettings = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );
    const probeType = useSelector(
        (state: RootState) => state.controller.state.status?.probe?.type,
    );

    const tlsInputEnabled = (Number(get(eepromSettings, '$65', 0)) || 0) & 8;

    if (boardId !== 'SLB Lite' || !tlsInputEnabled) {
        return null;
    }

    const invertProbePin = get(eepromSettings, '$6', undefined);
    const invertProbePinOk = Number(invertProbePin) === 1;
    const probeValue = Number(probeType) || 0;

    const enableTLSInput = () => {
        controller.command('gcode', 'G65 P5 Q1');
        setSent(true);
    };

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
                TLS Input
            </h3>
            <div className="flex items-center justify-between bg-white dark:bg-dark-darker rounded-lg px-3 py-2">
                <span className="text-sm dark:text-white">
                    $6 - Invert Probe Pin
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono dark:text-white">
                        {invertProbePin ?? '-'}
                    </span>
                    <SettingBadge
                        label={invertProbePinOk ? 'OK' : 'Expected 1'}
                        ok={invertProbePinOk}
                    />
                </div>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-dark-darker rounded-lg px-3 py-2">
                <span className="text-sm dark:text-white">Probe Type</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono dark:text-white">
                        {probeValue}
                    </span>
                    <SettingBadge
                        label={probeValue === 1 ? 'OK' : 'Not Ready'}
                        ok={probeValue === 1}
                    />
                </div>
            </div>
            <button
                onClick={enableTLSInput}
                disabled={probeValue === 1}
                className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
            >
                Enable TLS Input
            </button>
            {sent && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                    TLS input enable command sent.
                </p>
            )}
        </div>
    );
}
