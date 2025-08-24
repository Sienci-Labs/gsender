import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _get from 'lodash/get';

import { MAX_TERMINAL_INPUT_ARRAY_SIZE } from 'app/lib/constants';
import { WORKFLOW_STATE_IDLE } from 'app/constants';
import { in2mm, mm2in } from 'app/lib/units';
import store from 'app/store';
import { EEPROMDescriptions, EEPROMSettings } from 'app/definitions/firmware';
import { Modal } from 'app/lib/definitions/gcode_virtualization';
import { Feeder, Sender } from 'app/lib/definitions/sender_feeder';
import { Spindle } from 'app/features/Spindle/definitions';
import { BasicPosition, BasicObject } from 'app/definitions/general';

import { ControllerSettings, ControllerState } from '../../definitions';

const initialState: ControllerState = {
    type: '',
    settings: {
        parameters: {},
        settings: {},
        groups: {},
        alarms: {},
    },
    state: {},
    modal: {
        motion: 'G0',
        coolant: 'M9',
        feedrate: 'G94',
        plane: 'G17',
        spindle: 'M5',
        units: 'G21',
        wcs: 'G54',
        distance: 'G90',
        tool: 0,
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
        currentTool: undefined,
    },
    terminalHistory: [],
    spindles: [],
};

function mapPosToFeedbackUnits(
    pos: BasicPosition,
    settings: ControllerSettings,
): BasicPosition {
    const defaultPos: BasicPosition = {
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
    settings: ControllerSettings,
): number {
    const $13 = Number(_get(settings, 'settings.$13', 0));
    return $13 > 0 ? in2mm(feedrate) : feedrate;
}

function consolidateModals(state: ControllerState): Modal {
    const defaultModals: Modal = {
        motion: 'G0',
        coolant: 'M9',
        feedrate: 'G94',
        plane: 'G17',
        spindle: 'M5',
        units: 'G21',
        wcs: 'G54',
        distance: 'G90',
        tool: 0,
    };

    const modal: Modal = _get(state, 'parserstate.modal');

    return {
        ...defaultModals,
        ...modal,
    };
}

const updateMachineLimitsFromEEPROM = ({
    settings,
}: {
    settings: EEPROMSettings;
}) => {
    const { $130, $131, $132 } = settings;

    const xmax = Number($130);
    const ymax = Number($131);
    const zmax = Number($132);

    if (isNaN(ymax) || isNaN(xmax) || isNaN(zmax)) {
        return;
    }
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
    store.emit('dimensions');
};

const controllerSlice = createSlice({
    name: 'controller',
    initialState,
    reducers: {
        updateControllerSettings: (
            state,
            action: PayloadAction<{
                type: string;
                settings: ControllerSettings;
            }>,
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
            updateMachineLimitsFromEEPROM({ settings: settings.settings });

            state.type = type;
            state.settings = settings;
            state.mpos = mpos;
            state.wpos = wpos;
            state.modal = modal;
        },
        updatePartialControllerSettings: (
            state,
            action: PayloadAction<EEPROMSettings>,
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
            const mappedFeedrate = mapFeedrateToFeedbackUnits(
                _get(newState, 'status.feedrate'),
                state.settings,
            );

            state.type = type;
            state.state = {
                ...newState,
                status: {
                    ...newState.status,
                    feedrate: mappedFeedrate,
                },
            };
            state.modal = modal;
            state.wpos = wpos;
            state.mpos = mpos;
            
            // Update current tool from status report if available
            const currentTool = _get(newState, 'status.currentTool');
            if (currentTool !== undefined) {
                state.tool.currentTool = currentTool;
            }
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
            action: PayloadAction<{ descriptions: EEPROMDescriptions }>,
        ) => {
            state.settings.descriptions = action.payload.descriptions;
        },
        updateAlarmDescriptions: (
            state,
            action: PayloadAction<{ alarms: BasicObject }>,
        ) => {
            state.settings.alarms = action.payload.alarms;
        },
        addSpindle: (state, action: PayloadAction<Spindle>) => {
            const otherSpindles = state.spindles.filter(
                (spindle: Spindle) => spindle.label !== action.payload.label,
            );
            state.spindles = [...otherSpindles, action.payload];
        },
        updateControllerType: (
            state,
            action: PayloadAction<{
                type: string;
            }>,
        ) => {
            const { type } = action.payload;
            state.type = type;
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
    updateControllerType,
} = controllerSlice.actions;

export default controllerSlice.reducer;
