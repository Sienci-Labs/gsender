import {
    WORKFLOW_STATES_T,
    SHORTCUT_CATEGORY_T,
    RENDER_STATE_T,
    EEPROM,
    MOTION,
    WCS,
    PLANE,
    UNITS_GCODE,
    DISTANCE,
    ARC,
    FEEDRATE,
    CUTTER,
    TLO,
    PROGRAM,
    SPINDLE,
    COOLANT,
    TOOL,
    PROBE_DIRECTIONS,
    UNITS_EN,
    FIRMWARE_TYPES_T,
    TOUCHPLATE_TYPES_T,
    PROBE_TYPES_T,
    FILE_TYPE_T,
    VISUALIZER_TYPES_T,
    TOGGLE_STATUS_T,
    AXES_T,
    BasicType
} from "./types";

export interface BasicObject {
    [key: string]: string | number | boolean | Array<any> | BasicObject,
};

export interface BBox {
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
}

export interface AlarmsErrors {
    type: string,
    source: string,
    time: Date,
    CODE: number,
    MESSAGE: string,
    lineNumber: number,
    line: string,
    controller: "GRBL" | "grblHAL",
};

export interface CommandKey {
    cmd: string
    keys: string,
    isActive: boolean
    title: string,
    payload: object,
    preventDefault: false,
    category: SHORTCUT_CATEGORY_T,
    callback: Function
};

export interface CommandKeys {
    [key: string]: CommandKey | undefined
};

export interface ShuttleEvent {
    title: string,
    keys: string,
    gamepadKeys: string,
    keysName: string,
    cmd: string,
    payload: object,
    preventDefault: false,
    isActive: true,
    category: SHORTCUT_CATEGORY_T,
    callback: Function
};

export interface ShuttleControlEvents {
    [key: string]: ShuttleEvent | Function,
    MACRO: Function
};

export interface Macro {
    id: string,
    mtime: string,
    name: string,
    content: string,
    description: string,
    column: string,
    rowIndex: number
};

export interface Shortcut {
    keys: string,
    callback: Function
};

export interface EEPROMSettings {
    [key: EEPROM]: string
};

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
};

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
};

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
};

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
};

export interface ControllerSettings { //TODO
    parameters: object,
    settings: EEPROMSettings,
    info: FirmwareOptions,
    descriptions: EEPROMDescriptions
    groups: object,
    alarms: object,
};

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
        state: WORKFLOW_STATES_T
    },
    tool: {
        context: object
    },
    terminalHistory: Array<string>,
    spindles: Array<object>
};

export interface PortInfo {
    port: string,
    manufacturer?: string,
    inuse: boolean
};

export interface ConnectionInfo {
    isConnected: boolean,
    isScanning: boolean,
    port: string,
    baudrate: number,
    ports: Array<PortInfo>,
    unrecognizedPorts: Array<PortInfo>,
    networkPorts: Array<PortInfo>,
    err: string,
};

export interface FileInfo {
    fileLoaded: boolean,
    fileProcessing: boolean,
    renderState: RENDER_STATE_T,
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
    bbox: BBox,
    content: string,
    fileType: FILE_TYPE_T,
};

export interface PreferencesInfo {
    shortcuts: {
        list: CommandKeys,
        shouldHold: boolean,
    },
    ipList: Array<number>,
}

export interface VisualizerInfo {
    activeVisualizer: VISUALIZER_TYPES_T,
    jobOverrides: { isChecked: boolean, toggleStatus: TOGGLE_STATUS_T }
}

export interface ReduxState {
    controller: ControllerInfo,
    connection: ConnectionInfo,
    file: FileInfo,
    visualizer: VisualizerInfo,
    preferences: PreferencesInfo,
};

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

export interface i18n__Options {
    context: object,
    count: number,
    defaultValue: string,
};

export interface BasicPosition {
    x: number,
    y: number,
    z: number,
    a: number
};

export interface LineData {
    v0?: BasicPosition,
    v1: BasicPosition,
    v2: BasicPosition,
    shouldUseAddCurve: boolean
};

export interface PDData {
    Scode: string,
    lineData: LineData
};

export interface FeedrateChanges {
    change: number,
    count: number
};

export interface Modal {
    motion?: MOTION,
    wcs?: WCS,
    plane?: PLANE,
    units?: UNITS_GCODE,
    distance?: DISTANCE,
    arc?: ARC,
    feedrate?: FEEDRATE,
    cutter?: CUTTER,
    tlo?: TLO,
    program?: PROGRAM,
    spindle?: SPINDLE,
    coolant?: COOLANT,
    tool?: TOOL
}

export interface ModalChanges {
    change: Modal,
    count: number
};

export interface ParsedData {
    id: string,
    data: Array<PDData>,
    estimates: Array<number>
    feedrateChanges: Array<FeedrateChanges>,
    modalChanges: Array<ModalChanges>,
    info: FileInfo
};

export interface EstimateData {
    estimates: Array<number>,
    estimatedTime: number
};

export interface ProbingOptions {
    modal: string,
    units: UNITS_EN,
    toolDiameter: PROBE_TYPES_T | number,
    xRetractModifier: number,
    yRetractModifier: number,
    xRetract: number,
    yRetract: number,
    zRetract: number,
    retract: number,
    axes: BasicPosition,
    xProbeDistance: number,
    yProbeDistance: number,
    zProbeDistance: number,
    probeDistances: BasicPosition,
    probeFast: number,
    probeSlow: number,
    zThickness: number,
    xThickness: number,
    yThickness: number,
    xyThickness: number,
    firmware: FIRMWARE_TYPES_T,
    xyPositionAdjust: number,
    zPositionAdjust: number,
    direction: PROBE_DIRECTIONS,
    $13: '0' | '1',
    plateType: TOUCHPLATE_TYPES_T,
};

export interface RotaryModeFirmwareSettings {
    $101: string,
    $111: string,
    $20: string,
    $21: string,
};

export interface ProbeWidgetSettings {
    slowSpeed: number,
    fastSpeed: number,
    retract: number,
    zProbeDistance: number,
    zProbeThickness: number,
};

export interface SignInParams {
    token: string,
    name?: string,
    password?: string,
};

export interface ValidationProps {
    type: string,
    name: string
    checked: boolean
}

export interface ValidationComponent {
    blurred: boolean,
    changed: boolean,
    value: string,
}

export interface ValidationComponents {
    password: Array<ValidationComponent>,
    confirm: Array<ValidationComponent>,
}

export interface RequiredComponent {
    [key: string]: Array<{checked: boolean, props: ValidationProps}>
}


export interface GamepadDetail {
    detail: {
        index: number,// Gamepad index: Number [0-3].
        button: number, // Button index: Number [0-N].
        axis: number, // Axis index: Number [0-N].
        value: number, // Current value: Number between 0 and 1. Float in analog mode, integer otherwise.
        pressed: boolean, // Native GamepadButton pressed value: Boolean.
        gamepad: globalThis.Gamepad, // Native Gamepad object
    }
};

export interface GamepadConfig {
    deadZone: number,
    precision: number,
};

export interface GamepadButton {
    label: string;
    value: number;
    primaryAction: string;
    secondaryAction: string;
};

export interface Stick {
    primaryAction: AXES_T,
    secondaryAction: AXES_T,
    isReversed: boolean,
}
export interface JoystickOptions {
    stick1: {
        horizontal: Stick,
        vertical: Stick,
        mpgMode: Stick,
    },
    stick2: {
        horizontal: Stick,
        vertical: Stick,
        mpgMode: Stick,
    },
    zeroThreshold: number,
    movementDistanceOverride: number,
};
export interface GamepadProfile {
    id: Array<string>,
    icon: string,
    active: boolean,
    profileName: string,
    shortcuts: CommandKey,
    name: string,
    mapping: 'standard',
    buttons: Array<GamepadButton>,
    axes: [number, number, number, number],
    joystickOptions: JoystickOptions,
    lockout: {
        button: number | null,
        active: boolean,
    },
    modifier: {
        button: boolean,
    },
};

export interface GcodeProcessorController {
    mpos: Array<number>,
    getPos: Function,
    pos: Array<number>,
    activeCoordSys: number,
    coordSysOffsets: Array<number>
    offset: Array<number>,
    offsetEnabled: boolean,
    storedPositions: Array<number>,
    units: UNITS_EN,
    feed: number,
    incremental: boolean,
    coolant: number,
    spindle: boolean,
    line: number,
    spindleDirection: number,
    spindleSpeed: number,
    inverseFeed: boolean,
    motionMode: `G${string}`,
    arcPlane: number,
    tool: string,
    axisLabels: Array<number>
};

export interface GcodeProcessorOptions {
    maxFeed: number,
    acceleration: number,
    noInit: boolean,
    controller: GcodeProcessorController,
    tightcnc: {
        controller: GcodeProcessorController,
    },
    axisLabels: Array<string>,
    minMoveTime: number,
};

export interface GCodeLine {
    line: string,
    words: Array<Array<string>>
};

export interface SeenWordSet {
    [key: string]: boolean
};

export interface VMStateInfo {
    state: VMState, // VM state after executing line
    isMotion: boolean, // whether the line represents motion
    motionCode: BasicType, // If motion, the G code associated with the motion
    changedCoordOffsets: boolean, // whether or not anything was changed with coordinate systems
    time: number // estimated duration of instruction execution, in seconds
};

export interface VMState {
    feedrates: Set<string>,
    tools: Set<string>,
    spindleRates: Set<string>,
    invalidGcode: Set<string>,

    coord: Function,
    totalTime: number; // seconds
    bounds: [Array<number>, Array<number>], // min and max points
    mbounds: [Array<number>, Array<number>], // bounds for machine coordinates
    lineCounter: number,
    hasMovedToAxes: Array<boolean>, // true for each axis that we've moved on, and have a definite position for
    seenWordSet: SeenWordSet, // a mapping from word letters to boolean true if that word has been seen at least once
    usedAxes: Set<AXES_T>,
    tool: string,
    countT: number;
    countM6: number;
    axisLabels: Array<AXES_T>,
    mpos: Array<number>,
    pos: Array<number>,
    activeCoordSys: number,
    coordSysOffsets: Array<Array<number>>,
    offset: Array<number>,
    offsetEnabled: boolean,
    storedPositions: [Array<number>, Array<number>],
    units: UNITS_EN,
    feed: number,
    incremental: boolean,
    coolant: number,
    spindle: boolean,
    line: number,
    spindleDirection: number,
    spindleSpeed: number,
    inverseFeed: boolean,
    motionMode: `G${string}`,
    arcPlane: number,
};

export interface SyncMachineOptions {
    include: string,
    exclude: string,
    controller: GcodeProcessorController,
    vmState: VMState,
}
