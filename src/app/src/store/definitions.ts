import type { AXES } from "app/constants";
import type {
	EEPROMDescriptions,
	EEPROMSettings,
	FIRMWARE_TYPES_T,
} from "app/definitions/firmware";
import type {
	BasicObject,
	BasicPosition,
	BBox,
	GRBL_ACTIVE_STATES_T,
	MDI,
	Shuttle,
} from "app/definitions/general";
import type { Connection } from "app/features/Connection/definitions";
import type { Console } from "app/features/Console/definitions";
import type { JobStatus } from "app/features/FileControl/definitions";
import type { JogSpeed } from "app/features/Jogging/definitions";
import type { Location } from "app/features/Location/definitions";
import type { Probe } from "app/features/Probe/definitions";
import type { Rotary } from "app/features/Rotary/definitions";
import type { Spindle, SpindleState } from "app/features/Spindle/definitions";
import type { Surfacing } from "app/features/Surfacing/definitions";
import type {
	ATC,
	VISUALIZER_TYPES_T,
	Visualizer,
} from "app/features/Visualizer/definitions";
import type { Modal } from "app/lib/definitions/gcode_virtualization";
import type { Feeder, Sender } from "app/lib/definitions/sender_feeder";
import type { CommandKeys } from "app/lib/definitions/shortcuts";
import type { Notification, Workspace } from "app/workspace/definitions";
import type {
	FILE_TYPE,
	RENDER_STATE,
	TOGGLE_STATUS,
	WORKFLOW_STATES,
} from "../constants";

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

export type AXES_T = (typeof AXES)[keyof typeof AXES];

export interface Axes {
	minimized: boolean;
	axes: AXES_T[];
	jog: {
		xyStep: number;
		zStep: number;
		aStep: number;
		feedrate: number;
		keypad: boolean;
		rapid: JogSpeed;
		normal: JogSpeed;
		precise: JogSpeed;
		step: number;
		threshold: number;
		distances: number[];
	};
	mdi: MDI;
	shuttle: Shuttle;
}

export interface AlarmsData {
	[key: number]: { description: string; id: number } ;
}

export interface ControllerSettings {
	toolTable?: BasicObject;
	//TODO
	parameters: BasicObject;
	settings: EEPROMSettings;
	info?: FirmwareOptions;
	descriptions?: EEPROMDescriptions;
	groups: BasicObject;
	alarms?: AlarmsData;
	version?: {
		semver: number;
	};
	atci?: {
		rack_set: string;
		macro_aborted: number;
	}
}

export interface gSenderInfo {
	releaseNotes: object;
	hasUpdate: boolean;
}

export interface SDCardFile {
	name: string;
	size: number;
	unusable?: boolean;
}

export interface ControllerStateState {
	status: {
		activeState: GRBL_ACTIVE_STATES_T;
		mpos: BasicPosition;
		wpos: BasicPosition;
		ov: [number, number, number];
		sdFiles: [];
		alarmCode: string;
		subState: number;
		probeActive: boolean;
		pinState: {
			P: boolean
		};
		currentTool: number;
		hasHomed: boolean;
		buf: {
			planner: number;
			rx: number;
		};
		feedrate: number;
		spindle: number;
		ovTimestamp: number;
		keepout: {
			flags: string[];
		};
		SD: {
			name: string;
			percentage: number;
		};
		wco: BasicPosition;
		sdCard: boolean;
	},
	parserstate: {
		modal: {
			motion: "G0" | "G1" | "G2" | "G3" | "G38.2" | "G38.3" | "G38.4" | "G38.5" | "G80",
			wcs: "G54" | "G55" | "G56" | "G57" | "G58" | "G59",
			plane: "G17" | "G18" | "G19", // G17: xy-plane, G18: xz-plane, G19: yz-plane
			units: "G20" | "G21", // G20: Inches, G21: Millimeters
			distance: "G90" | "G91", // G90: Absolute, G91: Relative
			feedrate: "G93" | "G94", // G93: Inverse time mode, G94: Units per minute
			program: "M0" | "M1" | "M2" | "M30", // M0, M1, M2, M30
			spindle: "M3" | "M4" | "M5", // M3: Spindle (cw), M4: Spindle (ccw), M5: Spindle off
			coolant: "M7" | "M8" | "M9", // M7: Mist coolant, M8: Flood coolant, M9: Coolant off, [M7,M8]: Both on
			tool: number | string, // Last non-0 parsed tool
		},
		tool: string,
		feedrate: string,
		spindle: string,
	}
}

export interface ControllerState {
	type: FIRMWARE_TYPES_T;
	settings: ControllerSettings;
	state: ControllerStateState;
	modal: Modal;
	mpos: BasicPosition;
	wpos: BasicPosition;
	wco: BasicPosition;
	homingFlag: boolean;
	hasHomed: boolean;
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
	sdcard: {
		isMounted: boolean;
		files: Array<{
			fileName: string;
			fileSize: number;
		}>;
	};
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
	usedAxes: Array<string>;
}

export interface PreferencesState {
	shortcuts: {
		list: CommandKeys;
		shouldHold: boolean;
	};
	ipList: Array<string>;
	notifications: Notification[];
	accessibility: {
		statusAnnouncements: boolean;
		jobProgressAnnouncements: boolean;
		jobProgressIncrement: number;
		focusRings: boolean;
		focusTrapping: boolean;
		visualizerKeyboardControl: boolean;
		audioCues: {
			enabled: boolean;
			jobComplete: boolean;
			alarmTriggered: boolean;
			toolChange: boolean;
			probeSuccess: boolean;
		};
		reducedMotion: boolean;
		gcodeSummary: {
			enabled: boolean;
			showVisually: boolean;
		};
		showKeyboardMap: boolean;
		displayScaleFactor?: string;
	};
	preventJoggingPastLimits: boolean;
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
		atc: ATC;
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

export interface ShortcutSliceState {
	isFinished: boolean;
}
