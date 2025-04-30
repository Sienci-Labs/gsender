/* eslint-disable max-lines-per-function */
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

import ensureArray from 'ensure-array';
import * as parser from 'gcode-parser';
import _ from 'lodash';
import map from 'lodash/map';
import GcodeToolpath from '../../lib/GcodeToolpath';
// import SerialConnection from '../../lib/SerialConnection';
import EventTrigger from '../../lib/EventTrigger';
import Feeder from '../../lib/Feeder';
import ToolChanger from '../../lib/ToolChanger';
import Sender, { SP_TYPE_CHAR_COUNTING } from '../../lib/Sender';
import Workflow, {
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING
} from '../../lib/Workflow';
import delay from '../../lib/delay';
import ensurePositiveNumber from '../../lib/ensure-positive-number';
import evaluateAssignmentExpression from '../../lib/evaluate-assignment-expression';
import logger from '../../lib/logger';
import translateExpression from '../../lib/translate-expression';
import config from '../../services/configstore';
import monitor from '../../services/monitor';
import taskRunner from '../../services/taskrunner';
import store from '../../store';
import {
    GLOBAL_OBJECTS as globalObjects,
    WRITE_SOURCE_CLIENT,
    WRITE_SOURCE_FEEDER,
    A_AXIS_COMMANDS,
    Y_AXIS_COMMANDS
} from '../constants';
import GrblRunner from './GrblRunner';
import {
    GRBL,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_HOME,
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_REALTIME_COMMANDS,
    GRBL_ALARMS,
    GRBL_ERRORS,
    GRBL_SETTINGS
} from './constants';
import {
    METRIC_UNITS,
    PROGRAM_PAUSE,
    PROGRAM_RESUME,
    PROGRAM_START,
    PROGRAM_END,
    CONTROLLER_READY,
    FEED_HOLD,
    CYCLE_START,
    HOMING,
    SLEEP,
    MACRO_RUN,
    MACRO_LOAD,
    FILE_UNLOAD,
    FILE_TYPE,
    ALARM,
    ERROR
} from '../../../app_old/constants';
import { determineMachineZeroFlagSet, determineMaxMovement, getAxisMaximumLocation } from '../../lib/homing';
import { calcOverrides } from '../runOverride';
import { GCODE_TRANSLATION_TYPE, translateGcode } from '../../lib/gcode-translation';
// % commands
const WAIT = '%wait';
const PREHOOK_COMPLETE = '%pre_complete';
const POSTHOOK_COMPLETE = '%toolchange_complete';
const PAUSE_START = '%pause_start';

const log = logger('controller:Grbl');
const noop = _.noop;

class GrblController {
    type = GRBL;

    // CNCEngine
    engine = null;

    // Sockets
    sockets = {};

    // Connection
    connection = null;

    connectionEventListener = {
        data: (data) => {
            log.silly(`< ${data}`);
            this.runner.parse('' + data);
        },
        close: (err) => {
            this.ready = false;
            const received = this.sender?.state?.received;
            if (err) {
                log.warn(`Disconnected from serial port "${this.options.port}":`, err);
            }

            this.close(err => {
                // Remove controller from store
                const port = this.options.port;
                store.unset(`controllers[${JSON.stringify(port)}]`);

                // Destroy controller
                this.destroy();
            }, received);
        },
        error: (err) => {
            this.ready = false;
            if (err) {
                log.error(`Unexpected error while reading/writing serial port "${this.options.port}":`, err);
            }
        }
    };

    // Grbl
    controller = null;

    ready = false;

    initialized = false;

    state = {};

    settings = {};

    toolChangeContext = {};

    queryTimer = null;

    timePaused = null;

    waitingForStatus = false;

    actionMask = {
        queryParserState: {
            state: false, // wait for a message containing the current G-code parser modal state
            reply: false // wait for an `ok` or `error` response
        },
        queryStatusReport: false,

        // Respond to user input
        replyParserState: false, // $G
        replyStatusReport: false // ?
    };

    actionTime = {
        queryParserState: 0,
        queryStatusReport: 0,
        senderFinishTime: 0
    };

    // Event Trigger
    event = null;

    // Feeder
    feeder = null;

    feederCB = null;

    // Sender
    sender = null;

    timeout = null;

    forceOK = false;

    // Toolchange
    toolChanger = null;

    // Shared context
    sharedContext = {};

    // Workflow
    workflow = null;

    // Homing information
    homingStarted = false;

    homingFlagSet = false;

    // eslint-disable-next-line max-lines-per-function
    constructor(engine, connection, options) {
        if (!engine) {
            throw new Error('engine must be specified');
        }
        this.engine = engine;


        const { port, baudrate, rtscts } = { ...options };
        this.options = {
            ...this.options,
            port: port,
            baudrate: baudrate,
            rtscts: rtscts
        };

        // Connection
        this.connection = connection;

        this.connection.setWriteFilter((data) => {
            const line = data.trim();

            if (!line) {
                return data;
            }

            { // Grbl settings: $0-$255
                const r = line.match(/^(\$\d{1,3})=([\d\.]+)$/);
                if (r) {
                    const name = r[1];
                    const value = Number(r[2]);
                    if ((name === '$13') && (value >= 0) && (value <= 65535)) {
                        const nextSettings = {
                            ...this.runner.settings,
                            settings: {
                                ...this.runner.settings.settings,
                                [name]: value ? '1' : '0'
                            }
                        };
                        this.runner.settings = nextSettings; // enforce change
                    }
                }
            }
            return data.replace(/\([^\)]*\)/gm, '');
        });

        // Event Trigger
        this.event = new EventTrigger((event, trigger, commands) => {
            log.debug(`EventTrigger: event="${event}", trigger="${trigger}", commands="${commands}"`);
            if (trigger === 'system') {
                taskRunner.run(commands);
            } else {
                this.command('gcode', commands);
            }
        });

        // Feeder
        this.feeder = new Feeder({
            dataFilter: (line, context) => {
                let commentMatcher = /\s*;.*/g;
                let comment = line.match(commentMatcher);
                const commentString = (comment && comment[0].length > 0) ? comment[0].trim()
                    .replace(';', '') : '';
                line = line.replace(commentMatcher, '')
                    .trim();
                context = this.populateContext(context);

                if (line[0] === '%') {
                    // %wait
                    if (line === WAIT) {
                        log.debug('Wait for the planner to empty');
                        return 'G4 P0.5'; // dwell
                    }
                    if (line === PREHOOK_COMPLETE) {
                        log.debug('Finished Pre-hook');
                        this.feeder.hold({ data: '%toolchange' });
                        this.emit('toolchange:preHookComplete', commentString);
                        return 'G4 P0.5';
                    }
                    if (line === POSTHOOK_COMPLETE) {
                        log.debug('Finished toolchange, resuming program');
                        setTimeout(() => {
                            this.workflow.resume();
                        }, 500);
                        return 'G4 P0.5';
                    }
                    if (line === PAUSE_START) {
                        log.debug('Found M0/M1, pausing program');
                        this.emit('sender:M0M1', {
                            data: 'M0/M1',
                            comment: commentString
                        });
                        return 'G4 P0.5';
                    }
                    if (line === '%_GCODE_START') {
                        const { sent } = this.sender.state;
                        this.workflow.start();
                        // Feeder
                        this.feeder.reset();
                        // Sender (fast forward to sent which was set previous to this to account for rewind)
                        this.sender.setStartLine(sent);
                        this.sender.next({ startFromLine: true });
                        return '';
                    }

                    // Expression
                    // %_x=posx,_y=posy,_z=posz
                    evaluateAssignmentExpression(line.slice(1), context);
                    return '';
                }

                // line="G0 X[posx - 8] Y[ymax]"
                // > "G0 X2 Y50"
                line = translateExpression(line, context);
                const data = parser.parseLine(line, { flatten: true });
                const words = ensureArray(data.words);

                { // Program Mode: M0, M1
                    const programMode = _.intersection(words, ['M0', 'M1'])[0];
                    if (programMode === 'M0') {
                        log.debug('M0 Program Pause');
                        this.feeder.hold({
                            data: 'M0',
                            comment: commentString
                        }); // Hold reason
                    } else if (programMode === 'M1') {
                        log.debug('M1 Program Pause');
                        this.feeder.hold({
                            data: 'M1',
                            comment: commentString
                        }); // Hold reason
                    }
                }

                // More aggressive updating of spindle modals for safety
                const spindleCommand = _.intersection(words, ['M3', 'M4'])[0];
                if (spindleCommand) {
                    this.updateSpindleModal(spindleCommand);
                }

                // // M6 Tool Change
                //const passthroughM6 = store.get('preferences.toolChange.passthrough', false);
                const passthroughM6 = _.get(this.toolChangeContext, 'passthrough', false);
                if (_.includes(words, 'M6')) {
                    log.debug('M6 Tool Change');
                    this.feeder.hold({
                        data: 'M6',
                        comment: commentString
                    }); // Hold reason

                    if (!passthroughM6) {
                        line = line.replace('M6', '(M6)');
                    }
                }


                const containsACommand = A_AXIS_COMMANDS.test(line);
                const containsYCommand = Y_AXIS_COMMANDS.test(line);

                if (containsACommand && !containsYCommand) {
                    const isUsingImperialUnits = context.modal.units === 'G20';

                    line = translateGcode({
                        gcode: line,
                        from: 'A',
                        to: 'Y',
                        regex: A_AXIS_COMMANDS,
                        type: isUsingImperialUnits ? GCODE_TRANSLATION_TYPE.TO_IMPERIAL : GCODE_TRANSLATION_TYPE.DEFAULT
                    });
                }

                return line;
            }
        });
        this.feeder.on('data', (line = '', context = {}) => {
            if (this.isClose()) {
                log.error(`Serial port "${this.options.port}" is not accessible`);
                return;
            }

            // if (this.runner.isAlarm()) {
            //     this.feeder.reset();
            //     this.emit('workflow:state', this.workflow.state); // Propogate alarm code to UI
            //     log.warn('Stopped sending G-code commands in Alarm mode');
            //     return;
            // }

            line = String(line).trim();
            if (line.length === 0) {
                return;
            }

            this.emit('serialport:write', line + '\n', {
                ...context,
                source: WRITE_SOURCE_FEEDER
            });

            this.connection.write(line + '\n', {
                ...context,
                source: WRITE_SOURCE_FEEDER
            });
            log.silly(`> ${line}`);
        });
        this.feeder.on('hold', noop);
        this.feeder.on('unhold', noop);
        this.feeder.on('complete', () => {
            this.consumeFeederCB();
        });

        // Sender
        this.sender = new Sender(SP_TYPE_CHAR_COUNTING, {
            // Deduct the buffer size to prevent from buffer overrun
            bufferSize: (128 - 28), // The default buffer size is 128 bytes
            dataFilter: (line, context) => {
                // Remove comments that start with a semicolon `;`
                let commentMatcher = /\s*;.*/g;
                let bracketCommentLine = /\s*\(.*\)*\)/gm;
                let toolCommand = /(T)(-?\d*\.?\d+\.?)/;
                line = line.replace(bracketCommentLine, '').trim();
                let comment = line.match(commentMatcher);
                let commentString = (comment && comment[0].length > 0) ? comment[0].trim().replace(';', '') : '';
                line = line.replace(commentMatcher, '').trim();
                context = this.populateContext(context);

                const { sent, received } = this.sender.state;

                if (line[0] === '%') {
                    // %wait
                    if (line === WAIT) {
                        log.debug(`Wait for the planner to empty: line=${sent + 1}, sent=${sent}, received=${received}`);
                        this.sender.hold({ data: WAIT }); // Hold reason
                        return 'G4 P0.5'; // dwell
                    }

                    // Expression
                    // %_x=posx,_y=posy,_z=posz
                    evaluateAssignmentExpression(line.slice(1), context);
                    return '';
                }

                // line="G0 X[posx - 8] Y[ymax]"
                // > "G0 X2 Y50"
                line = translateExpression(line, context);
                const data = parser.parseLine(line, { flatten: true });
                const words = ensureArray(data.words);

                { // Program Mode: M0, M1
                    const programMode = _.intersection(words, ['M0', 'M1'])[0];
                    if (programMode === 'M0') {
                        log.debug(`M0 Program Pause: line=${sent + 1}, sent=${sent}, received=${received}`);
                        // Workaround for Carbide files - prevent M0 early from pausing program
                        if (sent > 10) {
                            this.workflow.pause({ data: 'M0', comment: commentString });
                            this.command('gcode', `${WAIT}\n${PAUSE_START} ;${commentString}`);
                        }
                        line = line.replace('M0', '(M0)');
                    } else if (programMode === 'M1') {
                        log.debug(`M1 Program Pause: line=${sent + 1}, sent=${sent}, received=${received}`);
                        this.workflow.pause({ data: 'M1', comment: commentString });
                        this.command('gcode', `${WAIT}\n${PAUSE_START} ;${commentString}`);
                        line = line.replace('M1', '(M1)');
                    }
                }

                // More aggressive updating of spindle modals for safety
                const spindleCommand = _.intersection(words, ['M3', 'M4'])[0];
                if (spindleCommand) {
                    this.updateSpindleModal(spindleCommand);
                }

                /* Emit event to UI for toolchange handler */
                if (_.includes(words, 'M6')) {
                    log.debug(`M6 Tool Change: line=${sent + 1}, sent=${sent}, received=${received}`);

                    // No toolchange in check mode
                    const currentState = _.get(this.state, 'status.activeState', '');
                    if (currentState === 'Check') {
                        return line.replace('M6', '(M6)');
                    }

                    const { toolChangeOption } = this.toolChangeContext;

                    let tool = line.match(toolCommand);

                    // Handle specific cases for macro and pause, ignore is default and comments line out with no other action
                    if (toolChangeOption !== 'Ignore') {
                        if (tool) {
                            commentString = `(${tool?.[0]}) ` + commentString;
                        }
                        this.workflow.pause({ data: 'M6', comment: commentString });

                        if (toolChangeOption === 'Code') {
                            this.emit('toolchange:start');
                            this.runPreChangeHook(commentString);
                        } else {
                            const count = this.sender.incrementToolChanges();

                            setTimeout(() => {
                                // Emit the current state so latest tool info is available
                                this.runner.setTool(tool?.[2]); // set tool in runner state
                                this.emit('controller:state', GRBL, this.state, tool?.[2]); // set tool in redux
                                this.emit('gcode:toolChange', {
                                    line: sent + 1,
                                    count,
                                    block: line,
                                    tool: tool,
                                    option: toolChangeOption
                                }, commentString);
                            }, 500);
                        }
                    }

                    //const passthroughM6 = store.get('preferences.toolChange.passthrough', false);
                    const passthroughM6 = _.get(this.toolChangeContext, 'passthrough', false);
                    if (!passthroughM6) {
                        line = line.replace('M6', '(M6)');
                    }
                    //line = line.replace(`${tool?.[0]}`, `(${tool?.[0]})`);
                }

                /**
                 * Rotary Logic
                 * Need to change the A-axis movements to Y-movements to emulate the rotary axis on grbl
                 */
                const containsACommand = A_AXIS_COMMANDS.test(line);
                const containsYCommand = Y_AXIS_COMMANDS.test(line);

                if (containsACommand && !containsYCommand) {
                    const isUsingImperialUnits = context.modal.units === 'G20';

                    line = translateGcode({
                        gcode: line,
                        from: 'A',
                        to: 'Y',
                        regex: A_AXIS_COMMANDS,
                        type: isUsingImperialUnits ? GCODE_TRANSLATION_TYPE.TO_IMPERIAL : GCODE_TRANSLATION_TYPE.DEFAULT
                    });
                }
                /**
                 * End of Rotary Logic
                 */

                return line;
            }
        });
        this.sender.on('data', (line = '', context = {}) => {
            if (this.isClose()) {
                log.error(`Serial port "${this.options.port}" is not accessible`);
                return;
            }

            line = String(line).trim();
            if (line.length === 0) {
                log.warn(`Expected non-empty line: N=${this.sender.state.sent}`);
                return;
            }

            this.emit('serialport:read', line);

            this.write(line + '\n');
            log.silly(`> ${line}`);
        });
        this.sender.on('hold', noop);
        this.sender.on('unhold', noop);
        this.sender.on('start', (startTime) => {
            this.actionTime.senderFinishTime = 0;
        });

        this.sender.on('end', (finishTime) => {
            this.actionTime.senderFinishTime = finishTime;
        });
        this.sender.on('requestData', () => {
            this.emit('requestEstimateData');
        });

        // Workflow
        this.workflow = new Workflow();
        this.workflow.on('start', (...args) => {
            this.emit('workflow:state', this.workflow.state);
            this.sender.rewind();
            this.sender.resumeCountdown();
        });
        this.workflow.on('stop', (...args) => {
            this.emit('workflow:state', this.workflow.state);
            this.sender.rewind();
            this.sender.stopCountdown();
        });
        this.workflow.on('pause', (...args) => {
            this.emit('workflow:state', this.workflow.state);

            if (args.length > 0) {
                const reason = { ...args[0] };
                this.sender.hold(reason); // Hold reason
            } else {
                this.sender.hold();
            }

            this.timePaused = new Date().getTime();
            this.sender.pauseCountdown();
        });
        this.workflow.on('resume', (...args) => {
            this.emit('workflow:state', this.workflow.state);

            let pauseTime = new Date().getTime() - this.timePaused;

            // Reset feeder prior to resume program execution
            this.feeder.reset();

            // Resume program execution
            this.sender.unhold();

            this.sender.resumeCountdown();

            // subtract time paused
            this.sender.next({ timePaused: pauseTime });
        });

        // Grbl
        this.runner = new GrblRunner();

        this.runner.on('raw', (data) => {
            const { raw } = data;
            if (raw) {
                this.ready = true;
                this.waitingForStatus = false;
            }
        });

        this.runner.on('status', (res) => {
            if (this.homingStarted) {
                this.homingFlagSet = determineMachineZeroFlagSet(res, this.settings);
                this.emit('homing:flag', this.homingFlagSet);
                this.homingStarted = false;
            }

            this.actionMask.queryStatusReport = false;

            if (this.actionMask.replyStatusReport) {
                this.actionMask.replyStatusReport = false;
                this.emit('serialport:read', res.raw);
            }

            if (this.waitingForStatus) {
                this.ready = true;
                this.waitingForStatus = false;
                if (res.activeState === GRBL_ACTIVE_STATE_ALARM) {
                    log.debug('System is alarm locked. Soft resetting');
                    this.write('\x18');
                } else {
                    log.debug('Status found. Getting version info');
                    this.write('$I');
                }
            }

            // Check if the receive buffer is available in the status report
            const rx = Number(_.get(res, 'buf.rx', 0)) || 0;
            if (rx > 0) {
                // Do not modify the buffer size when running a G-code program
                if (this.workflow.state !== WORKFLOW_STATE_IDLE) {
                    return;
                }

                // Check if the streaming protocol is character-counting streaming protocol
                if (this.sender.sp.type !== SP_TYPE_CHAR_COUNTING) {
                    return;
                }

                // Check if the queue is empty
                if (this.sender.sp.dataLength !== 0) {
                    return;
                }

                // Deduct the receive buffer length to prevent from buffer overrun
                const bufferSize = (rx - 8); // TODO
                if (bufferSize > this.sender.sp.bufferSize) {
                    this.sender.sp.bufferSize = bufferSize;
                }
            }
        });

        this.runner.on('ok', (res) => {
            if (this.actionMask.queryParserState.reply) {
                if (this.actionMask.replyParserState) {
                    this.actionMask.replyParserState = false;
                    this.emit('serialport:read', res.raw);
                }
                this.actionMask.queryParserState.reply = false;

                if (this.forceOK) {
                    this.forceOK = false;
                    this.runner.forceOK();
                }
                return;
            }

            const { hold, sent, received } = this.sender.state;
            if (this.workflow.state === WORKFLOW_STATE_RUNNING) {
                this.emit('serialport:read', res.raw);
                if (hold && (received + 1 >= sent)) {
                    log.debug(`Continue sending G-code: hold=${hold}, sent=${sent}, received=${received + 1}`);
                    this.sender.unhold();
                }
                this.sender.ack();
                this.sender.next({ isOk: true });
                return;
            }

            if ((this.workflow.state === WORKFLOW_STATE_PAUSED) && (received < sent)) {
                this.emit('serialport:read', res.raw);
                if (!hold) {
                    log.error('The sender does not hold off during the paused state');
                }
                if (received + 1 >= sent) {
                    log.debug(`Stop sending G-code: hold=${hold}, sent=${sent}, received=${received + 1}`);
                }
                this.sender.ack();
                this.sender.next({ isOk: true });
                return;
            }

            this.emit('serialport:read', res.raw);

            // Feeder
            this.feeder.ack();
            this.feeder.next();
        });

        this.runner.on('error', (res) => {
            const code = Number(res.message) || undefined;
            const error = _.find(GRBL_ERRORS, { code: code });

            log.error(`Error occurred at ${Date.now()}`);

            const { lines, received, name } = this.sender.state;
            const { outstanding } = this.feeder.state;
            const isFileError = lines.length !== 0;
            //Check error origin
            let errorOrigin = '';
            let line = '';

            if (store.get('inAppConsoleInput')) {
                line = store.get('inAppConsoleInput') || '';
                store.set('inAppConsoleInput', null);
                errorOrigin = 'Console';
            } else if (outstanding > 0) {
                errorOrigin = 'Feeder';
                line = 'N/A';
            } else if (isFileError) {
                errorOrigin = name;
                line = lines[received] || '';
            } else {
                errorOrigin = 'Feeder';
                line = 'N/A';
            }

            this.emit('error', {
                type: ERROR,
                code: `${code}`,
                description: _.get(error, 'description', ''),
                line: line,
                lineNumber: isFileError ? received + 1 : '',
                origin: errorOrigin,
                controller: GRBL,
            });

            if (this.workflow.state === WORKFLOW_STATE_RUNNING || this.workflow.state === WORKFLOW_STATE_PAUSED) {
                const { lines, received } = this.sender.state;
                const line = lines[received] || '';

                const preferences = store.get('preferences') || { showLineWarnings: false };
                this.emit('serialport:read', `error:${code} (${error?.message})`);

                if (error) {
                    if (preferences.showLineWarnings === false) {
                        const msg = `Error ${code} on line ${received + 1} - ${error.message}`;
                        this.emit('gcode_error', msg);
                        this.workflow.pause({ err: `error:${code} (${error.message})` });
                    }

                    if (preferences.showLineWarnings) {
                        this.workflow.pause({ err: `error:${code} (${error.message})` });
                        this.emit('workflow:state', this.workflow.state, { validLine: false, line: `${lines.length} ${line}` });
                    }
                } else {
                    this.emit('serialport:read', res.raw);
                }
                this.sender.ack();
                this.sender.next();

                return;
            }

            if (error) {
                // Grbl v1.1
                this.emit('serialport:read', `error:${code} (${error.message})`);
            } else {
                // Grbl v0.9
                this.emit('serialport:read', res.raw);
            }

            // Feeder
            this.feeder.ack();
            this.feeder.next();
        });

        this.runner.on('alarm', (res) => {
            const code = Number(res.message) || undefined;
            const alarm = _.find(GRBL_ALARMS, { code: code });

            const { lines, received, name } = this.sender.state;
            const { outstanding } = this.feeder.state;
            const isFileError = lines.length !== 0;
            //Check error origin
            let errorOrigin = '';
            let line = '';

            if (store.get('inAppConsoleInput')) {
                line = store.get('inAppConsoleInput') || '';
                store.set('inAppConsoleInput', null);
                errorOrigin = 'Console';
            } else if (this.state.status.activeState === GRBL_ACTIVE_STATE_HOME) {
                errorOrigin = 'Console';
                line = '$H';
            } else if (outstanding > 0) {
                errorOrigin = 'Feeder';
                line = 'N/A';
            } else if (isFileError) {
                errorOrigin = name;
                line = lines[received] || '';
            } else {
                errorOrigin = 'Feeder';
                line = 'N/A';
            }

            if (alarm) {
                // Grbl v1.1
                this.emit('serialport:read', `ALARM:${code} (${alarm.message})`);
                this.emit('error', {
                    type: ALARM,
                    code: code,
                    description: alarm.description,
                    line: line,
                    lineNumber: isFileError ? received + 1 : '',
                    origin: errorOrigin,
                    controller: GRBL
                });
                // Force propogation of current state on alarm
                this.state = this.runner.state;

                this.emit('controller:state', GRBL, this.state);
            } else {
                // Grbl v0.9
                this.emit('serialport:read', res.raw);
            }
        });

        this.runner.on('parserstate', (res) => {
            //finished searching gCode file for errors
            if (this.sender.state.finishTime > 0 && this.sender.state.sent > 0 && this.runner.state.status.activeState === 'Check') {
                this.command('gcode', ['$C', '[global.state.testWCS]']);
                this.workflow.stopTesting();
                this.emit('gcode_error_checking_file', this.sender.state, 'finished');
                return;
            }


            this.actionMask.queryParserState.state = false;
            this.actionMask.queryParserState.reply = true;

            if (this.actionMask.replyParserState) {
                this.emit('serialport:read', res.raw);
            }
        });

        this.runner.on('parameters', (res) => {
            this.emit('serialport:read', res.raw);
        });

        this.runner.on('feedback', (res) => {
            this.emit('serialport:read', res.raw);
        });

        this.runner.on('settings', (res) => {
            const setting = _.find(GRBL_SETTINGS, { setting: res.name });

            if (!res.message && setting) {
                // Grbl v1.1
                this.emit('serialport:read', `${res.name}=${res.value} (${setting.message}, ${setting.units})`);
            } else {
                // Grbl v0.9
                this.emit('serialport:read', res.raw);
            }
        });

        this.runner.on('startup', (res) => {
            this.emit('serialport:read', res.raw);

            // The startup message always prints upon startup, after a reset, or at program end.
            // Setting the initial state when Grbl has completed re-initializing all systems.
            this.clearActionValues();

            // Set ready flag to true when a startup message has arrived
            this.ready = true;

            // Clear sender - for physical buttons
            //this.sender.unload();

            if (!this.initialized) {
                this.initialized = true;

                // Initialize controller
                this.initController();
            }
        });

        this.runner.on('others', (res) => {
            this.emit('serialport:read', res.raw);
        });

        this.toolChanger = new ToolChanger({
            isIdle: () => {
                if (!this.runner) {
                    return false;
                }
                return this.runner.isIdle();
            },
            intervalTimer: 200
        });

        const queryStatusReport = () => {
            // Check the ready flag
            if (!(this.ready)) {
                return;
            }

            const now = new Date().getTime();

            // The status report query (?) is a realtime command, it does not consume the receive buffer.
            const lastQueryTime = this.actionTime.queryStatusReport;
            if (lastQueryTime > 0) {
                const timespan = Math.abs(now - lastQueryTime);
                const toleranceTime = 5000; // 5 seconds

                // Check if it has not been updated for a long time
                if (timespan >= toleranceTime) {
                    log.debug(`Continue status report query: timespan=${timespan}ms`);
                    this.actionMask.queryStatusReport = false;
                }
            }

            if (this.actionMask.queryStatusReport) {
                return;
            }

            if (this.isOpen()) {
                this.actionMask.queryStatusReport = true;
                this.actionTime.queryStatusReport = now;
                this.connection.writeImmediate('?');
            }
        };

        const queryParserState = _.throttle(() => {
            // Check the ready flag
            if (!(this.ready)) {
                return;
            }

            const now = new Date().getTime();

            // Do not force query parser state ($G) when running a G-code program,
            // it will consume 3 bytes from the receive buffer in each time period.
            if ((this.workflow.state === WORKFLOW_STATE_IDLE) && this.runner.isIdle()) {
                const lastQueryTime = this.actionTime.queryParserState;
                if (lastQueryTime > 0) {
                    const timespan = Math.abs(now - lastQueryTime);
                    const toleranceTime = 10000; // 10 seconds

                    // Check if it has not been updated for a long time
                    if (timespan >= toleranceTime) {
                        log.debug(`Continue parser state query: timespan=${timespan}ms`);
                        this.actionMask.queryParserState.state = false;
                        this.actionMask.queryParserState.reply = false;
                    }
                }
            }

            if (this.actionMask.queryParserState.state || this.actionMask.queryParserState.reply) {
                return;
            }

            if (this.isOpen()) {
                this.actionMask.queryParserState.state = true;
                this.actionMask.queryParserState.reply = false;
                this.actionTime.queryParserState = now;
                this.connection.writeImmediate('$G\n');
            }
        }, 500);

        this.queryTimer = setInterval(() => {
            if (this.isClose()) {
                // Serial port is closed
                return;
            }

            // Feeder
            if (this.feeder.peek()) {
                this.emit('feeder:status', this.feeder.toJSON());
            }

            // Sender
            if (this.sender.peek()) {
                this.emit('sender:status', this.sender.toJSON());
            }

            const zeroOffset = _.isEqual(
                this.runner.getWorkPosition(this.state),
                this.runner.getWorkPosition(this.runner.state)
            );

            // Grbl settings
            if (this.settings !== this.runner.settings) {
                this.settings = this.runner.settings;
                this.emit('controller:settings', GRBL, this.settings);
                this.emit('Grbl:settings', this.settings); // Backward compatibility
            }

            // Grbl state
            if (this.state !== this.runner.state) {
                this.state = this.runner.state;
                this.emit('controller:state', GRBL, this.state);
                this.emit('Grbl:state', this.state); // Backward compatibility
            }

            // Check the ready flag
            if (!(this.ready)) {
                return;
            }

            // ? - Status Report
            queryStatusReport();

            // $G - Parser State
            queryParserState();

            // Check if the machine has stopped movement after completion
            if (this.actionTime.senderFinishTime > 0) {
                const machineIdle = zeroOffset && this.runner.isIdle();
                const now = new Date().getTime();
                const timespan = Math.abs(now - this.actionTime.senderFinishTime);
                const toleranceTime = 500; // in milliseconds

                if (!machineIdle) {
                    // Extend the sender finish time
                    this.actionTime.senderFinishTime = now;
                } else if (timespan > toleranceTime) {
                    log.silly(`Finished sending G-code: timespan=${timespan}`);
                    this.actionTime.senderFinishTime = 0;
                    // Stop workflow
                    this.command('gcode:stop');
                }
            }
        }, 250);
        // Load file if it exists in CNC engine (AKA it was loaded before connection
    }

    async initController() {
        // $13=0 (report in mm)
        // $13=1 (report in inches)
        this.writeln('$$');
        await delay(50);
        this.event.trigger(CONTROLLER_READY);
    }

    populateContext(context = {}) {
        // Machine position
        const {
            x: mposx,
            y: mposy,
            z: mposz,
            a: mposa,
            b: mposb,
            c: mposc
        } = this.runner.getMachinePosition();

        // Work position
        const {
            x: posx,
            y: posy,
            z: posz,
            a: posa,
            b: posb,
            c: posc
        } = this.runner.getWorkPosition();

        // Modal group
        const modal = this.runner.getModalGroup();

        // Tool
        const tool = this.runner.getTool();

        // G-code parameters
        const parameters = this.runner.getParameters();

        // Program feedrate
        const programFeedrate = this.runner.getCurrentFeedrate();

        return Object.assign(context || {}, {
            // User-defined global variables
            global: this.sharedContext,

            // Bounding box
            xmin: Number(context.xmin) || 0,
            xmax: Number(context.xmax) || 0,
            ymin: Number(context.ymin) || 0,
            ymax: Number(context.ymax) || 0,
            zmin: Number(context.zmin) || 0,
            zmax: Number(context.zmax) || 0,

            // Machine position
            mposx: Number(mposx).toFixed(3) || 0,
            mposy: Number(mposy).toFixed(3) || 0,
            mposz: Number(mposz).toFixed(3) || 0,
            mposa: Number(mposa).toFixed(3) || 0,
            mposb: Number(mposb).toFixed(3) || 0,
            mposc: Number(mposc).toFixed(3) || 0,

            // Work position
            posx: Number(posx).toFixed(3) || 0,
            posy: Number(posy).toFixed(3) || 0,
            posz: Number(posz).toFixed(3) || 0,
            posa: Number(posa).toFixed(3) || 0,
            posb: Number(posb).toFixed(3) || 0,
            posc: Number(posc).toFixed(3) || 0,

            // Modal group
            modal: {
                motion: modal.motion,
                wcs: modal.wcs,
                plane: modal.plane,
                units: modal.units,
                distance: modal.distance,
                feedrate: modal.feedrate,
                program: modal.program,
                spindle: modal.spindle,
                // M7 and M8 may be active at the same time, but a modal group violation might occur when issuing M7 and M8 together on the same line. Using the new line character (\n) to separate lines can avoid this issue.
                coolant: ensureArray(modal.coolant).join('\n'),
            },


            // Tool
            tool: Number(tool) || 0,

            // G-code parameters
            params: parameters,

            // Program Feedrate
            programFeedrate: programFeedrate,

            // Global objects
            ...globalObjects,
        });
    }

    clearActionValues() {
        this.actionMask.queryParserState.state = false;
        this.actionMask.queryParserState.reply = false;
        this.actionMask.queryStatusReport = false;
        this.actionMask.replyParserState = false;
        this.actionMask.replyStatusReport = false;
        this.actionTime.queryParserState = 0;
        this.actionTime.queryStatusReport = 0;
        this.actionTime.senderFinishTime = 0;
    }

    destroy() {
        if (this.queryTimer) {
            clearInterval(this.queryTimer);
            this.queryTimer = null;
        }

        if (this.toolChanger) {
            this.toolChanger.clearInterval();
        }

        if (this.runner) {
            this.runner.removeAllListeners();
            this.runner = null;
        }

        this.sockets = {};

        if (this.connection) {
            this.connection = null;
        }

        if (this.event) {
            this.event = null;
        }

        if (this.feeder) {
            this.feeder = null;
        }

        if (this.sender) {
            this.sender = null;
        }

        if (this.workflow) {
            this.workflow = null;
        }
    }

    get status() {
        return {
            port: this.options.port,
            baudrate: this.options.baudrate,
            rtscts: this.options.rtscts,
            sockets: Object.keys(this.sockets),
            ready: this.ready,
            controller: {
                type: this.type,
                settings: this.settings,
                state: this.state
            },
            feeder: this.feeder.toJSON(),
            sender: this.sender.toJSON(),
            workflow: {
                state: this.workflow.state
            }
        };
    }

    open(port, baudrate, refresh, callback = noop) {
        if (!refresh) {
            this.connection.on('data', this.connectionEventListener.data);
            this.connection.on('close', this.connectionEventListener.close);
            this.connection.on('error', this.connectionEventListener.error);
        }

        callback(); // register controller

        // log.debug(`Connected to serial port "${port}"`);
        this.workflow.stop();

        // Clear action values
        this.clearActionValues();

        // set timeout to wait for connection
        this.waitForInfo();
    }

    waitForInfo() {
        // We need to query version after waiting for connection, so wait 0.5 seconds and query $I
        // We set controller ready if version found
        setTimeout(() => {
            if (!this.ready && this.connection) {
                this.write('\x18');
            }
        }, 500);
    }

    close(callback, received) {
        const { port } = this.options;

        // Assertion check
        if (!this.connection) {
            const err = `Serial port "${port}" is not available`;
            callback(new Error(err));
            return;
        }

        // Stop status query
        this.ready = false;

        // Clear initialized flag
        this.initialized = false;

        this.emit('serialport:closeController', {
            port: port,
            inuse: false,
        }, received);

        if (this.isClose()) {
            callback(null);
            return;
        }

        callback(null);
    }

    isOpen() {
        return this.connection && this.connection.isOpen;
    }

    isClose() {
        return !(this.isOpen());
    }

    loadFile(gcode, meta) {
        log.debug(`Loading file '${meta.name}' to controller`);
        this.command('gcode:load', meta, gcode);
    }

    addConnection(socket) {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        if (!_.isEmpty(this.settings)) {
            // controller settings
            socket.emit('controller:settings', GRBL, this.settings);
            socket.emit('Grbl:settings', this.settings); // Backward compatibility
        }
        if (!_.isEmpty(this.state)) {
            // controller state
            socket.emit('controller:state', GRBL, this.state);
            socket.emit('Grbl:state', this.state); // Backward compatibility
        }
        if (this.feeder) {
            // feeder status
            socket.emit('feeder:status', this.feeder.toJSON());
        }
        if (this.sender) {
            // sender status
            socket.emit('sender:status', this.sender.toJSON());
            log.info('Emitting Sender');
        }
        if (this.workflow) {
            // workflow state
            socket.emit('workflow:state', this.workflow.state);
        }
    }

    emit(eventName, ...args) {
        this.connection.emitToSockets(eventName, ...args);
    }

    consumeFeederCB() {
        if (this.feederCB && typeof this.feederCB === 'function') {
            this.feederCB();
            this.feederCB = null;
        }
    }

    // eslint-disable-next-line max-lines-per-function
    command(cmd, ...args) {
        const handler = {
            'firmware:recievedProfiles': () => {
                let [files] = args;
                this.emit('task:finish', files);
            },
            'firmware:grabMachineProfile': () => {
                const machineProfile = store.get('machineProfile');
                this.emit('sender:status', machineProfile);
            },
            'gcode:load': () => {
                let [meta, gcode, context = {}, callback = noop] = args;
                const { name } = meta;
                const bracketCommentLine = /\([^\)]*\)/gm;

                if (typeof context === 'function') {
                    callback = context;
                    context = {};
                }

                // G4 P0 or P with a very small value will empty the planner queue and then
                // respond with an ok when the dwell is complete. At that instant, there will
                // be no queued motions, as long as no more commands were sent after the G4.
                // This is the fastest way to do it without having to check the status reports.
                const dwell = '%wait ; Wait for the planner to empty';

                // add delay to spindle startup if enabled
                const preferences = store.get('preferences', {});
                const delay = _.get(preferences, 'spindleDelay', 0);

                // test if there is a G4 command already
                const delayRegex = new RegExp('(G4 ?P?[0-9]+)');
                // only add one if there isn't
                if (Number(delay) && !delayRegex.test(gcode)) {
                    gcode = gcode.replace(/\b(?:S\d* ?M[34]|M[34] ?S\d*)\b/g, `$& G4 P${delay}`);
                }

                const gcodeWithoutComments = gcode.replace(bracketCommentLine, '');

                const containsACommand = A_AXIS_COMMANDS.test(gcodeWithoutComments);
                const containsYCommand = Y_AXIS_COMMANDS.test(gcodeWithoutComments);

                if (containsACommand && containsYCommand) {
                    this.emit('filetype', FILE_TYPE.FOUR_AXIS);
                } else if (containsACommand) {
                    this.emit('filetype', FILE_TYPE.ROTARY);
                }

                const ok = this.sender.load(name, gcode + '\n' + dwell, context);
                if (!ok) {
                    callback(new Error(`Invalid G-code: name=${name}`));
                    return;
                }

                log.debug(`Load G-code: name="${this.sender.state.name}", size=${this.sender.state.gcode.length}, total=${this.sender.state.total}`);

                this.workflow.stop();

                callback(null, this.sender.toJSON());
            },
            'gcode:unload': () => {
                this.workflow.stop();
                this.engine.unload();

                // Sender
                this.sender.unload();

                this.emit('file:unload');
                this.event.trigger(FILE_UNLOAD);
            },
            'start': () => {
                log.warn(`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`);
                this.command('gcode:start');
            },
            'gcode:start': () => {
                const [lineToStartFrom, zMax, safeHeight = 10] = args;
                const totalLines = this.sender.state.total;
                const startEventEnabled = this.event.hasEnabledEvent(PROGRAM_START);
                log.info(startEventEnabled);
                this.emit('job:start');

                if (lineToStartFrom && lineToStartFrom <= totalLines) {
                    const { lines = [] } = this.sender.state;
                    const firstHalf = lines.slice(0, lineToStartFrom);
                    let feedFound = false;
                    let feedRate = 200;
                    let spindleRate = 0;

                    const getWordValue = (token, words) => {
                        for (let wordPair of words) {
                            const [word, value] = wordPair;
                            if (word === token) {
                                return value;
                            }
                        }
                        return 0;
                    };

                    const toolpath = new GcodeToolpath();
                    toolpath.loadFromStringSync(firstHalf.join('\n'), (data) => {
                        const { words, line } = data;
                        if (line.includes('F')) {
                            feedRate = getWordValue('F', words);
                            feedFound = true;
                        }
                        if (line.includes('S')) {
                            spindleRate = getWordValue('S', words);
                        }
                    });

                    const modal = toolpath.getModal();
                    const position = toolpath.getPosition();

                    const coolant = {
                        mist: '',
                        flood: '',
                    };

                    const hasSpindle = modal.spindle !== 'M5';

                    if (modal.coolant) {
                        if (modal.coolant.includes('M7')) {
                            coolant.mist = 'M7';
                        }
                        if (modal.coolant.includes('M8')) {
                            coolant.flood = 'M8';
                        }
                    }

                    const {
                        x: xVal,
                        y: yVal,
                        z: zVal,
                        a: aVal
                    } = position;

                    const modalGCode = [];
                    if (!feedFound) {
                        feedRate = modal.units === 'G21' ? 200 : 8;
                    }

                    const wcs = _.get(this.state, 'parserstate.modal.wcs', 'G54');
                    let modalWcs = modal.wcs;
                    if (modalWcs !== wcs && modalWcs !== 'G54') {
                        modalWcs = wcs;
                    }

                    // Move up and then to cut start position
                    modalGCode.push(this.event.getEventCode(PROGRAM_START));
                    modalGCode.push(`G0 G90 G21 Z${zMax + safeHeight}`);
                    if (hasSpindle) {
                        modalGCode.push(`${modal.spindle} F${feedRate} S${spindleRate}`);
                    }
                    modalGCode.push(`G0 G90 G21 X${xVal.toFixed(3)} Y${yVal.toFixed(3)}`);
                    if (aVal) {
                        modalGCode.push(`G0 G90 G21 A${(Number(aVal) % 360).toFixed(3)}`);
                    }
                    modalGCode.push(`G0 G90 G21 Z${zVal.toFixed(3)}`);
                    // Set modals based on what's parsed so far in the file
                    modalGCode.push(`${modal.units} ${modal.distance} ${modal.arc} ${modalWcs} ${modal.plane} ${coolant.flood} ${coolant.mist}`);
                    modalGCode.push(`${modal.motion}`);
                    modalGCode.push('G4 P1');
                    modalGCode.push('%_GCODE_START');

                    // Fast forward sender to line
                    this.sender.setStartLine(lineToStartFrom);

                    this.command('gcode', modalGCode);
                } else if (startEventEnabled) {
                    this.feederCB = () => {
                        // Feeder
                        this.feeder.reset();
                        this.workflow.start();
                        // Sender
                        this.sender.next();
                        this.feederCB = null;
                    };
                    this.event.trigger(PROGRAM_START);
                } else {
                    this.workflow.start();

                    // Feeder
                    this.feeder.reset();

                    // Sender
                    this.sender.setStartLine(0);
                    this.sender.next({ startFromLine: true });
                }
            },
            'stop': () => {
                log.warn(`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`);
                this.command('gcode:stop', ...args);
            },
            // @param {object} options The options object.
            // @param {boolean} [options.force] Whether to force stop a G-code program. Defaults to false.
            'gcode:stop': async () => {
                this.workflow.stop();

                const [options] = args;
                const { force = false } = { ...options };

                const wcs = _.get(this.state, 'parserstate.modal.wcs', 'G54');
                if (force) {
                    let activeState;

                    activeState = _.get(this.state, 'status.activeState', '');
                    if (activeState === GRBL_ACTIVE_STATE_RUN) {
                        this.write('!'); // hold
                    }

                    await delay(700); // delay 700ms
                    this.write('\x18'); // ^x
                    // Handle resetting workspace after stop back to selected one
                    if (wcs !== 'G54') {
                        await delay(200);
                        this.writeln(wcs);
                    }
                }
                // Moved this to end so it triggers AFTER the reset on force stop
                this.event.trigger(PROGRAM_END);
                this.sender.stopCountdown();
            },
            'pause': () => {
                log.warn(`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`);
                this.command('gcode:pause');
            },
            'gcode:pause': async () => {
                if (this.event.hasEnabledEvent(PROGRAM_PAUSE)) {
                    this.workflow.pause();
                    this.event.trigger(PROGRAM_PAUSE);
                } else {
                    this.workflow.pause();
                    await delay(100);
                    this.write('!');
                }
            },
            'resume': () => {
                log.warn(`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`);
                this.command('gcode:resume');
            },
            'gcode:resume': async () => {
                if (this.event.hasEnabledEvent(PROGRAM_RESUME)) {
                    this.feederCB = () => {
                        this.write('~');
                        this.workflow.resume();
                        this.feederCB = null;
                    };
                    this.event.trigger(PROGRAM_RESUME);
                } else {
                    this.write('~');
                    await delay(1000);
                    this.workflow.resume();
                }
            },
            'feeder:feed': () => {
                const [commands, context = {}] = args;
                this.command('gcode', commands, context);
            },
            'feeder:start': async () => {
                if (this.workflow.state === WORKFLOW_STATE_RUNNING) {
                    return;
                }
                this.write('~');
                await delay(1000);
                this.feeder.unhold();
                this.feeder.next();
            },
            'feeder:stop': () => {
                this.feeder.reset();
            },
            'feedhold': () => {
                this.event.trigger(FEED_HOLD);

                this.write('!');
            },
            'cyclestart': () => {
                this.event.trigger(CYCLE_START);

                this.write('~');
            },
            'statusreport': () => {
                this.write('?');
            },
            'homing': () => {
                this.event.trigger(HOMING);
                this.homingStarted = true; // Update homing cycle as having started

                this.writeln('$H');
                this.state.status.activeState = GRBL_ACTIVE_STATE_HOME;
                this.emit('controller:state', GRBL, this.state);
            },
            'sleep': () => {
                this.event.trigger(SLEEP);

                this.writeln('$SLP');
            },
            'unlock': () => {
                this.writeln('$X');
            },
            'populateConfig': () => {
                this.writeln('$$');
            },
            'reset': () => {
                this.workflow.stop();

                this.feeder.reset();

                this.write('\x18'); // ^x
            },
            'reset:limit': () => {
                this.workflow.stop();
                this.feeder.reset();
                this.write('\x18'); // ^x
                this.writeln('$X');
            },
            'checkStateUpdate': () => {
                this.emit('controller:state', GRBL, this.state);
            },
            // Feed Overrides
            // @param {number} value The amount of percentage increase or decrease.
            'feedOverride': () => {
                const [value] = args;
                const [feedOV] = this.state.status.ov;

                let diff = value - feedOV;

                if (value === 100) {
                    this.write(String.fromCharCode(0x90));
                } else {
                    const queue = calcOverrides(diff, 'feed');
                    queue.forEach((command, index) => {
                        setTimeout(() => {
                            this.connection.writeImmediate(command);
                            this.connection.writeImmediate('?');
                        }, 50 * (index + 1));
                    });
                }

                this.sender.setOvF(value);
            },
            // Spindle Speed Overrides
            // @param {number} value The amount of percentage increase or decrease.
            'spindleOverride': () => {
                const [value] = args;
                const [,, spindleOV] = this.state.status.ov;

                let diff = value - spindleOV;
                //Limits for keyboard/gamepad shortcuts
                if (value < 10) {
                    diff = 10 - spindleOV;
                } else if (value > 230) {
                    diff = 230 - spindleOV;
                }

                if (value === 100) {
                    this.write(String.fromCharCode(0x99));
                } else {
                    const queue = calcOverrides(diff, 'spindle');
                    queue.forEach((command, index) => {
                        setTimeout(() => {
                            this.connection.writeImmediate(command);
                            this.connection.writeImmediate('?');
                        }, 50 * (index + 1));
                    });
                }
            },
            // Rapid Overrides
            // @param {number} value A percentage value of 25, 50, or 100. A value of zero will reset to 100%.
            // 100: Set to 100% full rapid rate.
            //  50: Set to 50% of rapid rate.
            //  25: Set to 25% of rapid rate.
            'rapidOverride': () => {
                const [value] = args;

                if (value === 0 || value === 100) {
                    this.write('\x95');
                } else if (value === 50) {
                    this.write('\x96');
                } else if (value === 25) {
                    this.write('\x97');
                }
            },
            'lasertest:on': () => {
                const [power = 0, duration = 0, maxS = 1000] = args;
                const commands = [
                    // https://github.com/gnea/grbl/wiki/Grbl-v1.1-Laser-Mode
                    // The laser will only turn on when Grbl is in a G1, G2, or G3 motion mode.
                    'G1F1 M3 S' + ensurePositiveNumber(maxS * (power / 100))
                ];
                if (duration > 0) {
                    commands.push('G4P' + ensurePositiveNumber(duration));
                    commands.push('M5 S0');
                }
                this.state.parserstate.modal.spindle = 'M3';
                this.emit('controller:state', GRBL, this.state);
                this.command('gcode', commands);
            },
            'lasertest:off': () => {
                const commands = [
                    'M5S0'
                ];
                this.command('gcode', commands);
            },
            'laserpower:change': () => {
                const [power = 0, maxS = 1000] = args;
                const commands = [
                    // https://github.com/gnea/grbl/wiki/Grbl-v1.1-Laser-Mode
                    // The laser will only turn on when Grbl is in a G1, G2, or G3 motion mode.
                    'S' + Math.round(ensurePositiveNumber(maxS * (power / 100)) * 100) / 100
                ];
                this.command('gcode', commands);
            },
            'spindlespeed:change': () => {
                const [speed = 0] = args;
                const commands = [
                    'S' + speed
                ];
                this.command('gcode', commands);
            },
            'gcode': () => {
                const [commands, context] = args;
                const data = ensureArray(commands)
                    .join('\n')
                    .split(/\r?\n/)
                    .filter(line => {
                        if (typeof line !== 'string') {
                            return false;
                        }

                        return line.trim().length > 0;
                    });

                this.feeder.feed(data, context);

                if (!this.feeder.isPending()) {
                    this.feeder.next();
                }
            },
            'gcode:test': () => {
                this.feederCB = () => {
                    this.workflow.start();
                    this.feeder.reset();
                    this.sender.next();
                    this.feederCB = null;
                };
                this.command('gcode', ['%global.state.testWCS=modal.wcs', '$C']);
            },
            'gcode:safe': () => {
                const [commands, prefUnits] = args;
                const deviceUnits = this.state.parserstate.modal.units;
                let code = [];

                if (!deviceUnits) {
                    log.error('Unable to determine device unit modal');
                    return;
                }
                // Force command in preferred units
                if (prefUnits !== deviceUnits) {
                    code.push(prefUnits);
                }
                code = code.concat(commands);
                // return modal to previous state if they were different previously
                if (prefUnits !== deviceUnits) {
                    code = code.concat(deviceUnits);
                }
                this.command('gcode', code);
            },
            'jog:start': () => {
                let [axes, feedrate = 1000, units = METRIC_UNITS] = args;
                //const JOG_COMMAND_INTERVAL = 80;
                let unitModal = (units === METRIC_UNITS) ? 'G21' : 'G20';
                let { $20, $130, $131, $132, $23, $13 } = this.settings.settings;

                let jogFeedrate;
                if ($20 === '1') {
                    $130 = Number($130);
                    $131 = Number($131);
                    $132 = Number($132);

                    // Convert feedrate to metric if working in imperial - easier to convert feedrate and treat everything else as MM than opposite
                    if (units !== METRIC_UNITS) {
                        feedrate = (feedrate * 25.4).toFixed(2);
                        unitModal = 'G21';
                    }

                    const FIXED = 2;

                    //If we are moving on the positive direction, we don't need to subtract
                    //the max travel by it as we are moving towards the zero position, but if
                    //we are moving in the negative direction we need to subtract the max travel
                    //by it to reach the maximum amount in that direction
                    const calculateAxisValue = ({ direction, position, maxTravel }) => {
                        const OFFSET = 1;

                        if (position === 0) {
                            return ((maxTravel) * direction).toFixed(FIXED);
                        }

                        if (direction === 1) {
                            return Number(position - OFFSET).toFixed(FIXED);
                        } else {
                            return Number(-1 * (maxTravel - position - OFFSET)).toFixed(FIXED);
                        }
                    };

                    let { mpos } = this.state.status;
                    Object.keys(mpos).forEach((axis) => {
                        const val = Number(mpos[axis]);

                        // Need to convert to metric if machine is reporting in imperial and the UI is in a G21 metric state
                        if ($13 === '1' && unitModal === 'G21') {
                            mpos[axis] = Number((val * 25.4).toFixed(FIXED));
                        } else {
                            mpos[axis] = Number(mpos[axis]);
                        }
                    });

                    if (this.homingFlagSet) {
                        const [xMaxLoc, yMaxLoc] = getAxisMaximumLocation($23);

                        if (axes.X) {
                            axes.X = determineMaxMovement(Math.abs(mpos.x), axes.X, xMaxLoc, $130);
                        }
                        if (axes.Y) {
                            axes.Y = determineMaxMovement(Math.abs(mpos.y), axes.Y, yMaxLoc, $131);
                        }
                    } else {
                        if (axes.X) {
                            axes.X = calculateAxisValue({ direction: Math.sign(axes.X), position: Math.abs(mpos.x), maxTravel: $130 });
                        }
                        if (axes.Y) {
                            axes.Y = calculateAxisValue({ direction: Math.sign(axes.Y), position: Math.abs(mpos.y), maxTravel: $131 });
                        }
                    }

                    if (axes.Z) {
                        const direction = Math.sign(axes.Z);
                        if (direction === 1) {
                            axes.Z = Math.abs((mpos.z + 1));
                        } else {
                            axes.Z = (-1 * ($132 - 1)) - mpos.z;
                        }
                        //axes.Z = calculateAxisValue({ direction: Math.sign(axes.Z), position: mpos.z, maxTravel: (-1 * $132) });
                    }
                } else {
                    jogFeedrate = 10000;
                    Object.keys(axes).forEach((axis) => {
                        axes[axis] *= jogFeedrate;
                    });
                }

                axes.F = feedrate;
                if (axes.Z) {
                    axes.F *= 0.8;
                    axes.F = axes.F.toFixed(3);
                }

                const jogCommand = `$J=${unitModal}G91 ` + map(axes, (value, letter) => ('' + letter.toUpperCase() + value)).join(' ');
                this.command('gcode', jogCommand);
            },
            'jog:stop': () => {
                this.write('\x85');
            },
            'jog:cancel': () => {
                this.write('\x85');
            },
            'macro:run': () => {
                let [id, context = {}, callback = noop] = args;
                if (typeof context === 'function') {
                    callback = context;
                    context = {};
                }
                const macros = config.get('macros');
                const macro = _.find(macros, { id: id });

                if (!macro) {
                    log.error(`Cannot find the macro: id=${id}`);
                    return;
                }

                this.event.trigger(MACRO_RUN);
                this.command('gcode', macro.content, context);

                callback(null);
            },
            'macro:load': () => {
                let [id, context = {}, callback = noop] = args;
                if (typeof context === 'function') {
                    callback = context;
                    context = {};
                }

                const macros = config.get('macros');
                const macro = _.find(macros, { id: id });

                if (!macro) {
                    log.error(`Cannot find the macro: id=${id}`);
                    return;
                }

                this.event.trigger(MACRO_LOAD);

                this.command('gcode:load', { name: macro.name }, macro.content, context, callback);
            },
            'watchdir:load': () => {
                const [file, callback = noop] = args;
                const context = {}; // empty context

                monitor.readFile(file, (err, data) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    this.command('gcode:load', file, data, context, callback);
                });
            },
            'machineprofile:load': () => {
                const [machineProfile] = args;

                store.set('machineProfile', machineProfile);
            },
            'settings:updated': () => {
                const [newSettings = {}] = args;

                const currentSettings = store.get('preferences') || {};

                const updated = {
                    ...currentSettings,
                    ...newSettings,
                };

                store.set('preferences', updated);
            },
            'toolchange:context': () => {
                const [context] = args;
                console.log(context);
                this.toolChangeContext = context;
            },
            'toolchange:pre': () => {
                log.debug('Starting pre hook');
                this.runPreChangeHook();
            },
            'toolchange:post': () => {
                log.debug('starting post hook');
                this.command('feeder:start');
                this.runPostChangeHook();
            },
            'wizard:start': () => {
                log.debug('Wizard kickoff code');
                const [gcode] = args;

                this.toolChanger.addInterval(() => {
                    this.command('gcode', gcode);
                });
            },
            'wizard:step': () => {
                const [stepIndex, substepIndex] = args;
                this.feederCB = () => {
                    this.emit('wizard:next', stepIndex, substepIndex);
                };
            },
            'updateEstimateData': () => {
                const [estimateData] = args;
                this.sender.setEstimateData(estimateData.estimates);
                this.sender.setEstimatedTime(estimateData.estimatedTime);
            }
        }[cmd];

        if (!handler) {
            log.error(`Unknown command: ${cmd}`);
            return;
        }

        handler();
    }

    write(data, context) {
        // Assertion check
        if (this.isClose()) {
            log.error(`Serial port "${this.options.port}" is not accessible`);
            return;
        }

        const cmd = data.trim();

        this.actionMask.replyStatusReport = (cmd === '?') || this.actionMask.replyStatusReport;
        this.actionMask.replyParserState = (cmd === '$G') || this.actionMask.replyParserState;

        this.connection.write(data, {
            ...context,
            source: WRITE_SOURCE_CLIENT
        });
        log.silly(`> ${data}`);
    }

    writeln(data, context, emit = false) {
        if (_.includes(GRBL_REALTIME_COMMANDS, data)) {
            this.write(data, context);
        } else {
            this.write(data + '\n', context);
        }
    }

    convertGcodeToArray(gcode) {
        //Clean up lines and remove ones that are comments and headers
        const lines = gcode
            .split('\n')
            .filter(line => (line.trim().length > 0));
        return lines;
    }

    updateSpindleModal(modal) {
        this.state.parserstate.modal.spindle = modal;
        this.emit('controller:state', GRBL, this.state);
    }

    /* Runs specified code segment on M6 command before alerting the UI as to what's happened */
    runPreChangeHook(comment = '') {
        let { preHook = '', postHook = '', skipDialog = false } = this.toolChangeContext;

        preHook = `G4 P1\n${preHook}`;
        const block = this.convertGcodeToArray(preHook);

        // If we're skipping dialog, combine both blocks and append a toolchange end so the program continues as expected
        if (skipDialog) {
            block.push('G4 P1');
            block.push(...this.convertGcodeToArray(postHook));
            block.push(POSTHOOK_COMPLETE);
        }

        // If we're not skipping, add a prehook complete to show dialog to continue toolchange operation
        if (!skipDialog) {
            block.push(`${PREHOOK_COMPLETE} ;${comment}`);
        }

        console.log(block);


        this.command('gcode', block);
    }

    runPostChangeHook() {
        let { postHook } = this.toolChangeContext || '';
        postHook = `G4 P1\n${postHook}`;
        const block = this.convertGcodeToArray(postHook);
        block.push(POSTHOOK_COMPLETE);

        this.command('gcode', block);
    }

    setSenderTimeout() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            // job idle
            if (this.state.status.activeState === GRBL_ACTIVE_STATE_IDLE) {
                // force one ok for query parser and another for the line
                this.forceOK = true;
                this.sender.ack();
                this.runner.forceOK();
            } else if (this.workflow.state === WORKFLOW_STATE_RUNNING) { // if job not idle but running, reset timeout
                this.setSenderTimeout();
            } else if (this.state.status.activeState === GRBL_ACTIVE_STATE_IDLE && this.workflow.state === WORKFLOW_STATE_IDLE) { // job done
                this.sender.next({ forceEnd: true }); // force job end
            }
        }, 5000);
    }
}

export default GrblController;
