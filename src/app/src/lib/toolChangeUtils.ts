import get from 'lodash/get';
import store from '../store';
import { store as reduxStore } from '../store/redux';
import { TOUCHPLATE_TYPE_AUTOZERO } from '../lib/constants';
import { UNITS_GCODE } from 'definitions/general';
import { ProbeWidgetSettings } from 'features/Probe/definitions';
import { ReduxState } from 'store/definitions';

export const getProbeSettings = (): ProbeWidgetSettings => {
    const probeSettings = store.get('widgets.probe');
    const touchplateType = store.get('workspace.probeProfile.touchplateType');

    const probeThickness =
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO
            ? '5'
            : probeSettings.zProbeDistance;

    return {
        slowSpeed: probeSettings.probeFeedrate,
        fastSpeed: probeSettings.probeFastFeedrate,
        retract: probeSettings.retractionDistance,
        zProbeDistance: probeSettings.zProbeDistance,
        zProbeThickness: probeThickness,
    };
};

export const getToolString = (): string => {
    const state = reduxStore.getState();
    const tool = get(state, 'controller.state.parserstate.modal.tool', '-');
    return `T${tool}`;
};

export const getUnitModal = (): UNITS_GCODE => {
    const state: ReduxState = reduxStore.getState();
    const $13 = get(state, 'controller.settings.settings.$13', '0');
    if ($13 === '1') {
        return 'G20';
    }
    return 'G21';
};
