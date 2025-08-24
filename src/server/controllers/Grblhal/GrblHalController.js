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
    A_AXIS_COMMANDS,
    GLOBAL_OBJECTS as globalObjects,
    WRITE_SOURCE_CLIENT,
    WRITE_SOURCE_FEEDER,
    Y_AXIS_COMMANDS
} from '../constants';
import GrblHalRunner from './GrblHalRunner';
import {
    GRBLHAL,
    GRBL_ACTIVE_STATE_RUN,
    GRBLHAL_REALTIME_COMMANDS,
    GRBL_HAL_ALARMS,
    GRBL_HAL_ERRORS,
    GRBL_HAL_SETTINGS,
    GRBL_ACTIVE_STATE_HOME, GRBL_HAL_ACTIVE_STATE_HOLD, GRBL_HAL_ACTIVE_STATE_IDLE, GRBL_HAL_ACTIVE_STATE_RUN
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
    ALARM,
    ERROR
} from '../../../app/src/constants';
import { determineHALMachineZeroFlag, determineMaxMovement, getAxisMaximumLocation } from '../../lib/homing';
import { calcOverrides } from '../runOverride';
import ToolChanger from '../../lib/ToolChanger';
import { GRBL_ACTIVE_STATE_CHECK, GRBL_ACTIVE_STATE_IDLE } from 'server/controllers/Grbl/constants';
import { GCODE_TRANSLATION_TYPE, translateGcode } from '../../lib/gcode-translation';
// % commands
const WAIT = '%wait';
const PREHOOK_COMPLETE = '%pre_complete';
const POSTHOOK_COMPLETE = '%toolchange_complete';
const PAUSE_START = '%pause_start';

const log = logger('controller:grblHAL');
const noop = _.noop;

class GrblHalController {
    type = GRBLHAL;

    // CNCEngine
    engine = null;

    // Sockets
    sockets = {};

    // Connection
    connection = null;

    parseToolFromStatusReport(data) {
        const line = data.toString();
        const toolMatch = line.match(/T:(\d+)/);

        if (toolMatch) {
            const toolNum = Number(toolMatch[1]);
            this.state.status = this.state.status || {};
            this.state.status.currentTool = toolNum;
            this.emit('controller:state', GRBLHAL, this.state);
        }
    }

    connectionEventListener = {
        data: (data) => {
            log.silly(`< ${data}`);
            if (data.toString().includes('T:')) {
                this.parseToolFromStatusReport(data);
            }
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

    // grblHAL
    controller = null;

    ready = false;

    initialized = false;

    state = {};

    settings = {};

    toolChangeContext = {};

    queryTimer = null;

    timePaused = null;

    actionMask = {
        queryParserState: {
            state: false, // wait for a message containing the current G-code parser modal state
            reply: false // wait for an `ok` or `error` response
        },
        queryStatusReport: false,

        // Respond to user input
        replyParserState: false, // $G
        replyStatusReport: false, // ?
        alarmCompleteReport: false, //0x87
        axsReportCount: 0
    };

    parserStateEnabled = false;

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

    // Shared context
    sharedContext = {};

    // Workflow
    workflow = null;

    // Homing information
    homingStarted = false;

    homingFlagSet = false;

    // Toolchange
    toolChanger = null;

    // Rotary
    isInRotaryMode = false;

    // Macro button resume
    programResumeTimeout = null;

    constructor(engine, connection, options) {
        log.debug('constructor');
        if (!engine) {
            throw new Error('engine must be specified');
        }
        this.engine = engine;


        const { port, baudrate, rtscts, network } = { ...options };
        this.options = {
            ...this.options,
            port: port,
            baudrate: baudrate,
            rtscts: rtscts,
            network
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
            return data;
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
                const commentString = (comment && comment[0].length > 0) ? comment[0].trim().replace(';', '') : '';
                line = line.replace(commentMatcher, '').replace('/uFEFF', '').trim();
                context = this.populateContext(context);

                // We don't want some of these events firing if updating EEPROM in a macro - super edge case.
                const looksLikeEEPROM = line.charAt(0) === '$';

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
                        return 'G4 P1';
                    }
                    if (line === POSTHOOK_COMPLETE) {
                        log.debug('Finished Post-hook, resuming program');
                        setTimeout(() => {
                            this.workflow.resume();
                        }, 1000);
                        return 'G4 P1';
                    }
                    if (line === PAUSE_START) {
                        log.debug('Found M0/M1, pausing program');
                        this.emit('sender:M0M1', { data: 'M0/M1', comment: commentString });
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
                    // Look to check if first char is $ so we don't pause when updating an EEPROM macro.
                    const programMode = _.intersection(words, ['M0', 'M1'])[0];
                    if (programMode === 'M0' && !looksLikeEEPROM) {
                        log.debug('M0 Program Pause');
                        const payload = { data: 'M0', comment: commentString };
                        this.feeder.hold(payload);
                        this.emit('feeder:pause', payload);
                    } else if (programMode === 'M1' && !looksLikeEEPROM) {
                        log.debug('M1 Program Pause');
                        const payload = { data: 'M1', comment: commentString };
                        this.feeder.hold(payload);// Hold reason
                        this.emit('feeder:pause', payload);
                    }
                }

                // More aggressive updating of spindle modals for safety
                const spindleCommand = _.intersection(words, ['M3', 'M4'])[0];
                if (spindleCommand) {
                    this.updateSpindleModal(spindleCommand);
                }

                // // M6 Tool Change
                if (_.includes(words, 'M6')) {
                    const passthroughM6 = _.get(this.toolChangeContext, 'passthrough', false);
                    if (!passthroughM6) {
                        log.debug('M6 Tool Change');
                        this.feeder.hold({
                            data: 'M6',
                            comment: commentString
                        }); // Hold reason
                        line = line.replace('M6', '(M6)');
                    }
                }

                if (this.isInRotaryMode) {
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
                }

                return line;
            }
        });
        this.feeder.on('data', (line = '', context = {}) => {
            if (this.isClose()) {
                log.error(`Serial port "${this.options.port}" is not accessible`);
                return;
            }

            /*if (this.runner.isAlarm()) {
                this.feeder.reset();
                this.emit('workflow:state', this.workflow.state); // Propogate alarm code to UI
                log.warn('Stopped sending G-code commands in Alarm mode');
                return;
            }*/

            line = String(line).trim();
            if (line.length === 0) {
                return;
            }

            this.emit('serialport:write', line + '\n', {
                ...context,
                source: WRITE_SOURCE_FEEDER
            });

            this.write(line + '\n', {
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
            bufferSize: (1024 - 100), // TODO: Parse this out from OPT
            dataFilter: (line, context) => {
                // Remove comments that start with a semicolon `;`
                let commentMatcher = /\s*;.*/g;
                let bracketCommentLine = /\([^\)]*\)/gm;
                let toolCommand = /(T)(-?\d*\.?\d+\.?)/;
                line = line.replace(bracketCommentLine, '').trim();
                let comment = line.match(commentMatcher);
                let commentString = (comment && comment[0].length > 0) ? comment[0].trim().replace(';', '') : '';
                line = line.replace(commentMatcher, '').replace('/uFEFF', '').trim();
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

                if (_.includes(words, 'M6')) {
                    log.debug(`M6 Tool Change: line=${sent + 1}, sent=${sent}, received=${received}`);
                    const { toolChangeOption } = this.toolChangeContext;

                    const currentState = _.get(this.state, 'status.activeState', '');
                    if (currentState === 'Check') {
                        return line.replace('M6', '(M6)');
                    }

                    let tool = line.match(toolCommand);

                    // Handle specific cases for macro and pause, ignore is default and comments line out with no other action
                    if (toolChangeOption !== 'Ignore') {
                        if (tool) {
                            commentString = `(${tool?.[0]}) ` + commentString;
                        }
                        this.workflow.pause({ data: 'M6', comment: commentString });

                        if (toolChangeOption === 'Code') {
                            setTimeout(() => {
                                this.emit('toolchange:start');
                                this.runPreChangeHook(commentString);
                            }, 500);
                        } else {
                            const count = this.sender.incrementToolChanges();

                            setTimeout(() => {
                                // Emit the current state so latest tool info is available
                                this.runner.setTool(tool?.[2]); // set tool in runner state
                                this.emit('controller:state', GRBLHAL, this.state, tool?.[2]); // set tool in redux
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

                    const passthroughM6 = _.get(this.toolChangeContext, 'passthrough', false);
                    if (!passthroughM6 || toolChangeOption === 'Code') {
                        line = line.replace('M6', '(M6)');
                    }
                    //line = line.replace(`${tool?.[0]}`, `(${tool?.[0]})`);
                }

                /**
                 * Rotary Logic
                 * Need to change the A-axis movements to Y-movements to emulate the rotary axis on grbl
                 */
                if (this.isInRotaryMode) {
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
        });
        this.sender.on('hold', noop);
        this.sender.on('unhold', noop);
        this.sender.on('start', (startTime) => {
            this.actionTime.senderFinishTime = 0;
        });

        this.sender.on('end', (finishTime) => {
            this.actionTime.senderFinishTime = finishTime;
            if (this.runner.state.status.activeState === GRBL_ACTIVE_STATE_CHECK) {
                log.info('Exiting check mode');
                this.workflow.stopTesting();
                this.command('gcode', '$C');
                setTimeout(() => {
                    this.command('gcode', '[global.state.testWCS]');
                }, 200);
                this.emit('gcode_error_checking_file', this.sender.state, 'finished');
            }
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
            this.feeder.reset();
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

            // if there was error and feeder was holding, don't reset
            if (this.feeder.state.hold) {
                this.feeder.unhold();
            }
            // Reset feeder prior to resume program execution
            this.feeder.reset();

            // Resume program execution
            this.sender.unhold();

            this.sender.resumeCountdown();

            // subtract time paused
            this.sender.next({ timePaused: pauseTime });
        });

        // Grbl
        this.runner = new GrblHalRunner();

        this.runner.on('raw', noop);

        this.runner.on('spindle', (spindle) => {
            this.emit('spindle:add', spindle);
            this.emit('serialport:read', spindle.raw);
        });

        this.runner.on('status', (res) => {
            if (!this.runner.hasSettings() && res.activeState === GRBL_ACTIVE_STATE_IDLE) {
                this.initialized = true;
                this.initController();
            }

            // Make sure we also have axs parsed - at most two times or we get endless loop
            if (!this.runner.hasAXS() && res.activeState === GRBL_ACTIVE_STATE_IDLE && this.actionMask.axsReportCount < 2) {
                this.writeln('$I');
                this.actionMask.axsReportCount++;
            }

            //
            if (this.homingStarted) {
                // We look at bit instead of faking it with machine positions
                this.homingFlagSet = determineHALMachineZeroFlag(res, this.settings);
                this.emit('homing:flag', this.homingFlagSet);
                this.homingStarted = false;
            }

            this.actionMask.queryStatusReport = false;

            if (this.actionMask.replyStatusReport) {
                this.actionMask.replyStatusReport = false;
                this.emit('serialport:read', res.raw);
            }

            // Check if the recieve buffer is available in the status report
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
            // we only query when parser state option in $10 is disabled
            if (this.actionMask.queryParserState.reply && !this.parserStateEnabled) {
                if (this.actionMask.replyParserState) {
                    this.actionMask.replyParserState = false;
                    this.emit('serialport:read', res.raw);
                }
                this.actionMask.queryParserState.reply = false;

                return;
                // if parser state is enabled, it does not send an 'ok' when the state auto emits
                // so only consume the ok if the user entered $G
            } else if (this.actionMask.queryParserState.reply && this.parserStateEnabled) {
                if (this.actionMask.replyParserState) {
                    this.actionMask.replyParserState = false;
                    this.actionMask.queryParserState.reply = false;
                    this.emit('serialport:read', res.raw);
                    return;
                }
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
            // Only pause on workflow error with hold + sender halt
            const isRunning = this.workflow.isRunning();
            const firmwareIsAlarmed = this.runner.isAlarm();

            if (isRunning) {
                this.workflow.pause();
                this.sender.hold();
                this.connection.writeImmediate('\n');
                this.write('!');
            }

            const code = Number(res.message) || undefined;
            const error = _.find(GRBL_HAL_ERRORS, { code: code }) || {};

            // Don't emit errors to UI in situations where firmware is currently alarmed and always hide error 79
            if (firmwareIsAlarmed || code === 79) {
                return;
            }

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
                controller: GRBLHAL,
                fileRunning: isRunning
            });

            if (this.workflow.state === WORKFLOW_STATE_RUNNING || this.workflow.state === WORKFLOW_STATE_PAUSED) {
                const { lines, received } = this.sender.state;
                const line = lines[received] || '';

                const preferences = store.get('preferences') || { showLineWarnings: false };
                this.emit('serialport:read', `error:${code} (${error?.message})`);

                if (error) {
                    if (preferences.showLineWarnings === false) {
                        const msg = `Error ${code} on line ${received + 1} - ${error?.message}`;
                        this.emit('gcode_error', msg);
                    }

                    if (preferences.showLineWarnings) {
                        this.emit('workflow:state', this.workflow.state, { validLine: false, line: `${lines.length} ${line}` });
                    }
                } else {
                    this.emit('serialport:read', res.raw);
                }
                this.sender.ack();
                this.sender.next({ isOk: true });

                return;
            }

            if (error) {
                this.emit('serialport:read', `error:${code} (${error.message})`);
            }

            const msg = `Error ${code} - ${error?.message}`;
            this.emit('gcode_error', msg);

            this.feeder.ack();
            this.feeder.next();
        });

        this.runner.on('alarm', (res) => {
            const code = Number(res.message) || this.state.status.subState;
            //const alarm = _.find(this.settings.alarms, { id: code });
            // default to grbl hal alarm constants we have saved if the alarms arent populated yet (ex. when there's an error on startup)
            const alarm = this.settings?.alarms ? this.settings.alarms[code.toString()] : _.find(GRBL_HAL_ALARMS, { code: code });

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
            } else if (this.state?.status?.activeState === GRBL_ACTIVE_STATE_HOME) {
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
                const isRunning = this.workflow.isRunning();
                if (isRunning) {
                    this.workflow.stop();
                }
                this.emit('serialport:read', `ALARM:${code} (${alarm.description})`);
                this.emit('error', {
                    type: ALARM,
                    code: code,
                    description: alarm.description || '',
                    line: line,
                    lineNumber: isFileError ? received + 1 : '',
                    origin: errorOrigin,
                    controller: GRBLHAL,
                }, isRunning);
                // Force propogation of current state on alarm
                this.state = this.runner.state;

                this.emit('controller:state', GRBLHAL, this.state);
            } else {
                // Grbl v0.9
                this.emit('serialport:read', res.raw);
            }
        });

        this.runner.on('parserstate', (res) => {
            //finished searching gCode file for errors
            if (this.sender.state.finishTime > 0 && this.sender.state.sent > 0 && this.runner.state.status.activeState === GRBL_ACTIVE_STATE_CHECK) {
                this.workflow.stopTesting();
                this.command('gcode', '$C');
                setTimeout(() => {
                    this.command('gcode', '[global.state.testWCS]');
                }, 200);
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
            const setting = _.find(GRBL_HAL_SETTINGS, { setting: res.name });

            if (!res.message) {
                // Grbl v1.1
                if (setting?.message) {
                    this.emit('serialport:read', `${res.name}=${res.value} (${setting.message}, ${setting.units})`);
                } else {
                    this.emit('serialport:read', `${res.name}=${res.value}`);
                }
            }

            // check if parser state option is enabled
            if (res.name === '$10') {
                const value = res.value;
                // eslint-disable-next-line no-bitwise
                if (value & 512) {
                    this.parserStateEnabled = true;
                } else {
                    this.parserStateEnabled = false;
                }
            }
        });

        this.runner.on('info', (res) => {
            this.emit('serialport:read', res.raw);
            this.emit('grblHal:info', res);
        });

        this.runner.on('startup', async (res) => {
            this.emit('serialport:read', res.raw);

            // The startup message always prints upon startup, after a reset, or at program end.
            // Setting the initial state when Grbl has completed re-initializing all systems.
            this.clearActionValues();

            // Set ready flag to true when a startup message has arrived
            this.ready = true;

            // Rewind any files in the sender
            this.workflow.stop();

            if (!this.initialized) {
                this.initialized = true;

                // Initialize controller
                this.initController();
            }

            await delay(500);
            this.connection.writeImmediate('$ES\n$ESH\n$EG\n$EA\n$spindles\n');
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

        this.runner.on('others', (res) => {
            this.emit('serialport:read', res.raw);
        });

        this.runner.on('description', (payload) => {
            this.emit('settings:description', this.runner.settings.descriptions);
        });

        this.runner.on('alarmDetail', (payload) => {
            this.emit('settings:alarms', this.runner.settings.alarms);
        });

        this.runner.on('groupDetail', (payload) => {
            this.emit('settings:group', this.runner.settings.groups);
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
                if (this.runner.isAlarm() && this.actionMask.alarmCompleteReport) {
                    this.connection.writeImmediate(GRBLHAL_REALTIME_COMMANDS.COMPLETE_REALTIME_REPORT);
                    this.actionMask.alarmCompleteReport = false;
                } else {
                    this.connection.writeImmediate(GRBLHAL_REALTIME_COMMANDS.STATUS_REPORT); //? or \x80
                    if (!this.actionMask.alarmCompleteReport) {
                        this.actionMask.alarmCompleteReport = true;
                    }
                }
            }
        };

        // TODO:  Do we need to not do this during toolpaths if it's a realtime command now?
        const queryParserState = _.throttle(() => {
            // Check the ready flag
            // if parser state enabled, we dont need to query the parser state
            if (!(this.ready) || this.parserStateEnabled) {
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
                this.connection.writeImmediate(`${GRBLHAL_REALTIME_COMMANDS.GCODE_REPORT}`); // $G equivalent
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
                this.emit('controller:settings', GRBLHAL, this.settings);
            }

            // Grbl state
            if (this.state !== this.runner.state) {
                // Unpause sending when hold state exited using macro buttons - We check if software sender paused + state changed from hold to idle/run
                const currentActiveState = _.get(this.state, 'status.activeState', '');
                const runnerActiveState = _.get(this.runner.state, 'status.activeState', '');
                if (this.workflow.isPaused &&
                    currentActiveState === GRBL_HAL_ACTIVE_STATE_HOLD &&
                    (runnerActiveState === GRBL_HAL_ACTIVE_STATE_IDLE || runnerActiveState === GRBL_HAL_ACTIVE_STATE_RUN)
                ) {
                    if (this.programResumeTimeout) {
                        clearTimeout(this.programResumeTimeout);
                        this.programResumeTimeout = null;
                    }
                    this.programResumeTimeout = setTimeout(() => {
                        if (this.workflow.isIdle()) {
                            return;
                        }
                        const as = _.get(this.state, 'status.activeState');
                        if ((as === GRBL_HAL_ACTIVE_STATE_IDLE || as === GRBL_HAL_ACTIVE_STATE_RUN) && this.sender.state.hold) {
                            this.command('gcode:resume');
                        }
                    }, 1000);
                }
                this.state = this.runner.state;
                this.emit('controller:state', GRBLHAL, this.state);
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
        this.actionMask.axsReportCount = 0;
        this.actionTime.queryParserState = 0;
        this.actionTime.queryStatusReport = 0;
        this.actionTime.senderFinishTime = 0;
    }

    destroy() {
        if (this.queryTimer) {
            clearInterval(this.queryTimer);
            this.queryTimer = null;
        }

        if (this.runner) {
            this.runner.removeAllListeners();
            this.runner = null;
        }

        if (this.toolChanger) {
            this.toolChanger.clearInterval();
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

    open(port, baudrate, refresh = false, callback = noop) {
        if (!refresh) {
            this.connection.on('data', this.connectionEventListener.data);
            this.connection.on('close', this.connectionEventListener.close);
            this.connection.on('error', this.connectionEventListener.error);
        }

        callback(); // register controller

        // Nothing else here matters if connecting to existing instantiated controller
        if (refresh) {
            return;
        }

        this.workflow.stop();

        // Clear action values
        this.clearActionValues();

        // We need to query version after waiting for connection, so wait 0.5 seconds and query $I
        // We set controller ready if version found
        setTimeout(async () => {
            if (this.connection) {
                this.connection.writeImmediate(String.fromCharCode(0x87));
                await delay(100);
                this.write('$I\n');
            }
            if (!refresh) {
                let counter = 3;
                const interval = setInterval(() => {
                    // check if 3 tries or controller is ready
                    if (this.ready) {
                        clearInterval(interval);
                        return;
                    } else if (counter <= 0) {
                        clearInterval(interval);
                        // The startup message always prints upon startup, after a reset, or at program end.
                        // Setting the initial state when Grbl has completed re-initializing all systems.
                        this.clearActionValues();

                        // Set ready flag to true when a startup message has arrived
                        this.ready = true;

                        // Rewind any files in the sender
                        this.workflow.stop();

                        if (!this.initialized) {
                            this.initialized = true;

                            // Initialize controller
                            this.initController();
                        }

                        this.connection.writeImmediate('$ES\n$ESH\n$EG\n$EA\n$spindles\n');
                        return;
                    }
                    if (this.connection) {
                        // this.write('$I\n');
                        this.write('\x18');
                    }
                    counter--;
                }, 3000);
            } else {
                this.initialized = true;
                this.initController();
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
        return this.connection && this.connection.isOpen();
    }

    isClose() {
        return !(this.isOpen());
    }

    loadFile(gcode, { name }, refresh = false) {
        if (refresh && !this.workflow.isIdle()) {
            log.debug('Skip loading file: workflow is not idle');
            return; // Don't reload file if controller is running;
        }
        log.debug(`Loading file '${name}' to controller`);
        this.command('gcode:load', name, gcode);
    }

    addConnection(socket) {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        if (!_.isEmpty(this.settings)) {
            // controller settings
            socket.emit('controller:settings', GRBLHAL, this.settings);
        }
        if (!_.isEmpty(this.state)) {
            // controller state
            socket.emit('controller:state', GRBLHAL, this.state);
        }
        if (this.feeder) {
            // feeder status
            socket.emit('feeder:status', this.feeder.toJSON());
        }
        if (this.sender) {
            // sender status
            socket.emit('sender:status', this.sender.toJSON());
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
                let [name, gcode, context = {}, callback = noop] = args;
                if (typeof context === 'function') {
                    callback = context;
                    context = {};
                }

                // G4 P0 or P with a very small value will empty the planner queue and then
                // respond with an ok when the dwell is complete. At that instant, there will
                // be no queued motions, as long as no more commands were sent after the G4.
                // This is the fastest way to do it without having to check the status reports.
                //const dwell = '%wait ; Wait for the planner to empty';

                // add delay to spindle startup if enabled
                const preferences = store.get('preferences', {});
                const delay = _.get(preferences, 'spindleDelay', 0);

                if (Number(delay)) {
                    gcode = gcode.replace(/\b(?:S\d* ?M[34]|M[34] ?S\d*)\b(?! ?G4 ?P?\b)/g, `$& G4 P${delay}`);
                }

                const ok = this.sender.load(name, gcode + '\n', context);
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

                    const wordValueInWords = (token, words) => {
                        let found = false;
                        words.forEach(word => {
                            if (word[0] === token) {
                                found = true;
                            }
                        });
                        return found;
                    };

                    const toolpath = new GcodeToolpath();
                    toolpath.loadFromStringSync(firstHalf.join('\n'), (data) => {
                        const { words, line } = data;
                        if (line.includes('F')) {
                            feedRate = getWordValue('F', words);
                            feedFound = true;
                        }
                        if (line.includes('S')) {
                            if (wordValueInWords('S', words)) {
                                spindleRate = getWordValue('S', words);
                            }
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
                    if (modalWcs !== wcs && modalWcs === 'G54') {
                        modalWcs = wcs;
                    }
                    const setModalGcode = modal.motion === 'G2' || modal.motion === 'G3' ? `${modal.motion} X${xVal.toFixed(3)} J0 F${feedRate}` : `${modal.motion}`;

                    // Move up and then to cut start position
                    modalGCode.push(this.event.getEventCode(PROGRAM_START));
                    modalGCode.push(`G0 G90 G21 Z${zMax + safeHeight}`);
                    if (hasSpindle) {
                        modalGCode.push(`${modal.spindle} S${spindleRate}`);
                    }
                    modalGCode.push(`G0 G90 G21 X${xVal.toFixed(3)} Y${yVal.toFixed(3)}`);
                    if (aVal) {
                        modalGCode.push(`G0 G90 G21 A${(Number(aVal) % 360).toFixed(3)}`);
                    }
                    modalGCode.push(`G0 G90 G21 Z${zVal.toFixed(3)}`);
                    // Set modals based on what's parsed so far in the file
                    modalGCode.push(`${modal.units} ${modal.distance} ${modal.arc} ${modalWcs} ${modal.plane} ${coolant.flood} ${coolant.mist}`);
                    modalGCode.push(`F${feedRate}`);
                    modalGCode.push(setModalGcode);
                    modalGCode.push('G4 P1');
                    modalGCode.push('%_GCODE_START');
                    // console.log(modalGCode);

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

                clearInterval(this.programResumeTimeout);

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
                    this.write(GRBLHAL_REALTIME_COMMANDS.FEED_HOLD);
                }
            },
            'resume': () => {
                log.warn(`Warning: The "${cmd}" command is deprecated and will be removed in a future release.`);
                this.command('gcode:resume');
            },
            'gcode:resume': async () => {
                log.debug('gcode:resume called - program to continue sending');
                if (this.event.hasEnabledEvent(PROGRAM_RESUME)) {
                    this.feederCB = () => {
                        this.write(GRBLHAL_REALTIME_COMMANDS.CYCLE_START);
                        this.workflow.resume();
                        this.feederCB = null;
                    };
                    this.event.trigger(PROGRAM_RESUME);
                } else {
                    this.write(GRBLHAL_REALTIME_COMMANDS.CYCLE_START);
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

                delay(100).then(() => {
                    this.write('~');
                });
            },
            'feedhold': () => {
                this.event.trigger(FEED_HOLD);

                this.write('!');
            },
            'feedhold_alt': () => {
                this.event.trigger(FEED_HOLD);

                this.write(GRBLHAL_REALTIME_COMMANDS.FEED_HOLD);
            },
            'cyclestart': () => {
                this.event.trigger(CYCLE_START);

                this.write('~');
            },
            'cyclestart_alt': () => {
                this.event.trigger(CYCLE_START);

                this.write(GRBLHAL_REALTIME_COMMANDS.CYCLE_START);
            },
            'statusreport': () => {
                this.write('?');
            },
            'homing': () => {
                const [axis] = args;
                this.event.trigger(HOMING);
                this.homingStarted = true; // Update homing cycle as having started

                if (axis) {
                    this.writeln('$H' + axis);
                } else {
                    this.writeln('$H');
                }
                this.state.status.activeState = GRBL_ACTIVE_STATE_HOME;
                this.emit('controller:state', GRBLHAL, this.state);
            },
            'sleep': () => {
                this.event.trigger(SLEEP);

                this.writeln('$SLP');
            },
            'unlock': () => {
                this.feeder.reset();
                this.writeln('$X');
                this.write(GRBLHAL_REALTIME_COMMANDS.CMD_SOFT_STOP);
            },
            'populateConfig': () => {
                this.writeln('$$');
            },
            'reset': () => {
                this.workflow.stop();

                this.feeder.reset();

                this.write('\x18'); // ^x
            },
            'reset:soft': () => {
                this.workflow.stop();
                this.feeder.reset();
                this.write('\x19'); // HAL soft stop command
            },
            'reset:limit': () => {
                this.workflow.stop();
                this.feeder.reset();
                this.write('\x18'); // ^x
                delay(350).then(() => {
                    this.writeln('$X');
                    delay(500).then(() => {
                        this.connection.writeImmediate(GRBLHAL_REALTIME_COMMANDS.COMPLETE_REALTIME_REPORT);
                    });
                });
            },
            'checkStateUpdate': () => {
                this.emit('controller:state', GRBLHAL, this.state);
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
                        }, 25 * (index + 1));
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
                        }, 25 * (index + 1));
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
                this.emit('controller:state', GRBLHAL, this.state);
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
                    const interval = setInterval(() => {
                        // check if in check (lol)
                        // if we aren't in check, there may be a race condition
                        // where the verify is done before the board is in check
                        // which makes it stay in check forever
                        if (this.runner && this.runner.isCheck()) {
                            this.feeder.reset();
                            this.workflow.start();
                            this.sender.next();
                            this.feederCB = null;
                            clearInterval(interval);
                            return;
                        }
                    }, 200);
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
                let { $20, $130, $131, $132, $23, $13, $40 } = this.settings.settings;

                let jogFeedrate = (unitModal === 'G21') ? 3000 : 118;
                if ($20 === '1' && $40 === '0') { // if 40 enabled, can just use non-soft limit logic
                    $130 = Number($130);
                    $131 = Number($131);
                    $132 = Number($132);

                    // Update homing flag always, not just on homing
                    this.homingFlagSet = determineHALMachineZeroFlag({}, this.settings);

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
                        const OFFSET = -1;

                        if (position === 0) {
                            return ((maxTravel + OFFSET) * direction).toFixed(FIXED);
                        }

                        if (direction === 1) {
                            return Number(position + OFFSET).toFixed(FIXED);
                        } else {
                            return Number(-1 * (maxTravel - position + OFFSET)).toFixed(FIXED);
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
                        axes.Z = calculateAxisValue({ direction: Math.sign(axes.Z), position: Math.abs(mpos.z), maxTravel: $132 });
                    }
                    if (axes.A) {
                        axes.A *= jogFeedrate;
                    }
                } else {
                    //jogFeedrate = 10000;
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
                this.writeln(jogCommand, {}, true);
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

                this.command('gcode:load', macro.name, macro.content, context, callback);
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
            'realtime_report': () => {
                this.write(GRBLHAL_REALTIME_COMMANDS.COMPLETE_REALTIME_REPORT);
            },
            'error_clear': () => {
                this.write('$');
            },
            'toolchange:acknowledge': () => {
                this.write(GRBLHAL_REALTIME_COMMANDS.TOOL_CHANGE_ACK);
            },
            'virtual_stop_toggle': () => {
                this.write(GRBLHAL_REALTIME_COMMANDS.VIRTUAL_STOP_TOGGLE);
            },
            'updateEstimateData': () => {
                const [estimateData] = args;
                this.sender.setEstimateData(estimateData.estimates);
                this.sender.setEstimatedTime(estimateData.estimatedTime);
            },
            'updateRotaryMode': () => {
                const [isInRotaryMode] = args;
                this.isInRotaryMode = isInRotaryMode;
            },
            'runner:resetSettings': () => {
                this.runner.deleteSettings();
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

        this.actionMask.replyStatusReport = (cmd === GRBLHAL_REALTIME_COMMANDS.STATUS_REPORT) || (cmd === GRBLHAL_REALTIME_COMMANDS.COMPLETE_REALTIME_REPORT) || this.actionMask.replyStatusReport;
        this.actionMask.replyParserState = (cmd === GRBLHAL_REALTIME_COMMANDS.GCODE_REPORT) || this.actionMask.replyParserState;

        this.connection.write(data, {
            ...context,
            source: WRITE_SOURCE_CLIENT
        });
        log.silly(`> ${data}`);
    }

    writeln(data, context, emit = false) {
        if (_.includes(GRBLHAL_REALTIME_COMMANDS, data)) {
            this.write(data, context);
        } else {
            this.write(data + '\n', context);
        }
        if (emit) {
            this.emit('serialport:write', data + '\n', {
                ...context,
                source: WRITE_SOURCE_FEEDER
            });
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
        this.emit('controller:state', GRBLHAL, this.state);
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
            if (this.state.status.activeState === GRBL_HAL_ACTIVE_STATE_IDLE) {
                // force one ok for query parser and another for the line
                this.forceOK = true;
                this.sender.ack();
                this.runner.forceOK();
            } else if (this.workflow.state === WORKFLOW_STATE_RUNNING) { // if job not idle but running, reset timeout
                this.setSenderTimeout();
            } else if (this.state.status.activeState === GRBL_HAL_ACTIVE_STATE_IDLE && this.workflow.state === WORKFLOW_STATE_IDLE) { // job done
                this.sender.next({ forceEnd: true }); // force job end
            }
        }, 5000);
    }
}

export default GrblHalController;
