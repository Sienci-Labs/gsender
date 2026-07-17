import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";

// Same jest.mock hoisting fix as EEPROMInputs.test.tsx: JSX inside a
// jest.mock() factory compiles to React.createElement, which can't
// reference the top-level `React` import - so React is required locally
// inside the factory instead.
jest.mock("app/components/shadcn/Switch", () => {
	const React = require("react");
	return {
		Switch: ({ checked, onChange, disabled }: any) =>
			React.createElement("input", {
				type: "checkbox",
				role: "switch",
				checked,
				readOnly: true,
				disabled,
				onClick: () => onChange(!checked),
			}),
	};
});

// ---- api mock (EventInput) ----
jest.mock("app/api", () => ({
	__esModule: true,
	default: {
		events: {
			fetch: jest.fn(),
			update: jest.fn(),
			create: jest.fn(),
		},
	},
}));

// ---- MacroForm mock (EventInput) ----
// ASSUMPTION: real MacroForm's exact prop contract isn't available. This
// stub exposes just enough (a Save button calling onSubmit, a Cancel
// button calling onCancel) to drive EventInput's editing flow.
jest.mock("app/features/Macros/MacroForm", () => {
	const React = require("react");
	return {
		__esModule: true,
		default: ({ macroContent, onSubmit, onCancel, submitLabel }: any) =>
			React.createElement(
				"div",
				{ "data-testid": "macro-form" },
				React.createElement("textarea", {
					"data-testid": "macro-form-textarea",
					defaultValue: macroContent,
					onChange: (e: any) => {
						(global as any).__macroFormContent = e.target.value;
					},
				}),
				React.createElement(
					"button",
					{
						onClick: () =>
							onSubmit({
								content:
									(global as any).__macroFormContent ?? macroContent,
							}),
					},
					submitLabel ?? "Save",
				),
				React.createElement("button", { onClick: onCancel }, "Cancel"),
			),
	};
});

// ---- toaster mock (EventInput) ----
jest.mock("app/lib/toaster", () => ({
	toast: {
		error: jest.fn(),
		success: jest.fn(),
	},
}));

// ---- useSettings mock (HybridNumber) ----
// Declared with a `mock`-prefixed name so jest.mock()'s hoisting guard
// permits referencing it from inside the factory below.
let mockSettingsState: any = {
	firmwareType: "grbl",
	connected: false,
	EEPROM: [] as any[],
	setEEPROM: jest.fn(),
	setSettingsAreDirty: jest.fn(),
};
jest.mock("app/features/Config/utils/SettingsContext.tsx", () => ({
	useSettings: () => mockSettingsState,
}));

// NOTE: previously this file also mocked
// "app/features/Config/components/SettingInputs/NumberSettingInput.tsx"
// to isolate HybridNumber's own logic. That mock was removed - jest.mock()
// applies for the whole file regardless of which describe block declares
// it, so it was silently replacing the REAL NumberSettingInput in the
// separate "NumberSettingInput" describe block below too, breaking those
// tests. HybridNumber's tests never pass a `unit` prop, so the real
// component's conversion logic never triggers for them anyway - safe to
// let HybridNumber render the real NumberSettingInput underneath.

let mockWorkspaceUnits = "mm";
jest.mock("app/hooks/useWorkspaceState", () => ({
	useWorkspaceState: () => ({ units: mockWorkspaceUnits }),
}));

// ---- units conversion mock (JogInput, NumberSettingInput) ----
// ASSUMPTION: standard mm<->inch conversion. If the real implementation
// rounds differently, adjust the multiplier/divisor below.
jest.mock("app/lib/units", () => ({
	convertToImperial: jest.fn((v: number) => v / 25.4),
	convertToMetric: jest.fn((v: number) => v * 25.4),
}));

// ---- app/components/ControlledInput mock (IPSettingInput, JogInput,
// LocationInput, NumberSettingInput) ----
// ASSUMPTION: this is a DIFFERENT ControlledInput than the local one
// tested in EEPROMInputs.test.tsx (that one lives at
// Config/components/EEPROMInputs/ControlledInput; this one is a shared
// app-wide component at app/components/ControlledInput). Its exact
// internals aren't available, so it's mocked here as a thin native
// input that forwards the raw change event, since all six consumers
// below extract what they need (e.target.value / e.target.valueAsNumber)
// themselves rather than relying on any truncate-on-blur behavior.
jest.mock("app/components/ControlledInput", () => {
	const React = require("react");
	return {
		ControlledInput: ({ value, onChange, type, className, suffix, min, max }: any) =>
			React.createElement(
				"div",
				null,
				React.createElement("input", {
					type: type ?? "text",
					className,
					value: value ?? "",
					min,
					max,
					onChange,
				}),
				suffix ? React.createElement("span", null, suffix) : null,
			),
	};
});

// ---- app/components/Button mock (LocationInput, PathSelection) ----
// FIXED: PathSelection calls Button with `text`/`icon` props (not
// `children`), while LocationInput uses `children`. This mock now
// supports both call styles.
jest.mock("app/components/Button", () => {
	const React = require("react");
	return {
		__esModule: true,
		default: ({ children, onClick, disabled, className, text, icon }: any) =>
			React.createElement(
				"button",
				{ onClick, disabled, className },
				icon ?? null,
				text ?? children,
			),
	};
});

// ---- controller mock (EventInput uses api instead; LocationInput uses
// controller.command directly) ----
jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		command: jest.fn(),
	},
}));

// ---- is-electron mock (PathSelection) ----
let mockIsElectronValue = false;
jest.mock("is-electron", () => ({
	__esModule: true,
	default: () => mockIsElectronValue,
}));

// ---- shadcn Label/RadioGroup mock (RadioSettingInput) ----
// ASSUMPTION: real RadioGroup/RadioGroupItem are Radix-based. This mock
// preserves the actual selection behavior (shared value + onValueChange)
// via a lightweight context, without Radix's real portal/keyboard-nav
// machinery, so tests exercise RadioSettingInput's own logic rather than
// Radix internals.
jest.mock("app/components/shadcn/Label.tsx", () => {
	const React = require("react");
	return {
		Label: ({ children, htmlFor }: any) =>
			React.createElement("label", { htmlFor }, children),
	};
});

jest.mock("app/components/shadcn/RadioGroup.tsx", () => {
	const React = require("react");
	const RadioGroupContext = React.createContext({
		value: "",
		onValueChange: (_v: string) => {},
	});
	return {
		RadioGroup: ({ value, onValueChange, children }: any) =>
			React.createElement(
				RadioGroupContext.Provider,
				{ value: { value, onValueChange } },
				React.createElement("div", { role: "radiogroup" }, children),
			),
		RadioGroupItem: ({ value }: any) => {
			const ctx = React.useContext(RadioGroupContext);
			return React.createElement("input", {
				type: "radio",
				role: "radio",
				value,
				checked: ctx.value === value,
				onChange: () => ctx.onValueChange(value),
			});
		},
	};
});

// ---- shadcn Select mock (SelectSettingInput) ----
// ASSUMPTION: same rationale as RadioGroup above - simplified but
// behaviorally faithful stand-in for the real Radix-based Select.
jest.mock("app/components/shadcn/Select.tsx", () => {
	const React = require("react");
	const SelectContext = React.createContext({
		value: "",
		onValueChange: (_v: string) => {},
		disabled: false,
	});
	return {
		Select: ({ value, onValueChange, disabled, children }: any) =>
			React.createElement(
				SelectContext.Provider,
				{ value: { value, onValueChange, disabled } },
				React.createElement("div", { "data-testid": "select-root" }, children),
			),
		SelectTrigger: ({ children }: any) => {
			const ctx = React.useContext(SelectContext);
			return React.createElement(
				"button",
				{ type: "button", "data-testid": "select-trigger", disabled: ctx.disabled },
				children,
			);
		},
		SelectValue: ({ placeholder }: any) => {
			const ctx = React.useContext(SelectContext);
			return React.createElement("span", null, ctx.value || placeholder);
		},
		SelectContent: ({ children }: any) =>
			React.createElement("div", { "data-testid": "select-content" }, children),
		SelectItem: ({ value, children }: any) => {
			const ctx = React.useContext(SelectContext);
			return React.createElement(
				"div",
				{
					role: "option",
					"data-testid": `select-item-${value}`,
					onClick: () => ctx.onValueChange(value),
				},
				children,
			);
		},
	};
});

import { APIToggle } from "../components/SettingInputs/APIToggle";
import { BooleanSettingInput } from "../components/SettingInputs/BooleanSettingInput";
import { EEPROMSettingInput } from "../components/SettingInputs/EEPROMSettingInput";
import { EventInput } from "../components/SettingInputs/EventInput";
import { HybridNumber } from "../components/SettingInputs/HybridNumber";
import { IPSettingInput } from "../components/SettingInputs/IP";
import { JogInput } from "../components/SettingInputs/JogInput";
import { LocationInput } from "../components/SettingInputs/LocationInput";
import { NumberSettingInput } from "../components/SettingInputs/NumberSettingInput";
import PathSelection from "../components/SettingInputs/PathSelection";
import { RadioSettingInput } from "../components/SettingInputs/RadioSettingInput";
import { SelectSettingInput } from "../components/SettingInputs/SelectSettingInput";
import { TextAreaInput } from "../components/SettingInputs/TextAreaInput";
import api from "app/api";
import controller from "app/lib/controller.ts";
import { toast } from "app/lib/toaster";

afterEach(() => {
	jest.clearAllMocks();
});

// ============================================================
// APIToggle
// ============================================================
// STUB WARNING: the source is `export function APIToggle() {}` - it has
// no return statement at all. In this project's React/build setup this
// renders nothing rather than throwing (confirmed by test run), so this
// test documents that placeholder behavior. Still worth flagging to
// Kieran/Walid: if this is mid-development, it should eventually return
// real content, since right now it silently renders as empty.
describe("APIToggle (STUB - not yet implemented)", () => {
	it("renders nothing without throwing, since the component has no return statement", () => {
		const { container } = render(<APIToggle />);
		expect(container).toBeEmptyDOMElement();
	});
});

// ============================================================
// EEPROMSettingInput
// ============================================================
// STUB WARNING: the source is a hardcoded placeholder
// (`<div>HI</div>`) that ignores any props passed to it. This test
// documents the current placeholder output only - it is not testing
// real EEPROM setting behavior, because there isn't any yet.
describe("EEPROMSettingInput (STUB - not yet implemented)", () => {
	it("renders the placeholder text regardless of props passed", () => {
		render(<EEPROMSettingInput {...({ value: 5, onChange: jest.fn() } as any)} />);
		expect(screen.getByText("HI")).toBeInTheDocument();
	});

	it("renders the same placeholder with no props at all", () => {
		render(<EEPROMSettingInput />);
		expect(screen.getByText("HI")).toBeInTheDocument();
	});
});

// ============================================================
// BooleanSettingInput
// ============================================================
describe("BooleanSettingInput", () => {
	it("defaults to unchecked when no value is provided", () => {
		render(<BooleanSettingInput onChange={jest.fn()} index={0} />);
		expect(screen.getByRole("switch")).not.toBeChecked();
	});

	it("renders checked for a truthy boolean value (non-firmware mode)", () => {
		render(<BooleanSettingInput value={true} onChange={jest.fn()} index={0} />);
		expect(screen.getByRole("switch")).toBeChecked();
	});

	it("renders unchecked for a falsy boolean value (non-firmware mode)", () => {
		render(<BooleanSettingInput value={false} onChange={jest.fn()} index={0} />);
		expect(screen.getByRole("switch")).not.toBeChecked();
	});

	it("in firmware mode, treats numeric 1 as checked and any other number as unchecked", () => {
		const { rerender } = render(
			<BooleanSettingInput
				value={1}
				onChange={jest.fn()}
				index={0}
				isFirmwareSetting={true}
			/>,
		);
		expect(screen.getByRole("switch")).toBeChecked();

		rerender(
			<BooleanSettingInput
				value={0}
				onChange={jest.fn()}
				index={0}
				isFirmwareSetting={true}
			/>,
		);
		expect(screen.getByRole("switch")).not.toBeChecked();
	});

	it("in firmware mode, coerces a numeric string '1' to checked", () => {
		render(
			<BooleanSettingInput
				value={"1" as any}
				onChange={jest.fn()}
				index={0}
				isFirmwareSetting={true}
			/>,
		);
		expect(screen.getByRole("switch")).toBeChecked();
	});

	it("in non-firmware mode, toggling on calls onChange with a boolean true", () => {
		const onChange = jest.fn();
		render(<BooleanSettingInput value={false} onChange={onChange} index={0} />);
		fireEvent.click(screen.getByRole("switch"));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("in non-firmware mode, toggling off calls onChange with a boolean false", () => {
		const onChange = jest.fn();
		render(<BooleanSettingInput value={true} onChange={onChange} index={0} />);
		fireEvent.click(screen.getByRole("switch"));
		expect(onChange).toHaveBeenCalledWith(false);
	});

	it("in firmware mode, toggling on calls onChange with numeric 1 (not boolean true)", () => {
		const onChange = jest.fn();
		render(
			<BooleanSettingInput
				value={0}
				onChange={onChange}
				index={0}
				isFirmwareSetting={true}
			/>,
		);
		fireEvent.click(screen.getByRole("switch"));
		expect(onChange).toHaveBeenCalledWith(1);
	});

	it("in firmware mode, toggling off calls onChange with numeric 0 (not boolean false)", () => {
		const onChange = jest.fn();
		render(
			<BooleanSettingInput
				value={1}
				onChange={onChange}
				index={0}
				isFirmwareSetting={true}
			/>,
		);
		fireEvent.click(screen.getByRole("switch"));
		expect(onChange).toHaveBeenCalledWith(0);
	});

	it("disables the switch when the disabled() function returns true", () => {
		render(
			<BooleanSettingInput
				value={false}
				onChange={jest.fn()}
				index={0}
				disabled={() => true}
			/>,
		);
		expect(screen.getByRole("switch")).toBeDisabled();
	});

	it("does not disable the switch when the disabled() function returns false", () => {
		render(
			<BooleanSettingInput
				value={false}
				onChange={jest.fn()}
				index={0}
				disabled={() => false}
			/>,
		);
		expect(screen.getByRole("switch")).not.toBeDisabled();
	});

	it("defaults to not disabled when no disabled prop is provided", () => {
		render(<BooleanSettingInput value={false} onChange={jest.fn()} index={0} />);
		expect(screen.getByRole("switch")).not.toBeDisabled();
	});

	it("calls the disabled() function fresh on every render, reflecting live state changes", () => {
		const disabled = jest.fn().mockReturnValue(false);
		const { rerender } = render(
			<BooleanSettingInput
				value={false}
				onChange={jest.fn()}
				index={0}
				disabled={disabled}
			/>,
		);
		expect(screen.getByRole("switch")).not.toBeDisabled();

		disabled.mockReturnValue(true);
		rerender(
			<BooleanSettingInput
				value={false}
				onChange={jest.fn()}
				index={0}
				disabled={disabled}
			/>,
		);
		expect(screen.getByRole("switch")).toBeDisabled();
	});
});

// ============================================================
// EventInput
// ============================================================
describe("EventInput", () => {
	const mockedFetch = api.events.fetch as jest.Mock;
	const mockedUpdate = api.events.update as jest.Mock;
	const mockedCreate = api.events.create as jest.Mock;

	beforeEach(() => {
		mockedFetch.mockResolvedValue({ data: { records: {} } });
		mockedUpdate.mockResolvedValue({ data: {} });
		mockedCreate.mockResolvedValue({
			data: { record: { id: "new-id", commands: "G0 X0", enabled: true } },
		});
		(global as any).__macroFormContent = undefined;
	});

	it("shows the placeholder text when no event data has been fetched yet", async () => {
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
		expect(screen.getByText("; No commands set")).toBeInTheDocument();
	});

	it("populates commands from a matching fetched record", async () => {
		mockedFetch.mockResolvedValue({
			data: {
				records: {
					"gcode:start": {
						id: "1",
						event: "gcode:start",
						trigger: "gcode",
						commands: "G0 X0 Y0",
						enabled: true,
						mtime: 0,
					},
				},
			},
		});
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() =>
			expect(screen.getByDisplayValue("G0 X0 Y0")).toBeInTheDocument(),
		);
	});

	it("shows a toast error when fetching event data fails", async () => {
		mockedFetch.mockRejectedValue(new Error("network error"));
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.stringContaining("gcode:start"),
				expect.any(Object),
			),
		);
	});

	it("toggles enabled and calls api.events.update with the flipped state", async () => {
		mockedFetch.mockResolvedValue({
			data: {
				records: {
					"gcode:start": {
						id: "1",
						event: "gcode:start",
						trigger: "gcode",
						commands: "",
						enabled: false,
						mtime: 0,
					},
				},
			},
		});
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked());

		fireEvent.click(screen.getByRole("switch"));
		expect(screen.getByRole("switch")).toBeChecked();
		await waitFor(() =>
			expect(mockedUpdate).toHaveBeenCalledWith("gcode:start", {
				enabled: true,
			}),
		);
	});

	it("opens the MacroForm editor when 'Edit Event' is clicked", async () => {
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
		expect(screen.queryByTestId("macro-form")).not.toBeInTheDocument();
		fireEvent.click(screen.getByText("Edit Event"));
		expect(screen.getByTestId("macro-form")).toBeInTheDocument();
	});

	it("creates a new event via api.events.create when no eventData exists yet", async () => {
		render(<EventInput eventType="gcode:pause" />);
		await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
		fireEvent.click(screen.getByText("Edit Event"));
		fireEvent.click(screen.getByText("Save"));
		await waitFor(() =>
			expect(mockedCreate).toHaveBeenCalledWith({
				event: "gcode:pause",
				trigger: "gcode",
				commands: "",
				enabled: true,
			}),
		);
	});

	it("updates an existing event via api.events.update when eventData already has an id", async () => {
		mockedFetch.mockResolvedValue({
			data: {
				records: {
					"gcode:start": {
						id: "1",
						event: "gcode:start",
						trigger: "gcode",
						commands: "old",
						enabled: true,
						mtime: 0,
					},
				},
			},
		});
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
		fireEvent.click(screen.getByText("Edit Event"));
		fireEvent.change(screen.getByTestId("macro-form-textarea"), {
			target: { value: "new commands" },
		});
		fireEvent.click(screen.getByText("Save"));
		await waitFor(() =>
			expect(mockedUpdate).toHaveBeenCalledWith("gcode:start", {
				commands: "new commands",
			}),
		);
	});

	it("closes the editor without saving when Cancel is clicked", async () => {
		render(<EventInput eventType="gcode:start" />);
		await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
		fireEvent.click(screen.getByText("Edit Event"));
		fireEvent.click(screen.getByText("Cancel"));
		expect(screen.queryByTestId("macro-form")).not.toBeInTheDocument();
		expect(mockedUpdate).not.toHaveBeenCalled();
		expect(mockedCreate).not.toHaveBeenCalled();
	});
});

// ============================================================
// HybridNumber
// ============================================================
describe("HybridNumber", () => {
	beforeEach(() => {
		mockSettingsState = {
			firmwareType: "grbl",
			connected: false,
			EEPROM: [],
			setEEPROM: jest.fn(),
			setSettingsAreDirty: jest.fn(),
		};
	});

	it("displays the passed value directly when not connected", () => {
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={jest.fn()} index={0} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(42);
	});

	it("displays the passed value directly when connected but firmware is not grblHAL and forceEEPROM is not set", () => {
		mockSettingsState.connected = true;
		mockSettingsState.firmwareType = "grbl";
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={jest.fn()} index={0} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(42);
	});

	it("displays the EEPROM value instead of the passed value when connected to grblHAL with a matching key", () => {
		mockSettingsState.connected = true;
		mockSettingsState.firmwareType = "grblHAL";
		mockSettingsState.EEPROM = [
			{ setting: "$30", value: "99", globalIndex: 0 },
		];
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={jest.fn()} index={0} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(99);
	});

	it("falls back to the passed value when connected to grblHAL but no matching EEPROM key exists", () => {
		mockSettingsState.connected = true;
		mockSettingsState.firmwareType = "grblHAL";
		mockSettingsState.EEPROM = [{ setting: "$31", value: "5", globalIndex: 0 }];
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={jest.fn()} index={0} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(42);
	});

	it("uses EEPROM when forceEEPROM is true even if firmware is not grblHAL", () => {
		mockSettingsState.connected = true;
		mockSettingsState.firmwareType = "grbl";
		mockSettingsState.EEPROM = [
			{ setting: "$30", value: "77", globalIndex: 0 },
		];
		render(
			<HybridNumber
				value={42}
				eepromKey="$30"
				onChange={jest.fn()}
				index={0}
				forceEEPROM={true}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(77);
	});

	it("calls external onChange directly (not setEEPROM) when not using EEPROM", () => {
		const onChange = jest.fn();
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={onChange} index={0} />,
		);
		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "100" },
		});
		expect(onChange).toHaveBeenCalledWith(100);
		expect(mockSettingsState.setEEPROM).not.toHaveBeenCalled();
	});

	it("calls setEEPROM (not external onChange) when using EEPROM with a matching entry", () => {
		mockSettingsState.connected = true;
		mockSettingsState.firmwareType = "grblHAL";
		mockSettingsState.EEPROM = [
			{ setting: "$30", value: "99", globalIndex: 0 },
		];
		const onChange = jest.fn();
		render(
			<HybridNumber value={42} eepromKey="$30" onChange={onChange} index={0} />,
		);
		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "150" },
		});
		expect(onChange).not.toHaveBeenCalled();
		expect(mockSettingsState.setEEPROM).toHaveBeenCalledTimes(1);

		// Exercise the updater function passed to setEEPROM to confirm it
		// replaces the entry at globalIndex with the new value, dirty
		// flag, and a preserved ogValue.
		const updaterFn = mockSettingsState.setEEPROM.mock.calls[0][0];
		const result = updaterFn([{ setting: "$30", value: "99", globalIndex: 0 }]);
		expect(result[0]).toMatchObject({
			setting: "$30",
			value: 150,
			dirty: true,
			ogValue: "99",
		});
		expect(mockSettingsState.setSettingsAreDirty).toHaveBeenCalledWith(true);
	});
});

// ============================================================
// IPSettingInput
// ============================================================
describe("IPSettingInput", () => {
	it("renders four octet inputs with the initial IP values", () => {
		render(
			<IPSettingInput
				ip={[192, 168, 5, 1]}
				onChange={jest.fn()}
				index={0}
			/>,
		);
		const inputs = screen.getAllByRole("spinbutton");
		expect(inputs).toHaveLength(4);
		expect(inputs[0]).toHaveValue(192);
		expect(inputs[1]).toHaveValue(168);
		expect(inputs[2]).toHaveValue(5);
		expect(inputs[3]).toHaveValue(1);
	});

	it("updating one octet calls onChange with that octet replaced, others unchanged", () => {
		const onChange = jest.fn();
		render(
			<IPSettingInput
				ip={[192, 168, 5, 1]}
				onChange={onChange}
				index={0}
			/>,
		);
		const inputs = screen.getAllByRole("spinbutton");
		fireEvent.change(inputs[2], { target: { value: "10" } });
		expect(onChange).toHaveBeenCalledWith([192, 168, 10, 1]);
	});

	it("does not crash when ip defaults to an empty array", () => {
		expect(() =>
			render(<IPSettingInput ip={[]} onChange={jest.fn()} index={0} />),
		).not.toThrow();
	});
});

// ============================================================
// JogInput
// ============================================================
describe("JogInput", () => {
	beforeEach(() => {
		mockWorkspaceUnits = "mm";
	});

	const baseValue = { xyStep: 1, zStep: 2, aStep: 5, feedrate: 500 };

	it("displays raw (unconverted) values in metric mode", () => {
		render(<JogInput value={baseValue} index={0} onChange={jest.fn()} />);
		const inputs = screen.getAllByRole("spinbutton");
		expect(inputs[0]).toHaveValue(1); // xyStep
		expect(inputs[1]).toHaveValue(2); // zStep
		expect(inputs[2]).toHaveValue(5); // aStep - never converted (degrees)
		expect(inputs[3]).toHaveValue(500); // feedrate
	});

	it("converts xyStep/zStep/feedrate to imperial for display, but leaves aStep (degrees) unconverted", () => {
		mockWorkspaceUnits = "in";
		render(<JogInput value={baseValue} index={0} onChange={jest.fn()} />);
		const inputs = screen.getAllByRole("spinbutton");
		expect(inputs[0]).toHaveValue(1 / 25.4);
		expect(inputs[1]).toHaveValue(2 / 25.4);
		expect(inputs[2]).toHaveValue(5); // aStep unaffected
		expect(inputs[3]).toHaveValue(500 / 25.4);
	});

	it("updating xyStep in metric mode calls onChange with the raw new value merged in", () => {
		const onChange = jest.fn();
		render(<JogInput value={baseValue} index={0} onChange={onChange} />);
		const inputs = screen.getAllByRole("spinbutton");
		fireEvent.change(inputs[0], { target: { value: "3" } });
		expect(onChange).toHaveBeenCalledWith({ ...baseValue, xyStep: 3 });
	});

	it("updating a value in imperial mode converts it back to metric before calling onChange", () => {
		mockWorkspaceUnits = "in";
		const onChange = jest.fn();
		render(<JogInput value={baseValue} index={0} onChange={onChange} />);
		const inputs = screen.getAllByRole("spinbutton");
		fireEvent.change(inputs[0], { target: { value: "1" } }); // 1 inch typed
		expect(onChange).toHaveBeenCalledWith({ ...baseValue, xyStep: 25.4 });
	});

	it("BUG (flag to dev): crashes when value prop is undefined in metric mode, since convertedValue.xyStep is read off an undefined object", () => {
		const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			render(<JogInput value={undefined as any} index={0} onChange={jest.fn()} />),
		).toThrow();
		consoleError.mockRestore();
	});
});

// ============================================================
// LocationInput
// ============================================================
describe("LocationInput", () => {
	function renderWithStore(state: any, props: any) {
		const store = createStore(() => state);
		return render(
			<Provider store={store}>
				<LocationInput {...props} />
			</Provider>,
		);
	}

	const baseState = {
		controller: { mpos: { x: 1, y: 2, z: 3 } },
		connection: { isConnected: true },
	};

	it("renders X/Y/Z inputs with the provided value", () => {
		renderWithStore(baseState, {
			value: { x: 10, y: 20, z: 30 },
			onChange: jest.fn(),
			unit: "mm",
		});
		const inputs = screen.getAllByRole("spinbutton");
		expect(inputs[0]).toHaveValue(10);
		expect(inputs[1]).toHaveValue(20);
		expect(inputs[2]).toHaveValue(30);
	});

	it("updating one axis calls onChange with that axis replaced, others unchanged", () => {
		const onChange = jest.fn();
		renderWithStore(baseState, {
			value: { x: 10, y: 20, z: 30 },
			onChange,
			unit: "mm",
		});
		const inputs = screen.getAllByRole("spinbutton");
		fireEvent.change(inputs[1], { target: { value: "99" } });
		expect(onChange).toHaveBeenCalledWith({ x: 10, y: 99, z: 30 });
	});

	it("Grab reads the current machine position from redux and calls onChange", () => {
		const onChange = jest.fn();
		renderWithStore(baseState, {
			value: { x: 0, y: 0, z: 0 },
			onChange,
			unit: "mm",
		});
		fireEvent.click(screen.getByText("Grab"));
		expect(onChange).toHaveBeenCalledWith({ x: 1, y: 2, z: 3 });
	});

	it("Go To sends a formatted G-code sequence to the controller using the current value", () => {
		renderWithStore(baseState, {
			value: { x: 5, y: 6, z: 7 },
			onChange: jest.fn(),
			unit: "mm",
		});
		fireEvent.click(screen.getByText("Go To"));
		expect(controller.command).toHaveBeenCalledWith("gcode", [
			"G53 G0 Z-1",
			"G53 G0 X5 Y6",
			"G53 G0 Z7",
		]);
	});

	it("disables Grab and Go To when not connected", () => {
		renderWithStore(
			{ ...baseState, connection: { isConnected: false } },
			{ value: { x: 0, y: 0, z: 0 }, onChange: jest.fn(), unit: "mm" },
		);
		expect(screen.getByText("Grab").closest("button")).toBeDisabled();
		expect(screen.getByText("Go To").closest("button")).toBeDisabled();
	});
});

// ============================================================
// NumberSettingInput
// ============================================================
describe("NumberSettingInput", () => {
	beforeEach(() => {
		mockWorkspaceUnits = "mm";
	});

	it("displays the raw value when unit is not 'variable'", () => {
		render(
			<NumberSettingInput value={10} unit="mm/min" index={0} onChange={jest.fn()} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(10);
	});

	it("displays the raw value for unit='variable' in metric mode", () => {
		render(
			<NumberSettingInput value={10} unit="variable" index={0} onChange={jest.fn()} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(10);
	});

	it("converts to imperial for display when unit='variable' and workspace units are imperial", () => {
		mockWorkspaceUnits = "in";
		render(
			<NumberSettingInput value={25.4} unit="variable" index={0} onChange={jest.fn()} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(1);
	});

	it("does NOT convert when unit is a fixed unit (not 'variable'), even in imperial workspace mode", () => {
		mockWorkspaceUnits = "in";
		render(
			<NumberSettingInput value={100} unit="rpm" index={0} onChange={jest.fn()} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(100);
	});

	it("onChange receives the raw metric value directly when no conversion applies", () => {
		const onChange = jest.fn();
		render(
			<NumberSettingInput value={10} unit="mm/min" index={0} onChange={onChange} />,
		);
		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "50" },
		});
		expect(onChange).toHaveBeenCalledWith(50);
	});

	it("onChange converts a typed imperial value back to metric when unit='variable' in imperial mode", () => {
		mockWorkspaceUnits = "in";
		const onChange = jest.fn();
		render(
			<NumberSettingInput value={25.4} unit="variable" index={0} onChange={onChange} />,
		);
		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "2" }, // 2 inches typed
		});
		expect(onChange).toHaveBeenCalledWith(2 * 25.4);
	});

	it("defaults value to 0 when not provided", () => {
		render(
			<NumberSettingInput unit="mm" index={0} onChange={jest.fn()} value={undefined as any} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(0);
	});
});

// ============================================================
// PathSelection
// ============================================================
describe("PathSelection", () => {
	beforeEach(() => {
		mockIsElectronValue = false;
		delete (window as any).ipcRenderer;
	});

	it("renders the 'Choose Folder' button and the current value text", () => {
		render(<PathSelection value="/home/user/gsender" index={0} onChange={jest.fn()} />);
		expect(screen.getByText("Choose Folder")).toBeInTheDocument();
		expect(screen.getByText("/home/user/gsender")).toBeInTheDocument();
	});

	it("does not throw and does not touch ipcRenderer when not running in electron", () => {
		mockIsElectronValue = false;
		expect(() =>
			render(<PathSelection value="" index={0} onChange={jest.fn()} />),
		).not.toThrow();
		fireEvent.click(screen.getByText("Choose Folder"));
		// No ipcRenderer was ever set on window, so nothing to assert a
		// call against - the point is that clicking doesn't throw either.
	});

	it("sends open-directory-dialog via ipcRenderer when running in electron", () => {
		mockIsElectronValue = true;
		const send = jest.fn();
		const on = jest.fn();
		(window as any).ipcRenderer = { send, on };

		render(<PathSelection value="" index={0} onChange={jest.fn()} />);
		fireEvent.click(screen.getByText("Choose Folder"));
		expect(send).toHaveBeenCalledWith("open-directory-dialog");
	});

	it("registers a listener for the returned directory and calls onChange when it fires", () => {
		mockIsElectronValue = true;
		const send = jest.fn();
		let registeredCallback: ((...args: any[]) => void) | undefined;
		const on = jest.fn((_event: string, cb: any) => {
			registeredCallback = cb;
		});
		(window as any).ipcRenderer = { send, on };

		const onChange = jest.fn();
		render(<PathSelection value="" index={0} onChange={onChange} />);
		expect(on).toHaveBeenCalledWith(
			"returned-directory-dialog-data",
			expect.any(Function),
		);

		registeredCallback?.(null, "/chosen/directory");
		expect(onChange).toHaveBeenCalledWith("/chosen/directory");
	});
});

// ============================================================
// RadioSettingInput
// ============================================================
describe("RadioSettingInput", () => {
	it("renders one radio per option", () => {
		render(
			<RadioSettingInput
				options={["mm", "in"]}
				value="mm"
				index={0}
				onChange={jest.fn()}
			/>,
		);
		expect(screen.getAllByRole("radio")).toHaveLength(2);
		expect(screen.getByText("mm")).toBeInTheDocument();
		expect(screen.getByText("in")).toBeInTheDocument();
	});

	it("checks the radio matching the current value", () => {
		render(
			<RadioSettingInput
				options={["mm", "in"]}
				value="in"
				index={0}
				onChange={jest.fn()}
			/>,
		);
		const radios = screen.getAllByRole("radio");
		expect(radios[0]).not.toBeChecked();
		expect(radios[1]).toBeChecked();
	});

	it("coerces a numeric value to a string for comparison against string options", () => {
		render(
			<RadioSettingInput
				options={[0, 1, 2]}
				value={1}
				index={0}
				onChange={jest.fn()}
			/>,
		);
		const radios = screen.getAllByRole("radio");
		expect(radios[1]).toBeChecked();
	});

	it("selecting an option calls onChange with the option's string value", () => {
		const onChange = jest.fn();
		render(
			<RadioSettingInput
				options={["mm", "in"]}
				value="mm"
				index={0}
				onChange={onChange}
			/>,
		);
		fireEvent.click(screen.getAllByRole("radio")[1]);
		expect(onChange).toHaveBeenCalledWith("in");
	});

	it("renders no radios and does not crash when options is missing", () => {
		render(
			<RadioSettingInput
				options={undefined as any}
				value=""
				index={0}
				onChange={jest.fn()}
			/>,
		);
		expect(screen.queryAllByRole("radio")).toHaveLength(0);
	});
});

// ============================================================
// SelectSettingInput
// ============================================================
describe("SelectSettingInput", () => {
	it("renders the trigger showing the current value", () => {
		render(
			<SelectSettingInput
				options={["Slider", "Number"]}
				value="Slider"
				index={0}
				onChange={jest.fn()}
				disabled={() => false}
			/>,
		);
		expect(screen.getByTestId("select-trigger")).toHaveTextContent("Slider");
	});

	it("renders one item per option", () => {
		render(
			<SelectSettingInput
				options={["Slider", "Number"]}
				value="Slider"
				index={0}
				onChange={jest.fn()}
				disabled={() => false}
			/>,
		);
		expect(screen.getByTestId("select-item-Slider")).toBeInTheDocument();
		expect(screen.getByTestId("select-item-Number")).toBeInTheDocument();
	});

	it("selecting an item calls onChange with that option's value", () => {
		const onChange = jest.fn();
		render(
			<SelectSettingInput
				options={["Slider", "Number"]}
				value="Slider"
				index={0}
				onChange={onChange}
				disabled={() => false}
			/>,
		);
		fireEvent.click(screen.getByTestId("select-item-Number"));
		expect(onChange).toHaveBeenCalledWith("Number");
	});

	it("disables the trigger when disabled() returns true", () => {
		render(
			<SelectSettingInput
				options={["Slider", "Number"]}
				value="Slider"
				index={0}
				onChange={jest.fn()}
				disabled={() => true}
			/>,
		);
		expect(screen.getByTestId("select-trigger")).toBeDisabled();
	});

	it("defaults to enabled when disabled prop is not provided", () => {
		render(
			<SelectSettingInput
				options={["Slider", "Number"]}
				value="Slider"
				index={0}
				onChange={jest.fn()}
				disabled={undefined as any}
			/>,
		);
		expect(screen.getByTestId("select-trigger")).not.toBeDisabled();
	});

	it("renders no items and does not crash when options is missing", () => {
		render(
			<SelectSettingInput
				options={undefined as any}
				value=""
				index={0}
				onChange={jest.fn()}
				disabled={() => false}
			/>,
		);
		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});
});

// ============================================================
// TextAreaInput
// ============================================================
describe("TextAreaInput", () => {
	it("renders with the initial value", () => {
		render(<TextAreaInput value="G0 X0 Y0" index={0} onChange={jest.fn()} />);
		expect(screen.getByRole("textbox")).toHaveValue("G0 X0 Y0");
	});

	it("typing calls onChange with the new text", () => {
		const onChange = jest.fn();
		render(<TextAreaInput value="" index={0} onChange={onChange} />);
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "G0 X10" },
		});
		expect(onChange).toHaveBeenCalledWith("G0 X10");
	});

	it("renders 9 rows", () => {
		render(<TextAreaInput value="" index={0} onChange={jest.fn()} />);
		expect(screen.getByRole("textbox")).toHaveAttribute("rows", "9");
	});
});