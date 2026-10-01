import { isLaserMode } from 'app/lib/laserMode';
import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import _get from 'lodash/get';
import { buildEstimatorConfig, ESTIMATE_SETTING_KEYS } from './config';
import type { EstimatorConfig } from './MotionPlanner';

type SettingsMap = Record<string, string | number | undefined>;

const getSettings = (state: unknown): SettingsMap =>
    (_get(state, 'controller.settings.settings') || {}) as SettingsMap;

const getAtcFlag = (state: unknown): string =>
    String(_get(state, 'controller.settings.info.NEWOPT.ATC') ?? '0');

/** Estimator machine config from the current controller state and preferences. */
export const getEstimatorConfig = (): Partial<EstimatorConfig> => {
    const state = reduxStore.getState();
    return buildEstimatorConfig({
        settings: getSettings(state),
        controllerType: _get(state, 'controller.type'),
        isLaser: isLaserMode(),
        atcEnabled: getAtcFlag(state) === '1',
        useAaxisForGrbl: store.get(
            'workspace.rotaryAxis.useAaxisForGrbl',
            false,
        ),
        baudrate: _get(state, 'connection.baudrate'),
    });
};

/**
 * Cheap fingerprint of everything that feeds the estimate, so callers can tell
 * whether a settings update actually needs a re-estimate.
 */
export const getEstimatorSignature = (): string => {
    const state = reduxStore.getState();
    const settings = getSettings(state);
    const parts = ESTIMATE_SETTING_KEYS.map((key) =>
        String(settings[key] ?? ''),
    );
    parts.push(
        String(_get(state, 'controller.type') ?? ''),
        getAtcFlag(state),
        String(isLaserMode()),
        String(store.get('workspace.rotaryAxis.useAaxisForGrbl', false)),
    );
    return parts.join('|');
};
