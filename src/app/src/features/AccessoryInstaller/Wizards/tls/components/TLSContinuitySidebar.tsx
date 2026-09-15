import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { firmwarePastVersion } from 'app/lib/firmwareSemver.ts';
import { RootState } from 'app/store/redux';
import cx from 'classnames';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

export function SettingBadge({ label, ok }: { label: string; ok: boolean }) {
    return (
        <span
            className={cx('text-xs font-semibold px-2 py-0.5 rounded-full', {
                'bg-green-500/20 text-green-700 dark:text-green-400': ok,
                'bg-red-500/20 text-red-700 dark:text-red-400': !ok,
            })}
        >
            {label}
        </span>
    );
}

export function TLSContinuitySidebar() {
    const eepromSettings = useSelector(
        (state: RootState) => state.controller.settings.settings,
    );
    // Selected for reactivity: firmwarePastVersion reads redux directly, but
    // this ensures the component re-renders once version info arrives/changes.
    useSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );

    const invertProbePin = get(eepromSettings, '$6', undefined);
    const legacyToolSensor = get(eepromSettings, '$668', undefined);
    const showLegacySetting = !firmwarePastVersion(ATCI_SUPPORTED_VERSION);

    const invertProbePinOk = Number(invertProbePin) === 1;
    const legacyToolSensorOk = Number(legacyToolSensor) === 0;

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-content-primary">
                Related Settings
            </h3>
            <div className="flex items-center justify-between bg-white dark:bg-surface-sunken rounded-lg px-3 py-2">
                <span className="text-sm dark:text-content-primary">
                    $6 - Invert Probe Pin
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono dark:text-content-primary">
                        {invertProbePin ?? '-'}
                    </span>
                    <SettingBadge
                        label={invertProbePinOk ? 'OK' : 'Expected 1'}
                        ok={invertProbePinOk}
                    />
                </div>
            </div>
            {showLegacySetting && (
                <div className="flex items-center justify-between bg-white dark:bg-surface-sunken rounded-lg px-3 py-2">
                    <span className="text-sm dark:text-content-primary">
                        $668 - Legacy Tool Sensor
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono dark:text-content-primary">
                            {legacyToolSensor ?? '-'}
                        </span>
                        <SettingBadge
                            label={legacyToolSensorOk ? 'OK' : 'Expected 0'}
                            ok={legacyToolSensorOk}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
