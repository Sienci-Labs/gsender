
import { WORKSPACE_MODE } from "app/constants";
import { TOUCHPLATE_TYPE_3D, TOUCHPLATE_TYPE_AUTOZERO, TOUCHPLATE_TYPE_BITZERO, TOUCHPLATE_TYPE_STANDARD, TOUCHPLATE_TYPE_ZERO } from "app/lib/constants";
jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		portOpen: false,
		command: jest.fn(),
		settings: { settings: {} },
	},
}));

jest.mock("app/store", () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		set: jest.fn(),
		replace: jest.fn(),
	},
}));

jest.mock("app/store/redux", () => ({
	__esModule: true,
	default: {
		getState: jest.fn(() => ({})),
		dispatch: jest.fn(),
	},
}));

jest.mock("app/store/redux/slices/controller.slice", () => ({
	updatePartialControllerSettings: jest.fn((payload) => ({
		type: "controller/updatePartialControllerSettings",
		payload,
	})),
}));

jest.mock("is-electron", () => ({
	__esModule: true,
	default: jest.fn(() => false),
}));

jest.mock("posthog-js", () => ({
	__esModule: true,
	default: {
		opt_in_capturing: jest.fn(),
		opt_out_capturing: jest.fn(),
	},
}));

jest.mock("pubsub-js", () => ({
	__esModule: true,
	default: {
		publish: jest.fn(),
	},
}));

jest.mock("app/lib/rotary", () => ({
	updateWorkspaceMode: jest.fn(),
}));

jest.mock("app/lib/units", () => ({
	convertToImperial: jest.fn((v) => v / 25.4),
}));

jest.mock("app/lib/rounding", () => ({
	round: jest.fn((v) => v),
	roundMetric: jest.fn((v) => v),
}));

jest.mock("app/features/Helper/Wizard.tsx", () => ({
	updateToolchangeContext: jest.fn(),
}));

import controller from "app/lib/controller.ts";
import store from "app/store";
import reduxStore from "app/store/redux";
import { updatePartialControllerSettings } from "app/store/redux/slices/controller.slice";
import isElectron from "is-electron";
import posthog from "posthog-js";
import pubsub from "pubsub-js";
import { updateWorkspaceMode } from "app/lib/rotary";
import { updateToolchangeContext } from "app/features/Helper/Wizard.tsx";
import { SettingsMenu } from "../assets/SettingsMenu";

// ---- helpers ----

/** Recursively flatten every gSenderSetting out of the menu tree. */
function flattenSettings(menu: typeof SettingsMenu) {
	const flat: any[] = [];
	for (const section of menu) {
		for (const sub of section.settings ?? []) {
			for (const setting of sub.settings ?? []) {
				flat.push(setting);
			}
		}
	}
	return flat;
}

function findByKey(menu: typeof SettingsMenu, key: string) {
	return flattenSettings(menu).find((s) => s.key === key);
}

function findByLabel(menu: typeof SettingsMenu, label: string) {
	return flattenSettings(menu).find((s) => s.label === label);
}

const mockedStoreGet = store.get as jest.Mock;
const mockedStoreSet = store.set as jest.Mock;
const mockedStoreReplace = store.replace as jest.Mock;
const mockedIsElectron = isElectron as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockedStoreGet.mockReturnValue(undefined);
	(controller as any).portOpen = false;
});

// ---- structural sanity ----

describe("SettingsMenu structure", () => {
	it("exports a non-empty array of sections", () => {
		expect(Array.isArray(SettingsMenu)).toBe(true);
		expect(SettingsMenu.length).toBeGreaterThan(0);
	});

	it("every section has a label and an icon", () => {
		for (const section of SettingsMenu) {
			expect(typeof section.label).toBe("string");
			expect(section.label.length).toBeGreaterThan(0);
			expect(section.icon).toBeDefined();
		}
	});

	it("has no duplicate top-level section labels", () => {
		const labels = SettingsMenu.map((s) => s.label);
		expect(new Set(labels).size).toBe(labels.length);
	});

	it("every setting with a key is unique across the whole menu", () => {
		const keys = flattenSettings(SettingsMenu)
			.map((s) => s.key)
			.filter(Boolean);
		const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
		expect(duplicates).toEqual([]);
	});
});

// ---- Baud rate: disabled() ----

describe('"Baud rate" setting - disabled()', () => {
	it("is disabled when the port is open", () => {
		(controller as any).portOpen = true;
		const setting = findByKey(SettingsMenu, "widgets.connection.baudrate");
		expect(setting?.disabled?.()).toBe(true);
	});

	it("is enabled when the port is closed", () => {
		(controller as any).portOpen = false;
		const setting = findByKey(SettingsMenu, "widgets.connection.baudrate");
		expect(setting?.disabled?.()).toBe(false);
	});
});

// ---- Power Saving / Prompt on exit: onEnable / onDisable guarded by isElectron ----

describe('"Power Saving" setting - onEnable/onDisable', () => {
	it("does not touch ipcRenderer when not running in electron", () => {
		mockedIsElectron.mockReturnValue(false);
		const setting = findByKey(SettingsMenu, "workspace.powerSaving");
		expect(() => setting?.onEnable?.()).not.toThrow();
		expect(() => setting?.onDisable?.()).not.toThrow();
	});

	it("sends change-power-saving true/false via ipcRenderer when in electron", () => {
		mockedIsElectron.mockReturnValue(true);
		const send = jest.fn();
		(window as any).ipcRenderer = { send };

		const setting = findByKey(SettingsMenu, "workspace.powerSaving");
		setting?.onEnable?.();
		expect(send).toHaveBeenCalledWith("change-power-saving", true);

		setting?.onDisable?.();
		expect(send).toHaveBeenCalledWith("change-power-saving", false);
	});
});

describe('"Prompt on exit" setting - onEnable/onDisable', () => {
	it("sends assignPromptExit true/false via ipcRenderer when in electron", () => {
		mockedIsElectron.mockReturnValue(true);
		const send = jest.fn();
		(window as any).ipcRenderer = { send };

		const setting = findByKey(SettingsMenu, "workspace.promptExit");
		setting?.onEnable?.();
		expect(send).toHaveBeenCalledWith("assignPromptExit", true);

		setting?.onDisable?.();
		expect(send).toHaveBeenCalledWith("assignPromptExit", false);
	});
});

// ---- Run settings backup / Settings backup location: hidden() guarded by isElectron ----

describe('"Run settings backup" and "Settings backup location" - hidden()', () => {
	it("are hidden outside electron", () => {
		mockedIsElectron.mockReturnValue(false);
		const backupFreq = findByKey(SettingsMenu, "workspace.backupFreq");
		const backupLoc = findByKey(SettingsMenu, "workspace.backupLoc");
		expect(backupFreq?.hidden?.(mockedStoreGet)).toBe(true);
		expect(backupLoc?.hidden?.(mockedStoreGet)).toBe(true);
	});

	it("are shown inside electron", () => {
		mockedIsElectron.mockReturnValue(true);
		const backupFreq = findByKey(SettingsMenu, "workspace.backupFreq");
		expect(backupFreq?.hidden?.(mockedStoreGet)).toBe(false);
	});
});

// ---- Collect usage data: valueTransform + onApply ----

describe('"Collect usage data" setting', () => {
	const setting = () =>
		findByKey(SettingsMenu, "workspace.collectUsageDataStatus");

	it("valueTransform treats 'accepted' and true as truthy, everything else falsy", () => {
		expect(setting()?.valueTransform?.("accepted")).toBe(true);
		expect(setting()?.valueTransform?.(true)).toBe(true);
		expect(setting()?.valueTransform?.("denied")).toBe(false);
		expect(setting()?.valueTransform?.(false)).toBe(false);
	});

	it("onApply persists 'accepted' and opts in to posthog when toggle is true", () => {
		mockedStoreGet.mockReturnValue(true);
		setting()?.onApply?.();
		expect(mockedStoreReplace).toHaveBeenCalledWith(
			"workspace.collectUsageDataStatus",
			"accepted",
		);
		expect(posthog.opt_in_capturing).toHaveBeenCalled();
		expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
	});

	it("onApply persists 'denied' and opts out of posthog when toggle is false", () => {
		mockedStoreGet.mockReturnValue(false);
		setting()?.onApply?.();
		expect(mockedStoreReplace).toHaveBeenCalledWith(
			"workspace.collectUsageDataStatus",
			"denied",
		);
		expect(posthog.opt_out_capturing).toHaveBeenCalled();
		expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
	});
});

// ---- Visualizer theme: onChange ----

describe('"Visualizer theme" setting - onChange()', () => {
	it("publishes theme:change with the selected theme", () => {
		const setting = findByKey(SettingsMenu, "widgets.visualizer.theme");
		setting?.onChange?.("dark");
		expect(pubsub.publish).toHaveBeenCalledWith("theme:change", "dark");
	});
});

// ---- Show bounding box / labels / machine bed / trim grid: onChange ----

describe("visualizer boolean toggles - onChange()", () => {
	it.each([
		["widgets.visualizer.objects.limits.visible"],
		["widgets.visualizer.boundingBoxLabels"],
		["widgets.visualizer.objects.machineBed.visible"],
		["widgets.visualizer.objects.machineBed.trimGridToBed"],
	])("%s persists the value and publishes visualizer:settings", (key) => {
		const setting = findByKey(SettingsMenu, key);
		setting?.onChange?.(true);
		expect(mockedStoreSet).toHaveBeenCalledWith(key, true);
		expect(pubsub.publish).toHaveBeenCalledWith("visualizer:settings");
	});
});

// ---- Warn if beyond soft limits: disabled() ----

describe('"Warn if beyond soft limits" setting - disabled()', () => {
	const setting = () =>
		findByKey(SettingsMenu, "widgets.visualizer.showSoftLimitWarning");

	it("is disabled when not connected", () => {
		(controller as any).portOpen = false;
		expect(setting()?.disabled?.()).toBe(true);
	});

	it("is disabled when connected but $20 (soft limits) is 0", () => {
		(controller as any).portOpen = true;
		(controller as any).settings = { settings: { $20: "0" } };
		expect(setting()?.disabled?.()).toBe(true);
	});

	it("is enabled when connected and $20 is non-zero", () => {
		(controller as any).portOpen = true;
		(controller as any).settings = { settings: { $20: "1" } };
		expect(setting()?.disabled?.()).toBe(false);
	});
});

// ---- Probe touchplate-dependent hidden() branches ----

describe("Probe touchplate-dependent fields - hidden()", () => {
	const getPendingWith = (touchplateType: string) =>
		jest.fn((key: string, fallback?: any) =>
			key === "workspace.probeProfile.touchplateType" ? touchplateType : fallback,
		);

	it("Tip diameter is only visible for the 3D touchplate", () => {
		const setting = findByKey(SettingsMenu, "widgets.probe.tipDiameter3D");
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_3D))).toBe(false);
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_STANDARD))).toBe(true);
	});

	it("Block thickness is only visible for the Standard touchplate", () => {
		const setting = findByKey(
			SettingsMenu,
			"workspace.probeProfile.zThickness.standardBlock",
		);
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_STANDARD))).toBe(false);
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_3D))).toBe(true);
	});

	it("Fast find / Slow find / Retraction are hidden for AutoZero and BitZero", () => {
		const fastFind = findByKey(SettingsMenu, "widgets.probe.probeFastFeedrate");
		for (const type of [TOUCHPLATE_TYPE_AUTOZERO, TOUCHPLATE_TYPE_BITZERO]) {
			expect(fastFind?.hidden?.(getPendingWith(type))).toBe(true);
		}
		expect(fastFind?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_STANDARD))).toBe(false);
	});

	it("Probe Movement Speed is hidden only for BitZero", () => {
		const setting = findByKey(SettingsMenu, "widgets.probe.probeMovementSpeed");
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_BITZERO))).toBe(true);
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_AUTOZERO))).toBe(false);
		expect(setting?.hidden?.(getPendingWith(TOUCHPLATE_TYPE_STANDARD))).toBe(false);
	});
});
// ---- Tool Changing: hidden() branches driven by strategy ----

describe("Tool Changing fields - hidden()", () => {
	const getPendingWith = (values: Record<string, any>) =>
		jest.fn((key: string, fallback?: any) =>
			key in values ? values[key] : fallback,
		);

	it("Fixed sensor location is only visible for Fixed Tool Sensor strategy", () => {
		const setting = findByKey(SettingsMenu, "workspace.toolChangePosition");
		expect(
			setting?.hidden?.(
				getPendingWith({ "workspace.toolChangeOption": "Fixed Tool Sensor" }),
			),
		).toBe(false);
		expect(
			setting?.hidden?.(
				getPendingWith({ "workspace.toolChangeOption": "Pause" }),
			),
		).toBe(true);
	});

	it("Manual tool change location requires Fixed Tool Sensor AND moveToManualPosition", () => {
		const setting = findByKey(
			SettingsMenu,
			"workspace.toolChange.manualPosition",
		);
		expect(
			setting?.hidden?.(
				getPendingWith({
					"workspace.toolChangeOption": "Fixed Tool Sensor",
					"workspace.toolChange.moveToManualPosition": true,
				}),
			),
		).toBe(false);
		expect(
			setting?.hidden?.(
				getPendingWith({
					"workspace.toolChangeOption": "Fixed Tool Sensor",
					"workspace.toolChange.moveToManualPosition": false,
				}),
			),
		).toBe(true);
		expect(
			setting?.hidden?.(
				getPendingWith({
					"workspace.toolChangeOption": "Pause",
					"workspace.toolChange.moveToManualPosition": true,
				}),
			),
		).toBe(true);
	});

	it("Before/after tool change hooks are only visible for Code strategy", () => {
		const preHook = findByKey(
			SettingsMenu,
			"workspace.toolChangeHooks.preHook",
		);
		expect(
			preHook?.hidden?.(
				getPendingWith({ "workspace.toolChangeOption": "Code" }),
			),
		).toBe(false);
		expect(
			preHook?.hidden?.(
				getPendingWith({ "workspace.toolChangeOption": "Ignore" }),
			),
		).toBe(true);
	});

	it('"Passthrough" onApply calls updateToolchangeContext', () => {
		const setting = findByKey(
			SettingsMenu,
			"workspace.toolChange.passthrough",
		);
		setting?.onApply?.();
		expect(updateToolchangeContext).toHaveBeenCalled();
	});
});

// ---- Rotary tab: onUpdate() mode-switch logic ----

describe('"Rotary controls" setting - onUpdate()', () => {
	const setting = () => findByKey(SettingsMenu, "widgets.rotary.tab.show");

	it("switches workspace mode to DEFAULT when tab is turned off while in ROTARY mode", () => {
		mockedStoreGet.mockImplementation((key: string) => {
			if (key === "workspace.mode") return WORKSPACE_MODE.ROTARY;
			if (key === "widgets.rotary.tab.show") return false;
			return undefined;
		});
		setting()?.onUpdate?.();
		expect(updateWorkspaceMode).toHaveBeenCalled();
	});

	it("does not switch mode when the tab remains shown", () => {
		mockedStoreGet.mockImplementation((key: string) => {
			if (key === "workspace.mode") return WORKSPACE_MODE.ROTARY;
			if (key === "widgets.rotary.tab.show") return true;
			return undefined;
		});
		setting()?.onUpdate?.();
		expect(updateWorkspaceMode).not.toHaveBeenCalled();
	});

	it("does not switch mode when already in DEFAULT mode", () => {
		mockedStoreGet.mockImplementation((key: string) => {
			if (key === "workspace.mode") return WORKSPACE_MODE.DEFAULT;
			if (key === "widgets.rotary.tab.show") return false;
			return undefined;
		});
		setting()?.onUpdate?.();
		expect(updateWorkspaceMode).not.toHaveBeenCalled();
	});
});

describe('"Use A-axis for grbl" setting - onUpdate()', () => {
	it("sends the updated flag to the controller", () => {
		mockedStoreGet.mockReturnValue(true);
		const setting = findByKey(
			SettingsMenu,
			"workspace.rotaryAxis.useAaxisForGrbl",
		);
		setting?.onUpdate?.();
		expect(controller.command).toHaveBeenCalledWith("settings:updated", {
			useAaxisForGrbl: true,
		});
	});
});

// ---- Insert dwell for spindle commands: onUpdate() ----

describe('"Insert dwell for spindle commands" setting - onUpdate()', () => {
	const setting = () => findByKey(SettingsMenu, "widgets.spindle.delay");

	it("sends a finite numeric delay to the controller", () => {
		mockedStoreGet.mockReturnValue(3);
		setting()?.onUpdate?.();
		expect(controller.command).toHaveBeenCalledWith("settings:updated", {
			spindleDelay: 3,
		});
	});

	it("falls back to 0 when the stored value is not finite", () => {
		mockedStoreGet.mockReturnValue(Number.NaN);
		setting()?.onUpdate?.();
		expect(controller.command).toHaveBeenCalledWith("settings:updated", {
			spindleDelay: 0,
		});
	});
});

// ---- Accessibility: hidden() driven purely by store.get ----

describe("Accessibility conditional fields - hidden()", () => {
	it("Progress increment is hidden when job progress announcements are off", () => {
		mockedStoreGet.mockReturnValue(false);
		const setting = findByKey(
			SettingsMenu,
			"workspace.accessibility.jobProgressIncrement",
		);
		expect(setting?.hidden?.()).toBe(true);
	});

	it("Progress increment is visible when job progress announcements are on", () => {
		mockedStoreGet.mockReturnValue(true);
		const setting = findByKey(
			SettingsMenu,
			"workspace.accessibility.jobProgressIncrement",
		);
		expect(setting?.hidden?.()).toBe(false);
	});

	it("Audio cue sub-options are hidden when audio cues are disabled", () => {
		mockedStoreGet.mockReturnValue(false);
		const jobComplete = findByKey(
			SettingsMenu,
			"workspace.accessibility.audioCues.jobComplete",
		);
		expect(jobComplete?.hidden?.()).toBe(true);
	});

	it("App display scale is hidden outside electron", () => {
		mockedIsElectron.mockReturnValue(false);
		const setting = findByKey(
			SettingsMenu,
			"workspace.accessibility.displayScaleFactor",
		);
		expect(setting?.hidden?.()).toBe(true);
	});

	it("App display scale onUpdate sends a normalized decimal scale factor via ipcRenderer", () => {
		mockedIsElectron.mockReturnValue(true);
		mockedStoreGet.mockReturnValue("150%");
		const send = jest.fn();
		(window as any).ipcRenderer = { send };

		const setting = findByKey(
			SettingsMenu,
			"workspace.accessibility.displayScaleFactor",
		);
		setting?.onUpdate?.();
		expect(send).toHaveBeenCalledWith("save-display-scale", 1.5);
	});

	it.each([
		"workspace.accessibility.statusAnnouncements",
		"workspace.accessibility.jobProgressAnnouncements",
		"workspace.accessibility.focusRings",
		"workspace.accessibility.focusTrapping",
		"workspace.accessibility.reducedMotion",
	])("%s onUpdate publishes accessibility:update", (key) => {
		const setting = findByKey(SettingsMenu, key);
		setting?.onUpdate?.();
		expect(pubsub.publish).toHaveBeenCalledWith("accessibility:update");
	});
});

// ---- Spindle/laser functions toggle: onUpdate() high-complexity branch ----

describe('"Spindle/laser controls" setting - onUpdate()', () => {
	const setting = () => findByKey(SettingsMenu, "workspace.spindleFunctions");

	it("does nothing when spindleFunctions is being turned on", () => {
		mockedStoreGet.mockImplementation((key: string) => {
			if (key === "workspace.spindleFunctions") return true;
			if (key === "widgets.spindle.mode") return "spindle";
			return undefined;
		});
		setting()?.onUpdate?.();
		expect(mockedStoreSet).not.toHaveBeenCalledWith(
			"widgets.spindle.mode",
			"spindle",
		);
	});

	it("does nothing when turned off but current mode is already spindle", () => {
		mockedStoreGet.mockImplementation((key: string) => {
			if (key === "workspace.spindleFunctions") return false;
			if (key === "widgets.spindle.mode") return "spindle";
			return undefined;
		});
		setting()?.onUpdate?.();
		expect(mockedStoreSet).not.toHaveBeenCalledWith(
			"widgets.spindle.mode",
			"spindle",
		);
	});

	it("switches mode to spindle and dispatches settings when turned off while in laser mode", () => {
		mockedStoreGet.mockImplementation((key: string, fallback?: any) => {
			if (key === "workspace.spindleFunctions") return false;
			if (key === "widgets.spindle.mode") return "laser";
			if (key === "workspace.units") return "mm";
			if (key === "widgets.spindle.laser")
				return { maxPower: 0, minPower: 0, xOffset: 0, yOffset: 0 };
			if (key === "widgets.spindle.spindleMin") return 0;
			if (key === "widgets.spindle.spindleMax") return 0;
			return fallback;
		});

		setting()?.onUpdate?.();

		expect(mockedStoreSet).toHaveBeenCalledWith("widgets.spindle.mode", "spindle");
		expect(updatePartialControllerSettings).toHaveBeenCalled();
		expect(controller.command).toHaveBeenCalled();
	});
});