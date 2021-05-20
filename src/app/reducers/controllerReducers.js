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
import _mapValues from 'lodash/mapValues';
import {
    UPDATE_CONTROLLER_SETTINGS,
    UPDATE_CONTROLLER_STATE,
    UPDATE_FEEDER_STATUS, UPDATE_SENDER_STATUS, UPDATE_WORKFLOW_STATE
} from '../actions/controllerActions';
import { in2mm } from '../lib/units';
import { GRBL_ACTIVE_STATE_IDLE, WORKFLOW_STATE_IDLE } from '../constants';


const initialState = {
    type: '',
    settings: {},
    state: {},
    modal: {},
    mpos: {},
    wpos: {},
    feeder: {
        status: null
    },
    sender: {
        status: null
    },
    workflow: {
        state: WORKFLOW_STATE_IDLE
    }
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

    return _mapValues({
        ...defaultPos,
        ...pos,
    }, (val) => {
        return ($13 > 0) ? in2mm(val) : val;
    });
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
        distance: ''
    };

    const modal = _get(state, 'parserstate.modal');

    return {
        ...defaultModals,
        ...modal
    };
}


const reducer = createReducer(initialState, {
    [UPDATE_CONTROLLER_SETTINGS]: (payload, reducerState) => {
        const { type, settings } = payload;
        const state = _get(reducerState, 'state');
        const wpos = mapPosToFeedbackUnits(_get(state, 'status.wpos'), settings);
        const mpos = mapPosToFeedbackUnits(_get(state, 'status.mpos'), settings);

        return {
            type,
            settings,
            mpos,
            wpos
        };
    },
    [UPDATE_CONTROLLER_STATE]: (payload, reducerState) => {
        const { type, state } = payload;
        const settings = _get(reducerState, 'settings');
        const modal = consolidateModals(state);
        const wpos = mapPosToFeedbackUnits(_get(state, 'status.wpos'), settings);
        const mpos = mapPosToFeedbackUnits(_get(state, 'status.mpos'), settings);

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
        console.log(payload);
        return {
            sender: {
                status: _get(payload, 'status', _get(reducerState, 'status'))
            }
        };
    },
    [UPDATE_WORKFLOW_STATE]: (payload, reducerState) => {
        return {
            workflow: {
                state: _get(payload, 'state,', _get(reducerState, 'state')) || GRBL_ACTIVE_STATE_IDLE,
            }
        };
    }
});

export default reducer;
