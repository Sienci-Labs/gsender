import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _get from 'lodash/get';

import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import { WORKFLOW_STATE_IDLE } from 'app/constants';
import { in2mm, mm2in } from 'app/lib/units';
import store from 'app/store';

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

const controllerSlice = createSlice({
    name: 'controller',
    initialState,
    reducers: {
        updateControllerSettings: (
            state,
            action: PayloadAction<{ type: string; settings: Settings }>,
        ) => {
            const { type, settings } = action.payload;
            const wpos = mapPosToFeedbackUnits(
                _get(state.state, 'status.wpos'),
                settings,
            );
            const mpos = mapPosToFeedbackUnits(
                _get(state.state, 'status.mpos'),
                settings,
            );
            const modal = consolidateModals(state.state);
            updateMachineLimitsFromEEPROM({ settings });

            state.type = type;
            state.settings = settings;
            state.mpos = mpos;
            state.wpos = wpos;
            state.modal = modal;
        },
        updatePartialControllerSettings: (
            state,
            action: PayloadAction<Settings>,
        ) => {
            state.settings.settings = {
                ...state.settings.settings,
                ...action.payload,
            };
        },
        updateControllerState: (
            state,
            action: PayloadAction<{ type: string; state: any }>,
        ) => {
            const { type, state: newState } = action.payload;
            const modal = consolidateModals(newState);
            const wpos = mapPosToFeedbackUnits(
                _get(newState, 'status.wpos'),
                state.settings,
            );
            const mpos = mapPosToFeedbackUnits(
                _get(newState, 'status.mpos'),
                state.settings,
            );
            newState.status.feedrate = mapFeedrateToFeedbackUnits(
                _get(newState, 'status.feedrate'),
                state.settings,
            );

            state.type = type;
            state.state = newState;
            state.modal = modal;
            state.wpos = wpos;
            state.mpos = mpos;
        },
        updateFeederStatus: (state, action: PayloadAction<Feeder>) => {
            state.feeder.status = _get(
                action.payload,
                'status',
                state.feeder.status,
            );
        },
        updateSenderStatus: (state, action: PayloadAction<Sender>) => {
            state.sender.status = _get(
                action.payload,
                'status',
                state.sender.status,
            );
        },
        updateWorkflowState: (
            state,
            action: PayloadAction<{ state: string }>,
        ) => {
            state.workflow.state =
                _get(action.payload, 'state', state.workflow.state) ||
                WORKFLOW_STATE_IDLE;
        },
        toolChange: (state) => {
            // No changes needed for this action
        },
        updateHomingFlag: (
            state,
            action: PayloadAction<{ homingFlag: boolean }>,
        ) => {
            state.homingFlag = action.payload.homingFlag;
            state.homingRun = true;
        },
        resetHoming: (state) => {
            state.homingFlag = false;
            state.homingRun = false;
        },
        updateTerminalHistory: (state, action: PayloadAction<any[]>) => {
            state.terminalHistory = [
                ...state.terminalHistory,
                ...action.payload,
            ];
            if (state.terminalHistory.length > MAX_TERMINAL_INPUT_ARRAY_SIZE) {
                state.terminalHistory.splice(
                    0,
                    state.terminalHistory.length -
                        MAX_TERMINAL_INPUT_ARRAY_SIZE,
                );
            }
        },
        updateSettingsDescriptions: (
            state,
            action: PayloadAction<{ descriptions: any }>,
        ) => {
            state.settings.descriptions = action.payload.descriptions;
        },
        updateAlarmDescriptions: (
            state,
            action: PayloadAction<{ alarms: any }>,
        ) => {
            state.settings.alarms = action.payload.alarms;
        },
        addSpindle: (state, action: PayloadAction<Spindle>) => {
            const otherSpindles = state.spindles.filter(
                (spindle) => spindle.label !== action.payload.label,
            );
            state.spindles = [...otherSpindles, action.payload];
        },
    },
});

export const {
    updateControllerSettings,
    updatePartialControllerSettings,
    updateControllerState,
    updateFeederStatus,
    updateSenderStatus,
    updateWorkflowState,
    toolChange,
    updateHomingFlag,
    resetHoming,
    updateTerminalHistory,
    updateSettingsDescriptions,
    updateAlarmDescriptions,
    addSpindle,
} = controllerSlice.actions;

export default controllerSlice.reducer;
