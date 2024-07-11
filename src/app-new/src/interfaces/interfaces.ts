import { RENDER_STATE, SHORTCUT_CATEGORY, WORKFLOW_STATES } from "../constants"

export interface AlarmsErrors {
    type: string,
    source: string,
    time: Date,
    CODE: number,
    MESSAGE: string,
    lineNumber: number,
    line: string,
    controller: "GRBL" | "grblHAL",
}

export interface CommandKey {
    cmd: string
    keys: string,
    isActive: boolean
    title: string,
    payload: object,
    preventDefault: false,
    category: SHORTCUT_CATEGORY,
    callback: Function
};

export interface CommandKeys {
    [key: string]: CommandKey | undefined
}

export interface ShuttleEvent {
    title: string,
    keys: string,
    gamepadKeys: string,
    keysName: string,
    cmd: string,
    payload: object,
    preventDefault: false,
    isActive: true,
    category: SHORTCUT_CATEGORY,
    callback: Function
}

export interface ShuttleControlEvents {
    [key: string]: ShuttleEvent | Function,
    MACRO: Function
}

export interface Macro {
    id: string,
    mtime: string,
    name: string,
    content: string,
    description: string,
    column: string,
    rowIndex: number
}

export interface Shortcut {
    keys: string,
    callback: Function
}

type EEPROM = `$${string}`;

export interface EEPROMSettings {
    [key: EEPROM]: string
}

export interface MachineProfile {
    id: number,
    company: string,
    name: string,
    type: string,
    version: string,
    mm: {
        width: number,
        depth: number,
        height: number
    },
    in: {
        width: number,
        depth: number,
        height: number
    },
    endstops: boolean,
    spindle: boolean,
    coolant: boolean,
    laser: boolean,
    eepromSettings?: EEPROMSettings,
    grblHALeepromSettings?: EEPROMSettings
}

// export interface Spindles {
//     order: number
//     label: 
//     id:0
//     capabilities:"DIV"
//     enabled:true
//     laser:false
//     raw:"0 - SLB_SPINDLE, enabled as spindle 0, DIV, current"
// }

export interface FeederStatus {
    hold: boolean,
    holdReason: {
        data: string,
        comment?: string
    },
    queue: number,
    pending: boolean,
    changed: boolean,
}

export interface SenderStatus {
    sp: number,
    hold: boolean,
    holdReason: {
        data: string,
        comment?: string
    },
    name: string,
    context: { // TODO
        global: object,
        xmin: number,
        xmax: number,
        ymin: number,
        ymax: number,
        zmin: number,
        zmax: number,
        mposx: string,
        mposy: string,
        mposz: string,
        mposa: string,
        mposb: string,
        mposc: string,
        posx: string,
        posy: string,
        posz: string,
        posa: string,
        posb: string,
        posc: string,
        modal: {
            motion: string,
            wcs: string,
            plane: string,
            units: string,
            distance: string,
            feedrate: string,
            spindle: string,
            coolant: string,
        },
        tool: number
        params: object,
        programFeedrate: string,
        Math: object,
        JSON: object,

    },
    size: number,
    total: number,
    sent: number,
    received: number,
    startTime: number,
    finishTime: number,
    elapsedTime: number,
    remainingTime: number,
    toolChanges: number,
    estimatedTime: number,
    ovF: number,
    isRotaryFile: boolean,
    currentLineRunning: number,
}

export interface FirmwareOptions {
    OPT: string,
    NEWOPT: string,
    FIRMWARE: string,
    NVS_STORAGE: string,
    FREE_MEMORY: string,
    DRIVER: string,
    DRIVER_VERSION: string,
    BOARD: string,
    AUX_IO: string,
    WIZCHIP: string,
    IP: string,
    PLUGIN: string,
    SPINDLE: string,
};

export interface EEPROMDescriptions {
    group: number,
    description: string,
    unit: string,
    dataType: number,
    format: string,
    unitString: string,
    details: string,
}

export interface ControllerSettings { //TODO
    parameters: object,
    settings: EEPROMSettings,
    info: FirmwareOptions,
    descriptions: EEPROMDescriptions
    groups: object,
    alarms: object,
}

export interface ControllerInfo { // TODO
    type: string,
    settings: ControllerSettings,
    state: {},
    modal: {},
    mpos: {
        x: number,
        y: number,
        z: number,
        a: number,
        b: number,
        c: number
    },
    wpos: {
        x: number,
        y: number,
        z: number,
        a: number,
        b: number,
        c: number
    },
    homingFlag: boolean,
    homingRun: boolean,
    feeder: {
        status: FeederStatus
    },
    sender: {
        status: SenderStatus
    },
    workflow: {
        state: WORKFLOW_STATES
    },
    tool: {
        context: object
    },
    terminalHistory: Array<string>,
    spindles: Array<object>
}

export interface PortInfo {
    port: string,
    manufacturer?: string,
    inuse: boolean
}

export interface ConnectionInfo {
    isConnected: boolean,
    isScanning: boolean,
    port: string,
    baudrate: number,
    ports: Array<PortInfo>,
    unrecognizedPorts: Array<PortInfo>,
    networkPorts: Array<PortInfo>,
    err: string,
}

export interface FileInfo {
    fileLoaded: boolean,
    fileProcessing: boolean,
    renderState: RENDER_STATE,
    name: string,
    path: string,
    size: number,
    total: number,
    toolSet: Array<string>,
    spindleSet: Array<string>,
    movementSet: Array<string>,
    invalidGcode: Array<string>,
    estimatedTime: number,
    fileModal: string,
    bbox: {
        min: {
            x: number,
            y: number,
            z: number,
        },
        max: {
            x: number,
            y: number,
            z: number,
        },
        delta: {
            x: number,
            y: number,
            z: number,
        }
    },
    content: string,
}

export interface JogSpeeds {
    rapid: {
        xyStep: string,
        zStep: string,
        feedrate: string,
    },
    normal: {
        xyStep: string,
        zStep: string,
        feedrate: string,
    },
    precise: {
        xyStep: string,
        zStep: string,
        feedrate: string,
    }
}

export interface ControllerListeners {
    [key: string]: Array<Function>,
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
}
