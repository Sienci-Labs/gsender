import {
    FILE_TYPE,
    WORKFLOW_STATES,
    RENDER_STATE,
    TOGGLE_STATUS,
} from '../constants';
import { EEPROMSettings, EEPROMDescriptions } from 'app/definitions/firmware';
import { BasicObject, BasicPosition, BBox } from 'app/definitions/general';
import { Axes } from 'app/features/Axes/definitions';
import { Connection } from 'app/features/Connection/definitions';
import { Console } from 'app/features/Console/definitions';
import { JobStatus } from 'app/features/FileControl/definitions';
import { Location } from 'app/features/Location/definitions';
import { Probe } from 'app/features/Probe/definitions';
import { Rotary } from 'app/features/Rotary/definitions';
import { Spindle, SpindleState } from 'app/features/Spindle/definitions';
import { Surfacing } from 'app/features/Surfacing/definitions';
import {
    VISUALIZER_TYPES_T,
    Visualizer,
} from 'app/features/Visualizer/definitions';
import {
    Modal,
    PDData,
    FeedrateChanges,
    ModalChanges,
} from 'app/lib/definitions/gcode_virtualization';
import { Feeder, Sender } from 'app/lib/definitions/sender_feeder';
import { CommandKeys } from 'app/lib/definitions/shortcuts';
import { Notification, Workspace } from 'app/workspace/definitions';

// Types

export type FILE_TYPE_T = (typeof FILE_TYPE)[keyof typeof FILE_TYPE];
export type WORKFLOW_STATES_T =
    (typeof WORKFLOW_STATES)[keyof typeof WORKFLOW_STATES];
export type RENDER_STATE_T = (typeof RENDER_STATE)[keyof typeof RENDER_STATE];
export type TOGGLE_STATUS_T =
    (typeof TOGGLE_STATUS)[keyof typeof TOGGLE_STATUS];

// Interfaces
// Redux States

export interface FirmwareOptions {
    OPT: string;
    NEWOPT: string;
    FIRMWARE: string;
    NVS_STORAGE: string;
    FREE_MEMORY: string;
    DRIVER: string;
    DRIVER_VERSION: string;
    BOARD: string;
    AUX_IO: string;
    WIZCHIP: string;
    IP: string;
    PLUGIN: string;
    SPINDLE: string;
}

export interface ControllerSettings {
    //TODO
    parameters: BasicObject;
    settings: EEPROMSettings;
    info?: FirmwareOptions;
    descriptions?: EEPROMDescriptions;
    groups: BasicObject;
    alarms: BasicObject;
}

export interface gSenderInfo {
    releaseNotes: object;
    hasUpdate: boolean;
}

export interface ControllerState {
    type: string;
    settings: ControllerSettings;
    state: any;
    modal: Modal;
    mpos: BasicPosition;
    wpos: BasicPosition;
    homingFlag: boolean;
    homingRun: boolean;
    feeder: Feeder;
    sender: Sender;
    workflow: {
        state: WORKFLOW_STATES_T;
    };
    tool: {
        context: BasicObject;
    };
    terminalHistory: Array<string>;
    spindles: Array<Spindle>;
}

export interface PortInfo {
    port: string;
    manufacturer?: string;
    inuse: boolean;
}

export interface ConnectionState {
    isConnected: boolean;
    isScanning: boolean;
    port: string;
    baudrate: string;
    ports: Array<PortInfo>;
    unrecognizedPorts: Array<PortInfo>;
    networkPorts: Array<PortInfo>;
    err: string;
}

export interface HelperState {
    wizardActive: boolean;
    infoHelperActive: boolean;
    wizardMinimized: boolean;
    infoHelperMinimized: boolean;
    title: string;
    metadata: object;
}

export interface FileInfoState {
    fileLoaded: boolean;
    fileProcessing: boolean;
    renderState: RENDER_STATE_T;
    name: string;
    path: string;
    size: number;
    total: number;
    toolSet: Array<string>;
    spindleSet: Array<string>;
    movementSet: Array<string>;
    invalidGcode: Array<string>;
    estimatedTime: number;
    fileModal: string;
    bbox: BBox;
    content: string;
    fileType: FILE_TYPE_T;
}

export interface PreferencesState {
    shortcuts: {
        list: CommandKeys;
        shouldHold: boolean;
    };
    ipList: Array<string>;
    notifications: Notification[];
}

export interface VisualizerState {
    activeVisualizer: VISUALIZER_TYPES_T;
    jobOverrides: {
        isChecked: boolean;
        toggleStatus: TOGGLE_STATUS_T;
    };
}

export interface ReduxState {
    controller: ControllerState;
    connection: ConnectionState;
    file: FileInfoState;
    visualizer: VisualizerState;
    preferences: PreferencesState;
}

// Indexed DB

export interface ParsedData {
    id: string;
    data: Array<PDData>;
    estimates: Array<number>;
    feedrateChanges: Array<FeedrateChanges>;
    modalChanges: Array<ModalChanges>;
    info: FileInfoState;
}

export interface EstimateData {
    estimates: Array<number>;
    estimatedTime: number;
}

// Front-end State

export interface GRBL {
    minimized: boolean;
    panel: {
        queueReports: {
            expanded: boolean;
        };
        statusReports: {
            expanded: boolean;
        };
        modalGroups: {
            expanded: boolean;
        };
    };
}

export interface Session {
    name: string;
    token: string;
}

export interface State {
    session: Session;
    workspace: Workspace;
    widgets: {
        axes: Axes;
        connection: Connection;
        console: Console;
        job_status: JobStatus;
        grbl: GRBL;
        location: Location;
        macro: {
            minimized: boolean;
        };
        probe: Probe;
        rotary: Rotary;
        spindle: SpindleState;
        surfacing: Surfacing;
        visualizer: Visualizer;
    };
    commandKeys: CommandKeys;
}

export interface SerialPortOptions {
    port: string;
    inuse: boolean;
}

export interface ConsoleState {
    history: string[];
    inputHistory: string[];
}
