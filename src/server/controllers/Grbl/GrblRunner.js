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

import events from 'events';
import _ from 'lodash';
import decimalPlaces from '../../lib/decimal-places';
import GrblLineParser from './GrblLineParser';
import GrblLineParserResultStatus from './GrblLineParserResultStatus';
import GrblLineParserResultOk from './GrblLineParserResultOk';
import GrblLineParserResultError from './GrblLineParserResultError';
import GrblLineParserResultAlarm from './GrblLineParserResultAlarm';
import GrblLineParserResultParserState from './GrblLineParserResultParserState';
import GrblLineParserResultParameters from './GrblLineParserResultParameters';
import GrblLineParserResultFeedback from './GrblLineParserResultFeedback';
import GrblLineParserResultSettings from './GrblLineParserResultSettings';
import GrblLineParserResultStartup from './GrblLineParserResultStartup';
import logger from '../../lib/logger';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_ALARM
} from './constants';

const log = logger('controller:Grbl');

class GrblRunner extends events.EventEmitter {
    state = {
        status: {
            activeState: '',
            mpos: {
                x: '0.000',
                y: '0.000',
                z: '0.000'
            },
            wpos: {
                x: '0.000',
                y: '0.000',
                z: '0.000'
            },
            ov: [],
            alarmCode: 'Homing',
            probeActive: false,
            pinState: {}
        },
        parserstate: {
            modal: {
                motion: 'G0', // G0, G1, G2, G3, G38.2, G38.3, G38.4, G38.5, G80
                wcs: 'G54', // G54, G55, G56, G57, G58, G59
                plane: 'G17', // G17: xy-plane, G18: xz-plane, G19: yz-plane
                units: 'G21', // G20: Inches, G21: Millimeters
                distance: 'G90', // G90: Absolute, G91: Relative
                feedrate: 'G94', // G93: Inverse time mode, G94: Units per minute
                program: 'M0', // M0, M1, M2, M30
                spindle: 'M5', // M3: Spindle (cw), M4: Spindle (ccw), M5: Spindle off
                coolant: 'M9', // M7: Mist coolant, M8: Flood coolant, M9: Coolant off, [M7,M8]: Both on
                tool: '0' // Last non-0 parsed tool
            },
            tool: '',
            feedrate: '',
            spindle: '',
        }
    };

    settings = {
        version: '',
        parameters: {
        },
        settings: {
        }
    };

    parser = new GrblLineParser();

    parse(data) {
        data = ('' + data).replace(/\s+$/, '');
        if (!data) {
            log.warn('Empty result parsed from GrlbLineParser');
            return;
        }

        this.emit('raw', { raw: data });

        const result = this.parser.parse(data) || {};
        const { type, payload } = result;
        const { raw } = payload;

        if (type === GrblLineParserResultStatus) {
            // Grbl v1.1
            // WCO:0.000,10.000,2.500
            // A current work coordinate offset is now sent to easily convert
            // between position vectors, where WPos = MPos - WCO for each axis.
            if (_.has(payload, 'mpos') && !_.has(payload, 'wpos')) {
                payload.wpos = payload.wpos || {};
                _.each(payload.mpos, (mpos, axis) => {
                    const digits = decimalPlaces(mpos);
                    const wco = _.get((payload.wco || this.state.status.wco), axis, 0);
                    payload.wpos[axis] = (Number(mpos) - Number(wco)).toFixed(digits);
                });
            } else if (_.has(payload, 'wpos') && !_.has(payload, 'mpos')) {
                payload.mpos = payload.mpos || {};
                _.each(payload.wpos, (wpos, axis) => {
                    const digits = decimalPlaces(wpos);
                    const wco = _.get((payload.wco || this.state.status.wco), axis, 0);
                    payload.mpos[axis] = (Number(wpos) + Number(wco)).toFixed(digits);
                });
            }

            const probeActive = raw.includes('Pn:P');

            // if this is an initial alarm, make sure to send it to the controller
            if (payload.activeState === GRBL_ACTIVE_STATE_ALARM && this.state.status.activeState !== GRBL_ACTIVE_STATE_ALARM) {
                this.emit('startupAlarm');
            }

            const nextState = {
                ...this.state,
                status: {
                    ...this.state.status,
                    probeActive: probeActive,
                    ...payload
                }
            };

            // Delete the raw key
            delete nextState.status.raw;

            if (!_.isEqual(this.state.status, nextState.status)) {
                this.state = nextState; // enforce change
            }
            this.emit('status', payload);
            return;
        }
        if (type === GrblLineParserResultOk) {
            this.emit('ok', payload);
            return;
        }
        if (type === GrblLineParserResultError) {
            // https://nodejs.org/api/events.html#events_error_events
            // As a best practice, listeners should always be added for the 'error' events.
            this.emit('error', payload);
            log.error('Error found in GrblLineParserResultError');
            return;
        }
        if (type === GrblLineParserResultAlarm) {
            const nextState = {
                ...this.state,
                status: {
                    ...this.state.status,
                    activeState: GRBL_ACTIVE_STATE_ALARM,
                    alarmCode: Number(payload.message)
                }
            };
            if (!_.isEqual(this.state.status, nextState.status)) {
                this.state = nextState; // enforce change
            }
            this.emit('alarm', payload);
            log.warn('An Alarm was activated in Grbl Line Parser');
            return;
        }
        if (type === GrblLineParserResultParserState) {
            const { modal, tool, feedrate, spindle } = payload;
            const { tool: curTool } = this.state.parserstate.modal;

            if (tool !== '0' && tool !== 0) {
                modal.tool = tool;
            } else {
                modal.tool = curTool;
            }

            const nextState = {
                ...this.state,
                parserstate: {
                    modal: modal,
                    tool: modal.tool,
                    feedrate: feedrate,
                    spindle: spindle
                }
            };
            if (!_.isEqual(this.state.parserstate, nextState.parserstate)) {
                this.state = nextState; // enforce change
            }
            this.emit('parserstate', payload);
            return;
        }
        if (type === GrblLineParserResultParameters) {
            const { name, value } = payload;
            const nextSettings = {
                ...this.settings,
                parameters: {
                    ...this.settings.parameters,
                    [name]: value
                }
            };
            if (!_.isEqual(this.settings.parameters[name], nextSettings.parameters[name])) {
                this.settings = nextSettings; // enforce change
            }
            this.emit('parameters', payload);
            return;
        }
        if (type === GrblLineParserResultFeedback) {
            this.emit('feedback', payload);
            return;
        }
        if (type === GrblLineParserResultSettings) {
            const { name, value } = payload;
            const nextSettings = {
                ...this.settings,
                settings: {
                    ...this.settings.settings,
                    [name]: value
                }
            };
            if (this.settings.settings[name] !== nextSettings.settings[name]) {
                this.settings = nextSettings; // enforce change
            }
            this.emit('settings', payload);
            return;
        }
        if (type === GrblLineParserResultStartup) {
            const { version } = payload;
            const nextSettings = { // enforce change
                ...this.settings,
                version: version
            };
            if (!_.isEqual(this.settings.version, nextSettings.version)) {
                this.settings = nextSettings; // enforce change
            }
            this.emit('startup', payload);
            return;
        }
        if (data.length > 0) {
            this.emit('others', payload);
            return;
        }
    }

    getMachinePosition(state = this.state) {
        return _.get(state, 'status.mpos', {});
    }

    getWorkPosition(state = this.state) {
        return _.get(state, 'status.wpos', {});
    }

    getModalGroup(state = this.state) {
        return _.get(state, 'parserstate.modal', {});
    }

    getTool(state = this.state) {
        return Number(_.get(state, 'parserstate.tool')) || 0;
    }

    setTool(tool) {
        this.state.parserstate.modal.tool = tool;
    }

    getCurrentFeedrate(state = this.state) {
        const value = _.get(state, 'parserstate.feedrate');
        return `F${value}`;
    }

    getParameters() {
        return _.get(this.settings, 'parameters', {});
    }

    isAlarm() {
        const activeState = _.get(this.state, 'status.activeState');
        return activeState === GRBL_ACTIVE_STATE_ALARM;
    }

    isIdle() {
        const activeState = _.get(this.state, 'status.activeState');
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    }

    forceOK() {
        this.emit('ok', { raw: 'force ok' });
    }

    hasSettings() {
        return !_.isEmpty(this.settings.settings);
    }
}

export default GrblRunner;
