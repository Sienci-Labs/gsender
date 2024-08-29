import {
    FILE_TYPE_T,
    RENDER_STATE_T,
    TOGGLE_STATUS_T,
    VISUALIZER_TYPES_T,
    WORKFLOW_STATES_T,
} from "../types"
import { ControllerSettings } from "./controller"
import { FeedrateChanges, Modal, ModalChanges, PDData } from "./gcode_virtualization"
import { BasicObject, BasicPosition, BBox } from "./general"
import { Feeder, Sender } from "./sender_feeder"
import { CommandKeys } from "./shortcuts"
import { Axes } from "./widgets/axes"
import { Connection } from "./widgets/connection"
import { Console } from "./widgets/console"
import { GRBL } from "./widgets/grbl"
import { JobStatus } from "./widgets/job_status"
import { Location } from "./widgets/location"
import { Macro } from "./widgets/macro"
import { Probe } from "./widgets/probe"
import { Rotary } from "./widgets/rotary"
import { Spindle } from "./widgets/spindle"
import { Surfacing } from "./widgets/surfacing"
import { Visualizer } from "./widgets/visualizer"
import { Workspace } from "./workspace"

// Redux States
export interface ControllerState {
    type: string,
    settings: ControllerSettings,
    state: any,
    modal: Modal,
    mpos: BasicPosition,
    wpos: BasicPosition,
    homingFlag: boolean,
    homingRun: boolean,
    feeder: Feeder,
    sender: Sender,
    workflow: {
        state: WORKFLOW_STATES_T
    },
    tool: {
        context: BasicObject
    },
    terminalHistory: Array<string>,
    spindles: Array<BasicObject>
};

export interface PortInfo {
    port: string,
    manufacturer?: string,
    inuse: boolean
};

export interface ConnectionState {
    isConnected: boolean,
    isScanning: boolean,
    port: string,
    baudrate: string,
    ports: Array<PortInfo>,
    unrecognizedPorts: Array<PortInfo>,
    networkPorts: Array<PortInfo>,
    err: string,
};

export interface FileInfoState {
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

export interface PreferencesState {
    shortcuts: {
        list: CommandKeys,
        shouldHold: boolean,
    },
    ipList: Array<string>,
};

export interface VisualizerState {
    activeVisualizer: VISUALIZER_TYPES_T,
    jobOverrides: {
        isChecked: boolean,
        toggleStatus: TOGGLE_STATUS_T
    }
};

export interface ReduxState {
    controller: ControllerState,
    connection: ConnectionState,
    file: FileInfoState,
    visualizer: VisualizerState,
    preferences: PreferencesState,
};


// Indexed DB
export interface ParsedData {
    id: string,
    data: Array<PDData>,
    estimates: Array<number>
    feedrateChanges: Array<FeedrateChanges>,
    modalChanges: Array<ModalChanges>,
    info: FileInfoState
};

export interface EstimateData {
    estimates: Array<number>,
    estimatedTime: number
};


// Front-end State

export interface Session {
    name: string,
    token: string,
};

export interface DefaultState {
    session: Session,
    workspace: Workspace,
    widgets: {
        axes: Axes,
        connection: Connection,
        console: Console,
        job_status: JobStatus,
        grbl: GRBL,
        location: Location,
        macro: Macro,
        probe: Probe,
        rotary: Rotary,
        spindle: Spindle,
        surfacing: Surfacing,
        visualizer: Visualizer
    };
    commandKeys: CommandKeys;
}