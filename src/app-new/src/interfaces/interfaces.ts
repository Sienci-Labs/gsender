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
