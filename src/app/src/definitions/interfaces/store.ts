import {
    FILE_TYPE_T,
    RENDER_STATE_T,
    TOGGLE_STATUS_T,
    VISUALIZER_TYPES_T,
    WORKFLOW_STATES_T,
} from "../types"
import { ControllerSettings } from "./controller"
import { FeedrateChanges, ModalChanges, PDData } from "./gcode_virtualization"
import { BBox } from "./general"
import { FeederStatus, SenderStatus } from "./Sender_Feeder"
import { CommandKeys } from "./shortcuts"

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