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
import _get from 'lodash/get';

import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import { WORKFLOW_STATE_IDLE } from 'app/constants';
import { in2mm, mm2in } from 'app/lib/units';
import store from 'app/store';
import {
    TOOL_CHANGE,
    UPDATE_CONTROLLER_SETTINGS,
    UPDATE_CONTROLLER_STATE,
    UPDATE_FEEDER_STATUS,
    UPDATE_SENDER_STATUS,
    UPDATE_WORKFLOW_STATE,
    UPDATE_HOMING_FLAG,
    RESET_HOMING,
    UPDATE_PARTIAL_CONTROLLER_SETTINGS,
    UPDATE_TERMINAL_HISTORY,
    UPDATE_SETTINGS_DESCRIPTIONS,
    UPDATE_ALARM_DESCRIPTIONS,
    ADD_SPINDLE,
} from '../actions/controllerActions';

interface Pos {
    x: number;
    y: number;
    z: number;
    a?: number;
    b?: number;
    c?: number;
}

interface Modal {
    motion: string;
    coolant: string;
    feedrate: string;
    plane: string;
    spindle: string;
    units: string;
    wcs: string;
    distance: string;
    tool: string;
}

interface Feeder {
    status: string | null;
}

interface Sender {
    status: string | null;
}

interface Workflow {
    state: string;
}

interface Tool {
    context: any;
}

interface Spindle {
    label: string;
    [key: string]: any;
}

interface Settings {
    $13?: number;
    [key: string]: any;
}

interface ControllerState {
    type: string;
    settings: Settings;
    state: any;
    modal: Modal;
    mpos: Pos;
    wpos: Pos;
    homingFlag: boolean;
    homingRun: boolean;
    feeder: Feeder;
    sender: Sender;
    workflow: Workflow;
    tool: Tool;
    terminalHistory: any[];
    spindles: Spindle[];
}

const initialState: ControllerState = {
    type: '',
    settings: {},
    state: {},
    modal: {
        motion: '',
        coolant: '',
        feedrate: '',
        plane: '',
        spindle: '',
        units: '',
        wcs: '',
        distance: '',
        tool: '',
    },
    mpos: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        a: 0.0,
        b: 0.0,
        c: 0.0,
    },
    wpos: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        a: 0.0,
        b: 0.0,
        c: 0.0,
    },
    homingFlag: false,
    homingRun: false,
    feeder: {
        status: null,
    },
    sender: {
        status: null,
    },
    workflow: {
        state: WORKFLOW_STATE_IDLE,
    },
    tool: {
        context: null,
    },
    terminalHistory: [],
    spindles: [],
};

/**
 * GRBL has the option to report in inches or MM and we need to account for that when receiving controller states
 * @param pos Object containing either machine or work coordinate position
 * @param settings Controller settings
 */
function mapPosToFeedbackUnits(pos: Partial<Pos>, settings: Settings): Pos {
    const defaultPos: Pos = {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        a: 0.0,
        b: 0.0,
        c: 0.0,
    };
    const $13 = Number(_get(settings, 'settings.$13', 0));

    let newPos = {
        ...defaultPos,
        ...pos,
    };

    if ($13 > 0) {
        newPos = {
            ...newPos,
            x: in2mm(newPos.x),
            y: in2mm(newPos.y),
            z: in2mm(newPos.z),
        };
    }

    return newPos;
}

function mapFeedrateToFeedbackUnits(
    feedrate: number,
    settings: Settings,
): number {
    const $13 = Number(_get(settings, 'settings.$13', 0));
    return $13 > 0 ? in2mm(feedrate) : feedrate;
}

function consolidateModals(state: any): Modal {
    const defaultModals: Modal = {
        motion: '',
        coolant: '',
        feedrate: '',
        plane: '',
        spindle: '',
        units: '',
        wcs: '',
        distance: '',
        tool: '',
    };

    const modal = _get(state, 'parserstate.modal');

    return {
        ...defaultModals,
        ...modal,
    };
}

const updateMachineLimitsFromEEPROM = ({
    settings,
}: {
    settings: Settings;
}) => {
    const { $130, $131, $132 } = settings;
    const xmax = Number($130);
    const ymax = Number($131);
    const zmax = Number($132);
    const machineProfile = store.get('workspace.machineProfile');
    machineProfile.limits = {
        ...machineProfile.limits,
        xmax,
        ymax,
        zmax,
    };
    machineProfile.mm = {
        depth: ymax,
        height: zmax,
        width: xmax,
    };
    machineProfile.in = {
        depth: Number(mm2in(ymax).toFixed(2)),
        height: Number(mm2in(zmax).toFixed(2)),
        width: Number(mm2in(xmax).toFixed(2)),
    };
    store.set('workspace.machineProfile', machineProfile);
};

const reducer = createReducer<ControllerState>(initialState, {
    [UPDATE_CONTROLLER_SETTINGS]: (
        payload: { type: string; settings: Settings },
        reducerState: ControllerState,
    ): ControllerState => {
        const { type, settings } = payload;
        const state = _get(reducerState, 'state');
        const wpos = mapPosToFeedbackUnits(
            _get(state, 'status.wpos'),
            settings,
        );
        const mpos = mapPosToFeedbackUnits(
            _get(state, 'status.mpos'),
            settings,
        );
        const modal = consolidateModals(state);
        updateMachineLimitsFromEEPROM({ settings });

        return {
            ...reducerState,
            type,
            settings,
            mpos,
            wpos,
            modal,
        };
    },
    [UPDATE_PARTIAL_CONTROLLER_SETTINGS]: (
        payload: Settings,
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            settings: {
                ...reducerState.settings,
                settings: {
                    ...reducerState.settings.settings,
                    ...payload,
                },
            },
        };
    },
    [UPDATE_CONTROLLER_STATE]: (
        payload: { type: string; state: any },
        reducerState: ControllerState,
    ): ControllerState => {
        const { type, state } = payload;
        const settings = _get(reducerState, 'settings');
        const modal = consolidateModals(state);
        const wpos = mapPosToFeedbackUnits(
            _get(state, 'status.wpos'),
            settings,
        );
        const mpos = mapPosToFeedbackUnits(
            _get(state, 'status.mpos'),
            settings,
        );
        state.status.feedrate = mapFeedrateToFeedbackUnits(
            _get(state, 'status.feedrate'),
            settings,
        );

        return {
            ...reducerState,
            type,
            state,
            modal,
            wpos,
            mpos,
        };
    },
    [UPDATE_FEEDER_STATUS]: (
        payload: Feeder,
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            feeder: {
                status: _get(payload, 'status', _get(reducerState, 'status')),
            },
        };
    },
    [UPDATE_SENDER_STATUS]: (
        payload: Sender,
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            sender: {
                status: _get(payload, 'status', _get(reducerState, 'status')),
            },
        };
    },
    [UPDATE_WORKFLOW_STATE]: (
        payload: { state: string },
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            workflow: {
                state:
                    _get(
                        payload,
                        'state',
                        _get(reducerState, 'workflow.state'),
                    ) || WORKFLOW_STATE_IDLE,
            },
        };
    },
    [TOOL_CHANGE]: (
        _payload: unknown,
        reducerState: ControllerState,
    ): ControllerState => {
        return reducerState;
    },
    [UPDATE_HOMING_FLAG]: (
        payload: { homingFlag: boolean },
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            homingFlag: payload.homingFlag,
            homingRun: true,
        };
    },
    [RESET_HOMING]: (
        _payload: unknown,
        reducerState: ControllerState,
    ): ControllerState => {
        return {
            ...reducerState,
            homingFlag: false,
            homingRun: false,
        };
    },
    [UPDATE_TERMINAL_HISTORY]: (
        payload: any[],
        reducerState: ControllerState,
    ): ControllerState => {
        const newHistory = [...reducerState.terminalHistory, ...payload];
        if (
            reducerState.terminalHistory.length > MAX_TERMINAL_INPUT_ARRAY_SIZE
        ) {
            newHistory.splice(
                0,
                reducerState.terminalHistory.length -
                    MAX_TERMINAL_INPUT_ARRAY_SIZE,
            );
        }
        return {
            ...reducerState,
            terminalHistory: newHistory,
        };
    },
    [UPDATE_SETTINGS_DESCRIPTIONS]: (
        payload: { descriptions: any },
        reducerState: ControllerState,
    ): ControllerState => {
        const { descriptions } = payload;
        return {
            ...reducerState,
            settings: {
                ...reducerState.settings,
                descriptions,
            },
        };
    },
    [UPDATE_ALARM_DESCRIPTIONS]: (
        payload: { alarms: any },
        reducerState: ControllerState,
    ): ControllerState => {
        const { alarms } = payload;
        return {
            ...reducerState,
            settings: {
                ...reducerState.settings,
                alarms,
            },
        };
    },
    [ADD_SPINDLE]: (
        payload: Spindle,
        reducerState: ControllerState,
    ): ControllerState => {
        const currentSpindles = [...reducerState.spindles];
        const otherSpindles = currentSpindles.filter(
            (spindle) => spindle.label !== payload.label,
        );

        return {
            ...reducerState,
            spindles: [...otherSpindles, payload],
        };
    },
});

export default reducer;
