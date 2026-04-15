import type { MachineProfile } from "app/definitions/firmware";
import type { BasicPosition, UNITS_EN } from "app/definitions/general";
import type { ProbeProfile } from "app/features/Probe/definitions";
import type { RotarySettings } from "app/features/Rotary/definitions";
import type { Tool } from "app/features/Tools/definitions";
import type { GamepadConfig } from "app/lib/gamepad/definitions";
import type { WORKSPACE_MODE } from "../constants";

// Types

export type WORKSPACE_MODE_T =
	(typeof WORKSPACE_MODE)[keyof typeof WORKSPACE_MODE];

export type Notification = {
	id: string;
	message: string;
	type: "success" | "error" | "info" | "warning";
	status: "read" | "unread";
	timestamp: Date | string;
};

export type BackupFrequencies = "On Update" | "Daily" | "Weekly" | "Monthly";

// Interfaces

export interface Workspace {
	units: UNITS_EN;
	reverseWidgets: boolean;
	spindleFunctions: boolean;
	coolantFunctions: boolean;
	atcEnabled: boolean;
	sendUsageData: boolean;
	safeRetractHeight: number;
	customDecimalPlaces: number;
	jobsFinished: number;
	jobsCancelled: number;
	timeSpentRunning: number;
	longestTimeRun: number;
	defaultFirmware: string;
	outlineMode: string;
	outlineSpeed: number | null;
	revertWorkspace: boolean;
	promptExit: boolean;
	backupFreq: BackupFrequencies;
	lastBackupTime: number;
	park: object;
	jobTimes: number[];
	toolChange: {
		passthrough: boolean;
		skipDialog: boolean;
		moveToManualPosition: boolean;
		manualPosition: BasicPosition;
	};
	toolChangeOption:
		| "Ignore"
		| "Pause"
		| "Standard Re-zero"
		| "Flexible Re-zero"
		| "Fixed Tool Sensor"
		| "Code";
	toolChangePosition: BasicPosition;
	toolChangeHooks: {
		preHook: string;
		postHook: string;
	};
	container: {
		primary: {
			show: boolean;
			widgets: string[];
		};
		default: {
			widgets: string[];
		};
	};
	machineProfile: MachineProfile;
	probeProfile: ProbeProfile;
	tools: Tool[];
	recentFiles: string[];
	gamepad: GamepadConfig;
	terminal: {
		inputHistory: string[];
	};
	mode: WORKSPACE_MODE_T;
	rotaryAxis: {
		firmwareSettings: RotarySettings;
		defaultFirmwareSettings: RotarySettings;
		forceHardLimits: boolean;
		forceSoftLimits: boolean;
		useAaxisForGrbl: boolean;
	};
	shouldWarnZero: boolean;
	diagnostics: {
		stepperMotor: {
			storedValue: number;
		};
	};
	notifications: Notification[];
	toastDuration: number;
	enableDarkMode: boolean;
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
	};
	preventJoggingPastLimits: boolean;
}
