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
import automaticToolChange from 'app/wizards/automaticToolchange';
import probeToolLength from 'app/wizards/probeToolLength';
import { showFirstToolchangePrompt } from 'app/wizards/firstToolchangePrompt';

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

/**
 * Determines which wizard instructions to use for Fixed Tool Sensor toolchange.
 * For the first tool (count <= 1), behavior is controlled by the user's setting:
 * - "Always run full wizard": Always runs automaticToolChange
 * - "Prompt for first tool": Prompts user to choose between automaticToolChange or probeToolLength
 * - "Always probe length only": Always runs probeToolLength
 * For subsequent tools (count > 1), always runs automaticToolChange.
 *
 * @param count - The tool change count (1 for first tool, >1 for subsequent tools)
 * @param comment - Optional comment from the gcode file
 * @returns The apprporiate wizard instructions
 */
export const determineFixedSensorInstructions = async (
    count: number,
    comment = '',
) => {
    if (count > 1) {
        return automaticToolChange(count);
    }

    const firstToolBehaviour = store.get(
        'workspace.toolChange.firstToolBehaviour',
        'Always run full wizard',
    );

    if (firstToolBehaviour === 'Always run full wizard') {
        return automaticToolChange(count);
    } else if (firstToolBehaviour === 'Always probe length only') {
        return probeToolLength();
    } else {
        // 'Prompt for first tool' - ask the user
        const performInitialTC = await showFirstToolchangePrompt({
            comment,
        });

        if (performInitialTC) {
            return automaticToolChange(count);
        } else {
            return probeToolLength();
        }
    }
};
