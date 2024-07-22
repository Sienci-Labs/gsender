import { get } from 'lodash';
import store from '../store';
import reduxStore from '../store/redux';
import { TOUCHPLATE_TYPE_AUTOZERO } from '../lib/constants';
import { UNITS_GCODE } from '../definitions/types';
import { ProbeWidgetSettings, ReduxState } from '../definitions/interfaces';

export const getProbeSettings = (): ProbeWidgetSettings => {
    const probeSettings = store.get('widgets.probe');
    const probeType = store.get('workspace.probeProfile.touchplateType');

    const probeThickness = (probeType === TOUCHPLATE_TYPE_AUTOZERO) ? '5' : probeSettings.zProbeDistance;

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
