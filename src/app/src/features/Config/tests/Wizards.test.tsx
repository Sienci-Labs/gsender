import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ---- Button mock (shared by most wizard components) ----
jest.mock("app/components/Button", () => {
	const React = require("react");
	const ButtonImpl = ({ children, onClick, disabled, className, variant }: any) =>
		React.createElement(
			"button",
			{ onClick, disabled, className, "data-variant": variant },
			children,
		);
	return {
		__esModule: true,
		default: ButtonImpl,
		Button: ButtonImpl,
	};
});

// ---- controller mock ----
jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: { command: jest.fn() },
}));

// ---- Confirm dialog mock (ATCiWizard, AutoSpinSetup, SpindleWizard) ----
jest.mock("app/components/ConfirmationDialog/ConfirmationDialogLib.ts", () => ({
	Confirm: jest.fn(),
}));

// ---- constants mock ----
// ASSUMPTION: GRBLHAL's exact string value wasn't available at write
// time. If ATCiWizard/AutoSpinSetup/SpindleWizard tests misbehave around
// the grblHAL-vs-other branch, verify with:
//   grep -n "GRBLHAL\b" src/app/src/constants/index.ts
// and update this mock to match.
jest.mock("app/constants", () => ({
	GRBLHAL: "grblHAL",
	GRBL: "grbl",
}));

// ---- ATCi supported version constant mock ----
jest.mock("app/features/ATC/utils/ATCiConstants.ts", () => ({
	ATCI_SUPPORTED_VERSION: "1.0.0",
}));

// ---- useTypedSelector mock (ATCiWizard) ----
let mockTypedSelectorState: any = {
	controller: { type: "grblHAL", settings: { version: { semver: "1.0.0" } } },
};
jest.mock("app/hooks/useTypedSelector.ts", () => ({
	useTypedSelector: (selectorFn: any) => selectorFn(mockTypedSelectorState),
}));

// ---- firmwareSemver mock ----
jest.mock("app/lib/firmwareSemver.ts", () => ({
	firmwareSemver: jest.fn(),
}));

// ---- store mock (ATCiWizard) ----
jest.mock("app/store", () => ({
	__esModule: true,
	default: { set: jest.fn() },
}));

// ---- lodash delay/throttle mocks ----
// Both `import { delay } from "lodash"` and `import delay from
// "lodash/delay"` are used across these files. Mocked to invoke the
// callback synchronously so tests don't need real timers.
jest.mock("lodash", () => ({
	...jest.requireActual("lodash"),
	delay: (fn: () => void) => fn(),
}));
jest.mock("lodash/delay", () => (fn: () => void) => fn());

// ---- toast (sonner) mock (ATCiWizard) ----
jest.mock("sonner", () => ({
	toast: { error: jest.fn(), success: jest.fn() },
}));

// ---- react-redux useSelector mock ----
let mockReduxState: any = {
	connection: { isConnected: true },
	controller: { type: "grblHAL", state: { status: {} } },
};
jest.mock("react-redux", () => ({
	useSelector: (selectorFn: any) => selectorFn(mockReduxState),
}));

// ---- PinIndicator mock (LimitSwitchIndicators, ProbePinStatus) ----
jest.mock("app/features/MachineInfo/PinRow.tsx", () => {
	const React = require("react");
	return {
		PinIndicator: ({ on }: any) =>
			React.createElement("span", { "data-testid": "pin-indicator" }, on ? "ON" : "OFF"),
	};
});

// ---- react-router Link mock (SquaringToolWizard/ToolLink) ----
jest.mock("react-router", () => {
	const React = require("react");
	return {
		Link: ({ to, children, className }: any) =>
			React.createElement("a", { href: to, className }, children),
	};
});

import { AccessoryOutputWizard } from "../components/wizards/AccessoryOutputWizard";
import { AJogWizard } from "../components/wizards/AJogWizard";
import { ATCIWizard } from "../components/wizards/ATCiWizard";
import { AutoSpinSetup } from "../components/wizards/AutoSpinSetup";
import { JogWizard } from "../components/wizards/JogWizard";
import { LaserWizard } from "../components/wizards/LaserWizard";
import { LimitSwitchIndicators } from "../components/wizards/LimitSwitchIndicators";
import { ProbePinStatus } from "../components/wizards/ProbePinStatus";
import { SpindleWizard } from "../components/wizards/SpindleWizard";
import { SquaringToolWizard, ToolLink } from "../components/wizards/SquaringToolWizard";
import { XJogWizard } from "../components/wizards/XJogWizard";
import { YJogWizard } from "../components/wizards/YJogWizard";
import { ZJogWizard } from "../components/wizards/ZJogWizard";
import { GamepadLinkWizard, KeyboardLinkWizard } from "../components/ShortcutLinkWizards";
import controller from "app/lib/controller.ts";
import { Confirm } from "app/components/ConfirmationDialog/ConfirmationDialogLib.ts";
import store from "app/store";
import { toast } from "sonner";
import { firmwareSemver } from "app/lib/firmwareSemver.ts";

afterEach(() => {
	jest.clearAllMocks();
});

// ============================================================
// AccessoryOutputWizard
// ============================================================
describe("AccessoryOutputWizard", () => {
	it.each([
		["M3", "M3"],
		["M4", "M4"],
		["M5", "M5"],
		["M7", "M7"],
		["M8", "M8"],
		["M9", "M9"],
	])("clicking %s sends gcode command %s", (label, expectedCommand) => {
		render(<AccessoryOutputWizard />);
		fireEvent.click(screen.getByText(label));
		expect(controller.command).toHaveBeenCalledWith("gcode", expectedCommand);
	});
});

// ============================================================
// JogWizard (base component) + axis-specific wrappers
// ============================================================
describe("JogWizard", () => {
	it("jogging plus sends the correct $J command for the given axis", () => {
		render(<JogWizard axis="X" disabled={false} />);
		fireEvent.click(screen.getByText("Jog X+"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "$J=G21G91X10F1000");
	});

	it("jogging minus sends the correct negative $J command for the given axis", () => {
		render(<JogWizard axis="X" disabled={false} />);
		fireEvent.click(screen.getByText("Jog X-"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "$J=G21G91X-10F1000");
	});

	it("disables both jog buttons when disabled is true", () => {
		render(<JogWizard axis="Z" disabled={true} />);
		expect(screen.getByText("Jog Z-")).toBeDisabled();
		expect(screen.getByText("Jog Z+")).toBeDisabled();
	});

	it("defaults to not disabled when disabled prop is omitted", () => {
		render(<JogWizard axis="Y" />);
		expect(screen.getByText("Jog Y-")).not.toBeDisabled();
	});
});

describe.each([
	["AJogWizard", AJogWizard, "A"],
	["XJogWizard", XJogWizard, "X"],
	["YJogWizard", YJogWizard, "Y"],
	["ZJogWizard", ZJogWizard, "Z"],
])("%s", (_name, Component: any, axis) => {
	it(`wraps JogWizard with axis="${axis}" and disabled=false`, () => {
		render(<Component />);
		const plusButton = screen.getByText(`Jog ${axis}+`);
		const minusButton = screen.getByText(`Jog ${axis}-`);
		expect(plusButton).not.toBeDisabled();
		expect(minusButton).not.toBeDisabled();

		fireEvent.click(plusButton);
		expect(controller.command).toHaveBeenCalledWith(
			"gcode",
			`$J=G21G91${axis}10F1000`,
		);
	});
});

// ============================================================
// LaserWizard
// ============================================================
describe("LaserWizard", () => {
	it("Laser On sends the laser-start gcode", () => {
		render(<LaserWizard />);
		fireEvent.click(screen.getByText("Laser On"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "G1F1 M3 S1");
	});

	it("Laser Off sends the laser-stop gcode", () => {
		render(<LaserWizard />);
		fireEvent.click(screen.getByText("Laser Off"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "M5 S0");
	});
});

// ============================================================
// LimitSwitchIndicators
// ============================================================
describe("LimitSwitchIndicators", () => {
	it("shows each axis pin state from the controller status", () => {
		mockReduxState = {
			...mockReduxState,
			controller: {
				...mockReduxState.controller,
				state: { status: { pinState: { X: true, Y: false, Z: true, A: false } } },
			},
		};
		render(<LimitSwitchIndicators />);
		const indicators = screen.getAllByTestId("pin-indicator");
		expect(indicators.map((el) => el.textContent)).toEqual(["ON", "OFF", "ON", "OFF"]);
	});

	it("defaults every axis to off when pinState is missing", () => {
		mockReduxState = {
			...mockReduxState,
			controller: { ...mockReduxState.controller, state: { status: {} } },
		};
		expect(() => render(<LimitSwitchIndicators />)).not.toThrow();
		const indicators = screen.getAllByTestId("pin-indicator");
		expect(indicators.every((el) => el.textContent === "OFF")).toBe(true);
	});
});

// ============================================================
// ProbePinStatus
// ============================================================
describe("ProbePinStatus", () => {
	it("shows the probe pin as ON when set", () => {
		mockReduxState = {
			...mockReduxState,
			controller: {
				...mockReduxState.controller,
				state: { status: { pinState: { P: true } } },
			},
		};
		render(<ProbePinStatus />);
		expect(screen.getByTestId("pin-indicator")).toHaveTextContent("ON");
	});

	it("defaults to OFF when pinState is missing", () => {
		mockReduxState = {
			...mockReduxState,
			controller: { ...mockReduxState.controller, state: { status: {} } },
		};
		render(<ProbePinStatus />);
		expect(screen.getByTestId("pin-indicator")).toHaveTextContent("OFF");
	});
});

// ============================================================
// SquaringToolWizard / ToolLink
// ============================================================
describe("ToolLink", () => {
	it("renders a link with the given href and label", () => {
		render(<ToolLink link="/tools/movement-tuning" label="Tune Correction" />);
		const link = screen.getByText("Tune Correction").closest("a");
		expect(link).toHaveAttribute("href", "/tools/movement-tuning");
	});
});

describe("SquaringToolWizard", () => {
	it("links to the squaring tool page with the 'Square XY' label", () => {
		render(<SquaringToolWizard />);
		const link = screen.getByText("Square XY").closest("a");
		expect(link).toHaveAttribute("href", "/tools/squaring");
	});
});

// ============================================================
// AutoSpinSetup
// ============================================================
describe("AutoSpinSetup", () => {
	it("disables the button when not connected", () => {
		mockReduxState = {
			connection: { isConnected: false },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		expect(screen.getByText("Setup AutoSpin").closest("button")).toBeDisabled();
	});

	it("enables the button when connected", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		expect(
			screen.getByText("Setup AutoSpin").closest("button"),
		).not.toBeDisabled();
	});

	it("sends the grblHAL-specific command sequence when firmware is grblHAL", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));
		expect(controller.command).toHaveBeenCalledWith(
			"gcode",
			expect.arrayContaining(["$30 = 30000", "$31 = 10000"]),
		);
	});

	it("sends the simplified command sequence for non-grblHAL firmware", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grbl", state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));
		expect(controller.command).toHaveBeenCalledWith("gcode", [
			"G4P0.1",
			"$31=1",
			"G4P0.1",
			"$30=31250",
			"G4P0.1",
			"$$",
		]);
	});

	it("shows the restart confirmation dialog after sending commands", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));
		expect(Confirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Restart your Controller" }),
		);
	});

	it("BUG (flag to dev): fails silently on missing firmwareType - console.assert(truthyString) never actually logs, since a non-empty string as the sole argument is always truthy", () => {
		const consoleAssert = jest.spyOn(console, "assert").mockImplementation(() => {});
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: null, state: { status: {} } },
		};
		render(<AutoSpinSetup />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));

		expect(consoleAssert).toHaveBeenCalledWith(
			"No firmware type detected, failing early",
		);
		expect(controller.command).not.toHaveBeenCalled();
		expect(Confirm).not.toHaveBeenCalled();
		consoleAssert.mockRestore();
	});


});

// ============================================================
// SpindleWizard
// ============================================================
describe("SpindleWizard", () => {
	it("For/Rev/Stop send the correct spindle gcode commands", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<SpindleWizard />);
		fireEvent.click(screen.getByText("For"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "M3 S1000");
		fireEvent.click(screen.getByText("Rev"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "M4 S1000");
		fireEvent.click(screen.getByText("Stop"));
		expect(controller.command).toHaveBeenCalledWith("gcode", "M5 S0");
	});

	it("disables Setup AutoSpin when not connected", () => {
		mockReduxState = {
			connection: { isConnected: false },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<SpindleWizard />);
		expect(screen.getByText("Setup AutoSpin").closest("button")).toBeDisabled();
	});

	it("Setup AutoSpin sends the grblHAL command sequence and shows the restart dialog", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grblHAL", state: { status: {} } },
		};
		render(<SpindleWizard />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));
		expect(controller.command).toHaveBeenCalledWith(
			"gcode",
			expect.arrayContaining(["$30 = 30000"]),
		);
		expect(Confirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Restart your Controller" }),
		);
	});

	it("sends the simplified (non-grblHAL) command sequence and shows the restart dialog", () => {
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: "grbl", state: { status: {} } },
		};
		render(<SpindleWizard />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));
		expect(controller.command).toHaveBeenCalledWith("gcode", [
			"G4P0.1",
			"$31=1",
			"G4P0.1",
			"$30=31250",
			"G4P0.1",
			"$$",
		]);
		expect(Confirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Restart your Controller" }),
		);
	});

	it("BUG (flag to dev): same silent-failure pattern as AutoSpinSetup when firmwareType is missing (duplicated logic across both files)", () => {
		const consoleAssert = jest.spyOn(console, "assert").mockImplementation(() => {});
		mockReduxState = {
			connection: { isConnected: true },
			controller: { type: null, state: { status: {} } },
		};
		render(<SpindleWizard />);
		fireEvent.click(screen.getByText("Setup AutoSpin"));

		expect(consoleAssert).toHaveBeenCalledWith(
			"No firmware type detected, failing early",
		);
		expect(controller.command).not.toHaveBeenCalled();
		expect(Confirm).not.toHaveBeenCalled();
		consoleAssert.mockRestore();
	});
});

// ============================================================
// ATCIWizard
// ============================================================
describe("ATCIWizard", () => {
	it("sends the EEPROM command sequence and enables the workspace flag on click", () => {
		mockTypedSelectorState = {
			controller: { type: "grblHAL", settings: { version: { semver: "1.0.0" } } },
		};
		(firmwareSemver as jest.Mock).mockReturnValue(true);

		render(<ATCIWizard />);
		fireEvent.click(screen.getByText("Configure Sienci ATCi"));

		expect(controller.command).toHaveBeenCalledWith(
			"gcode",
			expect.arrayContaining(["$485=1", "$675=2", "$534=1"]),
		);
		expect(store.set).toHaveBeenCalledWith("workspace.atcEnabled", true);
	});

	it("shows the restart confirmation dialog after enabling", () => {
		mockTypedSelectorState = {
			controller: { type: "grblHAL", settings: { version: { semver: "1.0.0" } } },
		};
		(firmwareSemver as jest.Mock).mockReturnValue(true);

		render(<ATCIWizard />);
		fireEvent.click(screen.getByText("Configure Sienci ATCi"));
		expect(Confirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "ATCi - Restart your Controller" }),
		);
	});

	it("shows an error toast when the controller firmware is not grblHAL", () => {
		mockTypedSelectorState = {
			controller: { type: "grbl", settings: { version: { semver: "1.0.0" } } },
		};
		(firmwareSemver as jest.Mock).mockReturnValue(true);

		render(<ATCIWizard />);
		fireEvent.click(screen.getByText("Configure Sienci ATCi"));
		expect(toast.error).toHaveBeenCalledWith(
			"ATCi is only supported by boards running grblHAL.",
		);
	});

	it("shows an error toast when the firmware version is unsupported", () => {
		mockTypedSelectorState = {
			controller: { type: "grblHAL", settings: { version: { semver: "0.1.0" } } },
		};
		(firmwareSemver as jest.Mock).mockReturnValue(false);

		render(<ATCIWizard />);
		fireEvent.click(screen.getByText("Configure Sienci ATCi"));
		expect(toast.error).toHaveBeenCalledWith(
			expect.stringContaining("ATCi is only supported by grblHAL version"),
		);
	});

	it("BUG (flag to dev): still sends EEPROM commands and enables the workspace flag even when validation fails, since there is no early return after either toast.error call", () => {
		mockTypedSelectorState = {
			controller: { type: "grbl", settings: { version: { semver: "0.1.0" } } },
		};
		(firmwareSemver as jest.Mock).mockReturnValue(false);

		render(<ATCIWizard />);
		fireEvent.click(screen.getByText("Configure Sienci ATCi"));

		expect(toast.error).toHaveBeenCalledTimes(2);
		expect(controller.command).toHaveBeenCalled();
		expect(store.set).toHaveBeenCalledWith("workspace.atcEnabled", true);
	});
});

// ============================================================
// ShortcutLinkWizards
// ============================================================
describe("GamepadLinkWizard", () => {
	it("links to the gamepad tools page", () => {
		render(<GamepadLinkWizard />);
		const link = screen.getByText("Configure Gamepad").closest("a");
		expect(link).toHaveAttribute("href", "/tools/gamepad");
	});
});

describe("KeyboardLinkWizard", () => {
	it("links to the keyboard shortcuts tools page", () => {
		render(<KeyboardLinkWizard />);
		const link = screen.getByText("Configure Keyboard").closest("a");
		expect(link).toHaveAttribute("href", "/tools/keyboard-shortcuts");
	});
});