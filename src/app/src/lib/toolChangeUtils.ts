import get from 'lodash/get';
import store from '../store';
import { store as reduxStore } from '../store/redux';
import {
    TOUCHPLATE_TYPE_3D,
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_BITZERO,
    TOUCHPLATE_TYPE_ZERO,
} from '../lib/constants';
import { UNITS_GCODE } from 'app/definitions/general';
import {
    Probe,
    ProbeProfile,
    ProbeWidgetSettings,
    TOUCHPLATE_TYPES_T,
} from 'app/features/Probe/definitions';
import { ReduxState } from 'app/store/definitions';

export const getProbeSettings = (): ProbeWidgetSettings => {
    const probeProfile: ProbeProfile = store.get('workspace.probeProfile');
    const probeSettings: Probe = store.get('widgets.probe');
    const touchplateType: TOUCHPLATE_TYPES_T = store.get(
        'workspace.probeProfile.touchplateType',
    );

    let probeThickness = probeProfile.zThickness.standardBlock;
    if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
        probeThickness = probeProfile.zThickness.autoZero;
    } else if (touchplateType === TOUCHPLATE_TYPE_ZERO) {
        probeThickness = probeProfile.zThickness.zProbe;
    } else if (touchplateType === TOUCHPLATE_TYPE_3D) {
        probeThickness = probeProfile.zThickness.probe3D;
    } else if (touchplateType === TOUCHPLATE_TYPE_BITZERO) {
        // Use Z-only thickness for tool change (probe placed flat on surface)
        probeThickness = probeProfile.zThickness.bitZeroZOnly;
    }

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
