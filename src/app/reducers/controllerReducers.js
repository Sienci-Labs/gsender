/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
import { createReducer } from 'redux-action';
import { ensurePositiveNumber } from 'ensure-type';
import _get from 'lodash/get';
// import _mapValues from 'lodash/mapValues';
import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import {
    TOOL_CHANGE,
    UPDATE_CONTROLLER_SETTINGS,
    UPDATE_CONTROLLER_STATE,
    UPDATE_FEEDER_STATUS, UPDATE_SENDER_STATUS, UPDATE_WORKFLOW_STATE,
    UPDATE_HOMING_FLAG,
    RESET_HOMING,
    UPDATE_PARTIAL_CONTROLLER_SETTINGS,
    UPDATE_TERMINAL_HISTORY,
    UPDATE_SETTINGS_DESCRIPTIONS, UPDATE_ALARM_DESCRIPTIONS,
    ADD_SPINDLE,
    UPDATE_GROUPS
} from '../actions/controllerActions';
import { in2mm, mm2in } from '../lib/units';
import { WORKFLOW_STATE_IDLE } from '../constants';
import store from '../store';


const initialState = {
    type: '',
    settings: {},
    state: {},
    modal: {},
    mpos: {
        x: 0.00,
        y: 0.00,
        z: 0.00,
        a: 0.00,
        b: 0.00,
        c: 0.00
    },
    wpos: {
        x: 0.00,
        y: 0.00,
        z: 0.00,
        a: 0.00,
        b: 0.00,
        c: 0.00
    },
    homingFlag: false,
    homingRun: false,
    feeder: {
        status: null
    },
    sender: {
        status: null
    },
    workflow: {
        state: WORKFLOW_STATE_IDLE
    },
    tool: {
        context: null
    },
    terminalHistory: [],
    spindles: []
};

/**
 * GRBL has the option to report in inches or MM and we need to account for that when receiving controller states
 * @param pos Object containing either machine or work coordinate position
 * @param $13 Value of the $13 variable which controls whether feedback units are inches or mm
 */
function mapPosToFeedbackUnits(pos, settings) {
    const defaultPos = {
        x: '0.000',
        y: '0.000',
        z: '0.000',
        a: '0.000',
        b: '0.000',
        c: '0.000',
    };
    const $13 = ensurePositiveNumber(_get(settings, 'settings.$13'));

    // don't convert a-c
    let newPos = {
        ...defaultPos,
        ...pos
    };
    if ($13) {
        newPos = {
            ...newPos,
            x: in2mm(newPos.x),
            y: in2mm(newPos.y),
            z: in2mm(newPos.z),
        };
    }

    return newPos;
}

function mapFeedrateToFeedbackUnits(feedrate, settings) {
    const $13 = ensurePositiveNumber(_get(settings, 'settings.$13'));
    return ($13 > 0) ? in2mm(feedrate) : feedrate;
}


function consolidateModals(state) {
    const defaultModals = {
        motion: '',
        coolant: '',
        feedrate: '',
        plane: '',
        spindle: '',
        units: '',
        wcs: '',
        distance: '',
        tool: ''
    };

    const modal = _get(state, 'parserstate.modal');

    return {
        ...defaultModals,
        ...modal
    };
}

const updateMachineLimitsFromEEPROM = ({ settings }) => {
    const { $130, $131, $132 } = settings;
    let xmax = Number($130);
    let ymax = Number($131);
    let zmax = Number($132);
    const machineProfile = store.get('workspace.machineProfile');
    machineProfile.limits = {
        ...machineProfile.limits,
        xmax,
        ymax,
        zmax
    };
    machineProfile.mm = {
        depth: ymax,
        height: zmax,
        width: xmax
    };
    machineProfile.in = {
        depth: Number(mm2in(ymax).toFixed(2)),
        height: Number(mm2in(zmax).toFixed(2)),
        width: Number(mm2in(xmax).toFixed(2))
    };
    store.set('workspace.machineProfile', machineProfile);
};


const reducer = createReducer(initialState, {
    [UPDATE_CONTROLLER_SETTINGS]: (payload, reducerState) => {
        const { type, settings } = payload;
        const state = _get(reducerState, 'state');
        const wpos = mapPosToFeedbackUnits(_get(state, 'status.wpos'), settings);
        const mpos = mapPosToFeedbackUnits(_get(state, 'status.mpos'), settings);
        const modal = consolidateModals(state);
        updateMachineLimitsFromEEPROM(settings);

        return {
            type,
            settings,
            mpos,
            wpos,
            modal
        };
    },
    [UPDATE_PARTIAL_CONTROLLER_SETTINGS]: (payload, reducerState) => {
        return {
            settings: {
                ...reducerState.settings,
                settings: {
                    ...reducerState.settings.settings,
                    ...payload
                }
            }
        };
    },
    [UPDATE_CONTROLLER_STATE]: (payload, reducerState) => {
        let { type, state } = payload;
        const settings = _get(reducerState, 'settings');
        const modal = consolidateModals(state);
        const wpos = mapPosToFeedbackUnits(_get(state, 'status.wpos'), settings);
        const mpos = mapPosToFeedbackUnits(_get(state, 'status.mpos'), settings);
        state.status.feedrate = mapFeedrateToFeedbackUnits(_get(state, 'status.feedrate'), settings);

        return {
            type,
            state,
            modal,
            wpos,
            mpos
        };
    },
    [UPDATE_FEEDER_STATUS]: (payload, reducerState) => {
        return {
            feeder: {
                status: _get(payload, 'status', _get(reducerState, 'status'))
            }
        };
    },
    [UPDATE_SENDER_STATUS]: (payload, reducerState) => {
        return {
            sender: {
                status: _get(payload, 'status', _get(reducerState, 'status'))
            }
        };
    },
    [UPDATE_WORKFLOW_STATE]: (payload, reducerState) => {
        return {
            workflow: {
                state: _get(payload, 'state', _get(reducerState, 'status.activeState')) || WORKFLOW_STATE_IDLE,
            }
        };
    },
    [TOOL_CHANGE]: (context, reducerState) => {
        return {};
    },
    [UPDATE_HOMING_FLAG]: (payload, reducerState) => {
        const { homingFlag } = payload;
        return {
            homingFlag,
            homingRun: true
        };
    },
    [RESET_HOMING]: (payload, reducerState) => {
        return {
            homingFlag: false,
            homingRun: false
        };
    },
    [UPDATE_TERMINAL_HISTORY]: (payload, reducerState) => {
        const newHistory = [...reducerState.terminalHistory, ...payload];
        if (reducerState.terminalHistory.length > MAX_TERMINAL_INPUT_ARRAY_SIZE) {
            for (let i = 0; i < reducerState.terminalHistory.length - MAX_TERMINAL_INPUT_ARRAY_SIZE; i++) {
                newHistory.shift();
            }
        }
        return {
            terminalHistory: newHistory
        };
    },
    [UPDATE_SETTINGS_DESCRIPTIONS]: (payload, reducerState) => {
        const { descriptions } = payload;
        return {
            settings: {
                ...reducerState.settings,
                descriptions
            }
        };
    },
    [UPDATE_ALARM_DESCRIPTIONS]: (payload, reducerState) => {
        const { alarms } = payload;
        return {
            settings: {
                ...reducerState.settings,
                alarms
            }
        };
    },
    [ADD_SPINDLE]: (payload, reducerState) => {
        const currentSpindles = [...reducerState.spindles];

        let otherSpindles = currentSpindles.filter((spindle) => spindle.label !== payload.label);

        return {
            spindles: [
                ...otherSpindles,
                payload
            ]
        };
    },
    [UPDATE_GROUPS]: (payload, reducerState) => {
        const { groups } = payload;
        return {
            settings: {
                ...reducerState.settings,
                groups
            }
        };
    }
});

export default reducer;
