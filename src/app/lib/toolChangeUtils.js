import { get } from 'lodash';
import store from 'app/store';
import reduxStore from 'app/store/redux';
import { TOUCHPLATE_TYPE_AUTOZERO } from 'app/lib/constants';

export const getProbeSettings = () => {
    const probeSettings = store.get('widgets.probe');
    const probeType = store.get('workspace.probeProfile.touchplateType');

    const probeThickness = (probeType === TOUCHPLATE_TYPE_AUTOZERO) ? '5' : probeSettings.zProbeDistance.mm;

    return {
        slowSpeed: probeSettings.probeFeedrate.mm,
        fastSpeed: probeSettings.probeFastFeedrate.mm,
        retract: probeSettings.retractionDistance.mm,
        zProbeDistance: probeSettings.zProbeDistance.mm,
        zProbeThickness: probeThickness,
    };
};


export const getToolString = () => {
    const state = reduxStore.getState();
    const tool = get(state, 'controller.state.parserstate.modal.tool', '-');
    return `T${tool}`;
};

export const getUnitModal = () => {
    const state = reduxStore.getState();
    const $13 = get(state, 'controller.settings.settings.$13', '0');
    if ($13 === '1') {
        return 'G20';
    }
    return 'G21';
};
