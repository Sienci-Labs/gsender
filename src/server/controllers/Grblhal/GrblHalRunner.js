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
import GrblHalLineParser from './GrblHalLineParser';
import GrblHalLineParserResultStatus from './GrblHalLineParserResultStatus';
import GrblHalLineParserResultOk from './GrblHalLineParserResultOk';
import GrblHalLineParserResultError from './GrblHalLineParserResultError';
import GrblHalLineParserResultAlarm from './GrblHalLineParserResultAlarm';
import GrbHalLineParserResultParserState from './GrblHalLineParserResultParserState';
import GrblHalLineParserResultParameters from './GrblHalLineParserResultParameters';
import GrblHalLineParserResultFeedback from './GrblHalLineParserResultFeedback';
import GrblHalLineParserResultSettings from './GrblHalLineParserResultSettings';
import GrblHalLineParserResultStartup from './GrblHalLineParserResultStartup';
import GrblHalLineParserResultSettingDescription from './GrblHalLineParserResultSettingDescription';
import GrblHalLineParserResultVersion from './GrblHalLineParserResultVersion';
import GrblHalLineParserResultCode from './GrblHalLineParserResultCode';
import logger from '../../lib/logger';
import {
    GRBL_HAL_ACTIVE_STATE_IDLE,
    GRBL_HAL_ACTIVE_STATE_ALARM,
    GRBL_HAL_ACTIVE_STATE_CHECK
} from './constants';
import GrblHalLineParserResultInfo from './GrblHalLineParserResultInfo';
import GrblHalLineParserResultSettingDetails from './GrblHalLineParserResultSettingDetails';
import GrblHalLineParserResultCompleteStatus from 'server/controllers/Grblhal/GrblHalLineParserResultCompleteStatus';
import GrblHalLineParserResultAXS from './GrblHalLineParserResultAXS';
import GrblHalLineParserResultGroupDetail from './GrblHalLineParserResultGroupDetail';
import GrblHalLineParserResultAlarmDetails from './GrblHalLineParserResultAlarmDetails';
import GrblHalLineParserResultSpindle from 'server/controllers/Grblhal/GrblHalLineParserResultSpindle';
import GrblHalLineParserResultTool from './GrblHalLineParserResultTool';
import GrblHalLineParserResultSDCard from './GrblHalLineParserResultSDCard';
import GrblHalLineParserResultATCI from 'server/controllers/Grblhal/GrblHalLineParserResultATCI';
import GrblHalLineParserResultJSON from 'server/controllers/Grblhal/GrblHalLineParserResultJSON';
import GrblHalErrorDescription from './GrblHalErrorDescription';

const log = logger('controller:grblHAL');

class GrblHalRunner extends events.EventEmitter {
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
            sdFiles: [],
            alarmCode: '',
            subState: '',
            probeActive: false,
            pinState: {},
            currentTool: -1,
            hasHomed: false
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

        },
        axes: {
            count: 0,
            axes: []
        },
        sdcard: {
            mounted: false,
            files: []
        }
    };

    settings = {
        version: {
            version: '',
            semver: -1
        },
        parameters: {
        },
        settings: {
        },
        groups: {
        },
        info: {
        },
        descriptions: {
        },
        alarms: {},
        errors: {},
        toolTable: {},
        atci: {}
    };

    parser = new GrblHalLineParser();

    parse(data) {
        data = ('' + data).replace(/\s+$/, '');
        if (!data) {
            log.warn('Empty result parsed from GrlbHalLineParser');
            return;
        }

        this.emit('raw', { raw: data });

        const result = this.parser.parse(data) || {};
        const { type, payload } = result;
        const { raw } = payload;

        if (type === GrblHalLineParserResultStatus) {
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
        if (type === GrblHalLineParserResultATCI) {
            const nextSettings = {
                ...this.settings,
                atci: {
                    ...this.settings.atci,
                    ...payload.values
                }
            };
            if (!_.isEqual(this.settings.atci, nextSettings.atci)) {
                this.settings = nextSettings;
            }

            this.emit('atci', payload);
            return;
        }
        if (type === GrblHalLineParserResultStartup) {
            this.emit('startup', payload);
            //this.emit('startup', payload, this.settings.version.semver);
            return;
        }
        if (type === GrblHalLineParserResultCompleteStatus) {
            delete payload.raw;

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

            if (payload.activeState === GRBL_HAL_ACTIVE_STATE_ALARM && payload.subState) {
                payload.alarmCode = Number(payload.subState);
            }

            const nextState = {
                ...this.state,
                status: {
                    ...this.state.status,
                    ...payload
                }
            };

            if (!_.isEqual(this.state.status, nextState.status)) {
                this.state = nextState; // enforce change
            }
            this.emit('status', payload);
            return;
        }
        if (type === GrblHalLineParserResultOk) {
            this.emit('ok', payload);
            return;
        }
        if (type === GrblHalLineParserResultError) {
            // https://nodejs.org/api/events.html#events_error_events
            // As a best practice, listeners should always be added for the 'error' events.
            this.emit('error', payload);
            return;
        }
        if (type === GrblHalLineParserResultSpindle) {
            this.emit('spindle', payload);
            return;
        }
        if (type === GrblHalLineParserResultJSON) {
            this.emit('json', payload);
            return;
        }
        if (type === GrblHalLineParserResultAlarm) {
            const nextState = {
                ...this.state,
                status: {
                    ...this.state.status,
                    activeState: GRBL_HAL_ACTIVE_STATE_ALARM,
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
        if (type === GrbHalLineParserResultParserState) {
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
                    tool: tool,
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
        if (type === GrblHalLineParserResultTool) {
            delete payload.raw;
            const nextSettings = {
                ...this.settings,
                toolTable: {
                    ...this.settings.toolTable,
                    [payload.id]: payload
                }
            };
            if (!_.isEqual(this.settings.toolTable, nextSettings.toolTable)) {
                this.settings = nextSettings;
            }
            return;
        }
        if (type === GrblHalLineParserResultParameters) {
            const { name, value } = payload;
            // Update tool offsets for current tool based on PRB results
            // This is necessary in order to update offsets mid tool change or toolpath
            // Ignore prb output for tool 0 (empty) since nothing to update
            const currentTool = this.state.status.currentTool;
            if (name === 'PRB' && currentTool > 0) {
                const nextSettings = {
                    ...this.settings,
                    toolTable: {
                        ...this.settings.toolTable,
                        [currentTool]: {
                            ...this.settings.toolTable[currentTool],
                            toolOffsets: {
                                ...this.settings.toolTable[currentTool].toolOffsets,
                                x: Number(value.x),
                                y: Number(value.y),
                                z: Number(value.z)
                            }
                        }
                    }
                };

                if (!_.isEqual(this.settings.toolTable, nextSettings.toolTable)) {
                    this.settings = nextSettings;
                }
            }
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
        if (type === GrblHalLineParserResultAXS) {
            this.state.axes = {
                count: payload.count,
                axes: payload.axes
            };
            return;
        }
        if (type === GrblHalLineParserResultAlarmDetails) {
            this.settings.alarms[payload.id] = {
                description: payload.description,
                id: payload.id
            };

            this.emit('alarmDetail', this.settings.alarms);
            return;
        }
        if (type === GrblHalErrorDescription) {
            this.settings.errors[payload.code] = {
                code: payload.code,
                description: payload.description
            };
            this.emit('errorDescription', this.settings.errors);
            return;
        }
        if (type === GrblHalLineParserResultGroupDetail) {
            delete payload.raw;
            this.settings.groups[payload.group] = payload;
            this.emit('groupDetail', payload);
            return;
        }
        if (type === GrblHalLineParserResultFeedback) {
            this.emit('feedback', payload);
            return;
        }
        if (type === GrblHalLineParserResultSettings) {
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
        if (type === GrblHalLineParserResultVersion) {
            const { version } = payload;

            const parts = version.split('.');
            const last = parts[parts.length - 1].replace(':', '');
            const semver = Number(last);

            const nextSettings = { // enforce change
                ...this.settings,
                version: {
                    ...this.settings.version,
                    version,
                    semver
                }
            };
            if (!_.isEqual(this.settings.version, nextSettings.version)) {
                this.settings = nextSettings; // enforce change
            }
            // Should no longer need to do this here for redundancy
            this.emit('startup', payload, semver);
            return;
        }
        if (type === GrblHalLineParserResultCode) {
            const { code } = payload;
            const nextState = {
                ...this.state,
                status: {
                    ...this.state.status,
                    activeState: GRBL_HAL_ACTIVE_STATE_ALARM,
                    alarmCode: Number(code),
                    subState: Number(code)
                }
            };
            if (!_.isEqual(this.state.status, nextState.status)) {
                this.state = nextState; // enforce change
            }
            this.emit('alarm', payload);
        }
        if (type === GrblHalLineParserResultInfo) {
            const { name, value } = payload;
            const nextSettings = { // enforce change
                ...this.settings,
                info: {
                    ...this.settings.info,
                    [name]: value
                }
            };
            if (this.settings.info[name] !== nextSettings.info[name]) {
                this.settings = nextSettings; // enforce change
            }
            this.emit('info', payload);
            return;
        }
        if (type === GrblHalLineParserResultSettingDescription) {
            // Unset raw string and emit to UI
            _.unset(payload, 'raw');
            const { id, ...details } = payload;
            this.settings.descriptions = {
                ...this.settings.descriptions,
                [id]: details
            };
            this.emit('description', payload);
            return;
        }
        if (type === GrblHalLineParserResultSettingDetails) {
            // Unset raw string and emit to UI
            _.unset(payload, 'raw');
            const { id, unitString, details } = payload;

            this.settings.descriptions[payload.id] = {
                ...this.settings.descriptions[id],
                unitString,
                details
            };
            this.emit('description');
            return;
        }

        if (type === GrblHalLineParserResultSDCard) {
            this.emit('sdcard', payload);
            delete payload.raw;
            const files = [...this.state.sdcard.files].filter(file => file.name !== payload.name);
            files.push(payload);
            const nextState = {
                ...this.state,
                sdcard: {
                    ...this.state.sdcard,
                    files
                }
            };
            if (!_.isEqual(this.state.sdcard, nextState.sdcard)) {
                this.state = nextState;
            }

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

    getToolTable(settings = this.settings) {
        return _.get(settings, 'toolTable', {});
    }

    getParameters() {
        return _.get(this.settings, 'parameters', {});
    }

    getCurrentFeedrate(state = this.state) {
        const value = _.get(state, 'parserstate.feedrate');
        return `F${value}`;
    }

    isAlarm() {
        const activeState = _.get(this.state, 'status.activeState');
        return activeState === GRBL_HAL_ACTIVE_STATE_ALARM;
    }

    isCheck() {
        const activeState = _.get(this.state, 'status.activeState');
        return activeState === GRBL_HAL_ACTIVE_STATE_CHECK;
    }

    isIdle() {
        const activeState = _.get(this.state, 'status.activeState');
        return activeState === GRBL_HAL_ACTIVE_STATE_IDLE;
    }

    forceOK() {
        this.emit('ok', { raw: 'force ok' });
    }

    deleteSettings() {
        this.settings.settings = {};
    }

    hasSettings() {
        return !_.isEmpty(this.settings.settings);
    }

    hasAXS() {
        const axs = _.get(this.state, 'axes.axes', []);
        return !_.isEmpty(axs);
    }

    clearSDFiles() {
        this.state.sdcard.files = [];
    }

    clearSDStatus() {
        console.log('clearSDStatus');
        this.state.status.sdCard = false;
    }

    setSDStatus() {
        console.log('setSDStatus');
        this.state.status.sdCard = true;
    }
}

export default GrblHalRunner;
