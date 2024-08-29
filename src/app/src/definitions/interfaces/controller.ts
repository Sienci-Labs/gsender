import { EEPROMDescriptions, EEPROMSettings, FirmwareOptions } from "./firmware"
import { BasicObject } from "./general"

export interface ControllerSettings { //TODO
    parameters: BasicObject,
    settings: EEPROMSettings,
    info?: FirmwareOptions,
    descriptions?: EEPROMDescriptions
    groups: BasicObject,
    alarms: BasicObject,
};

export interface ControllerListeners {
    // Socket.IO Events
    // Fired upon a connection including a successful reconnection.
    'connect': Array<Function>,
    // Fired upon a connection error.
    'connect_error': Array<Function>,
    // Fired upon a connection timeout.
    'connect_timeout': Array<Function>,
    // Fired when an error occurs.
    'error': Array<Function>,
    // Fired upon a disconnection.
    'disconnect': Array<Function>,
    // Fired upon a successful reconnection.
    'reconnect': Array<Function>,
    // Fired upon an attempt to reconnect.
    'reconnect_attempt': Array<Function>,
    // Fired upon an attempt to reconnect.
    'reconnecting': Array<Function>,
    // Fired upon a reconnection attempt error.
    'reconnect_error': Array<Function>,
    // Fired when couldn't reconnect within reconnectionAttempts.
    'reconnect_failed': Array<Function>,
    // Fired when gcode errors are found in files...
    'gcode_error': Array<Function>,
    'gcode_error_checking_file': Array<Function>,

    // System ToolChange
    'startup': Array<Function>,
    'config:change': Array<Function>,
    'task:start': Array<Function>,
    'task:finish': Array<Function>,
    'task:error': Array<Function>,
    'serialport:list': Array<Function>,
    'serialport:change': Array<Function>,
    'serialport:open': Array<Function>,
    'serialport:close': Array<Function>,
    'serialport:error': Array<Function>,
    'serialport:read': Array<Function>,
    'serialport:write': Array<Function>,
    'gcode:loaded': Array<Function>, // TO BE DEPRECATED
    'gcode:toolChange': Array<Function>,
    'feeder:status': Array<Function>,
    'workflow:pause': Array<Function>,
    'sender:status': Array<Function>,
    'workflow:state': Array<Function>,
    'controller:settings': Array<Function>,
    'controller:state': Array<Function>,
    'settings:description': Array<Function>,
    'settings:alarm': Array<Function>,
    'message': Array<Function>,
    'toolchange:start': Array<Function>,
    'hPong': Array<Function>,
    'outline:start': Array<Function>,
    'file:load': Array<Function>,
    'file:unload': Array<Function>,
    'homing:flag': Array<Function>,
    'electronErrors:errorList': Array<Function>,
    'firmware:ready': Array<Function>,
    'sender:M0M1': Array<Function>,
    'ip:list': Array<Function>,
    'wizard:next': Array<Function>,
    'realtime_report': Array<Function>,
    'error_clear': Array<Function>,
    'toolchange:acknowledge': Array<Function>,
    'cyclestart_alt': Array<Function>,
    'feedhold_alt': Array<Function>,
    'virtual_stop_toggle': Array<Function>,
    'filetype': Array<Function>,
    'toolchange:preHookComplete': Array<Function>,
    'flash:end': Array<Function>,
    'flash:message': Array<Function>,
    'flash:progress': Array<Function>,
    'spindle:add': Array<Function>,

    //A-Axis A.K.A Rotary-Axis events
    'rotaryAxis:updateState': Array<Function>,
    'updateRotaryMode': Array<Function>,
    'connection:new': Array<Function>,

    'requestEstimateData': Array<Function>,
    'job:start': Array<Function>,
};