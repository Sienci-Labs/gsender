import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";

/**
 * ASSUMPTION: utils.ts contract (not provided at time of writing).
 * getBitfieldArr(value)       -> array of 0/1, index 0 = least-significant bit
 * convertBitfieldToValue(arr) -> integer built from that same LSB-first array
 * If the real implementation differs, update this mock and re-run
 * (the toggle test in BitfieldInput and the binary-string tests in
 * BitValueIndicator are the first ones that will fail).
 */
jest.mock("../utils.ts", () => ({
	getBitfieldArr: jest.fn((value: number) => {
		const bin = Number(value).toString(2).padStart(8, "0").split("").reverse();
		return bin.map(Number);
	}),
	convertBitfieldToValue: jest.fn((bitArr: number[]) =>
		bitArr.reduce((acc, bit, i) => acc + (bit ? 1 << i : 0), 0),
	),
}));

// Mock the shadcn Switch as a plain checkbox input that forwards `value`
// as a real DOM attribute. BitfieldInput.onToggleOpt relies on reading
// it back via document.getElementById(id).value - if the real Switch
// doesn't forward `value` onto its root element, this is a latent bug
// (bitMap[undefined] silently no-ops). Flag to Kieran/Walid if confirmed.
jest.mock("app/components/shadcn/Switch", () => ({
	Switch: ({ id, onChange, checked, value, disabled }: any) => (
		<input
			type="checkbox"
			id={id}
			data-testid={id}
			checked={checked}
			readOnly
			value={value}
			disabled={disabled}
			onClick={() => onChange(!checked, id)}
		/>
	),
}));

jest.mock("app/components/shadcn/Badge", () => ({
	Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

jest.mock("app/components/shadcn/Tooltip", () => ({
	TooltipProvider: ({ children }: any) => <>{children}</>,
	Tooltip: ({ children }: any) => <div data-testid="tooltip-root">{children}</div>,
	TooltipTrigger: ({ children }: any) => <>{children}</>,
	TooltipContent: ({ children }: any) => (
		<div data-testid="tooltip-content">{children}</div>
	),
}));

// ASSUMPTION: shadcn Input is a simple forwardRef wrapper around a native
// <input>, per standard shadcn/ui conventions. ControlledInput/
// ControlledNumberInput rely on inputRef.current.value and
// inputRef.current.blur(), so the mock must forward the ref to a real
// DOM input for those tests to behave like production.
jest.mock("app/components/shadcn/Input", () => ({
	Input: React.forwardRef((props: any, ref: any) => (
		<input ref={ref} {...props} />
	)),
}));

import AxisMaskInput from "../AxisMaskInput";
import BitfieldInput from "../BitfieldInput";
import BitValueIndicator from "../BitValueIndicator";
import BooleanInput from "../BooleanInput";
import ControlledInput from "../ControlledInput";
import ControlledNumberInput from "../ControlledNumberInput";
import DecimalInput from "../DecimalInput";
import ExclusiveBitfieldInput from "../ExclusiveBitfieldInput";
import IntegerInput from "../IntegerInput";
import Ipv4Input from "../Ipv4Input";
import PasswordInput from "../PasswordInput";
import RadioButtonInput from "../RadioButtonInput";
import StringInput from "../StringInput";
import { getBitfieldArr, convertBitfieldToValue } from "../utils.ts";

afterEach(() => {
	jest.clearAllMocks();
});

// ============================================================
// AxisMaskInput
// ============================================================
// NOTE: jest.mock() calls are hoisted to the top of the file by Jest,
// regardless of where they're written - they can't be scoped to a single
// describe block. Since BitfieldInput needs to render for REAL further
// down in this file (see the "BitfieldInput" describe block), it is NOT
// mocked here. Instead, these tests assert on AxisMaskInput's redux
// wiring indirectly, through the real rendered output of BitfieldInput
// underneath it (e.g. checking which axis labels/switches appear).
describe("AxisMaskInput", () => {
	function renderWithStore(state: any, ownProps: any) {
		const store = createStore(() => state);
		return render(
			<Provider store={store}>
				<AxisMaskInput {...ownProps} />
			</Provider>,
		);
	}

	const baseProps = {
		info: { format: [] },
		setting: { setting: "$3", value: 0 },
		onChange: jest.fn(),
		disabled: false,
	};

	it("passes axes from redux state as externalFormat, rendering a row per axis", () => {
		renderWithStore(
			{ controller: { state: { axes: { axes: ["X", "Y", "Z", "A"] } } } },
			baseProps,
		);
		expect(screen.getByText("X:")).toBeInTheDocument();
		expect(screen.getByText("Y:")).toBeInTheDocument();
		expect(screen.getByText("Z:")).toBeInTheDocument();
		expect(screen.getByText("A:")).toBeInTheDocument();
	});

	it("falls back to ['X', 'Y', 'Z'] when axes are not present in redux state", () => {
		renderWithStore({ controller: { state: {} } }, baseProps);
		expect(screen.getByText("X:")).toBeInTheDocument();
		expect(screen.getByText("Y:")).toBeInTheDocument();
		expect(screen.getByText("Z:")).toBeInTheDocument();
		expect(screen.queryByText("A:")).not.toBeInTheDocument();
	});

	it("falls back to ['X', 'Y', 'Z'] when controller.state.axes.axes path is entirely missing", () => {
		renderWithStore({}, baseProps);
		expect(screen.getByText("X:")).toBeInTheDocument();
		expect(screen.getByText("Y:")).toBeInTheDocument();
		expect(screen.getByText("Z:")).toBeInTheDocument();
	});

	it("forwards disabled through to the underlying switches", () => {
		renderWithStore(
			{ controller: { state: { axes: { axes: ["X", "Y"] } } } },
			{
				info: { format: ["a", "b"] },
				setting: { setting: "$23", value: 3 },
				onChange: jest.fn(),
				disabled: true,
			},
		);
		expect(screen.getByTestId("$23-0-key")).toBeDisabled();
		expect(screen.getByTestId("$23-1-key")).toBeDisabled();
	});

	it("forwards onChange so toggling a switch calls it with the recomputed value", () => {
		const onChange = jest.fn();
		renderWithStore(
			{ controller: { state: { axes: { axes: ["X", "Y", "Z"] } } } },
			{
				info: { format: [] },
				setting: { setting: "$2", value: 0 },
				onChange,
				disabled: false,
			},
		);
		fireEvent.click(screen.getByTestId("$2-0-key"));
		expect(onChange).toHaveBeenCalledTimes(1);
	});
});

// ============================================================
// BitfieldInput
// ============================================================
describe("BitfieldInput", () => {
	const baseSetting = { setting: "$21", value: 1 }; // binary ...0001

	it("renders one row per non-N/A format label", () => {
		render(
			<BitfieldInput
				info={{ format: ["Enable Hard Limits", "Strict Mode"] }}
				setting={baseSetting}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("Enable Hard Limits:")).toBeInTheDocument();
		expect(screen.getByText("Strict Mode:")).toBeInTheDocument();
	});

	it("skips rendering a row for 'N/A' format entries", () => {
		render(
			<BitfieldInput
				info={{ format: ["Bit 0", "N/A", "Bit 2"] }}
				setting={baseSetting}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("Bit 0:")).toBeInTheDocument();
		expect(screen.getByText("Bit 2:")).toBeInTheDocument();
		expect(screen.queryByText("N/A:")).not.toBeInTheDocument();
	});

	it("uses externalFormat over info.format when both are provided", () => {
		render(
			<BitfieldInput
				info={{ format: ["Should not appear"] }}
				externalFormat={["X", "Y", "Z"]}
				setting={baseSetting}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("X:")).toBeInTheDocument();
		expect(screen.queryByText("Should not appear:")).not.toBeInTheDocument();
	});

	it("calls getBitfieldArr with the current setting value on mount", () => {
		render(
			<BitfieldInput
				info={{ format: ["A", "B"] }}
				setting={{ setting: "$21", value: 5 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(getBitfieldArr).toHaveBeenCalledWith(5);
	});

	it("re-derives the bit map when the setting prop changes", () => {
		const { rerender } = render(
			<BitfieldInput
				info={{ format: ["A", "B"] }}
				setting={{ setting: "$21", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		rerender(
			<BitfieldInput
				info={{ format: ["A", "B"] }}
				setting={{ setting: "$21", value: 3 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(getBitfieldArr).toHaveBeenLastCalledWith(3);
	});

	it("toggling a bit flips it and calls onChange with the recomputed integer value", () => {
		const onChange = jest.fn();
		render(
			<BitfieldInput
				info={{ format: ["Bit0", "Bit1"] }}
				setting={{ setting: "$21", value: 1 }} // bitMap = [1, 0, ...]
				onChange={onChange}
				disabled={false}
			/>,
		);
		fireEvent.click(screen.getByTestId("$21-1-key"));
		expect(convertBitfieldToValue).toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(3); // bit0=1, bit1=1 -> 3
	});

	it("disables all switches when the disabled prop is true", () => {
		render(
			<BitfieldInput
				info={{ format: ["Bit0", "Bit1"] }}
				setting={{ setting: "$21", value: 0 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByTestId("$21-0-key")).toBeDisabled();
		expect(screen.getByTestId("$21-1-key")).toBeDisabled();
	});

	it("in exclusive mode, disables bits after index 0 when bit 0 is off", () => {
		render(
			<BitfieldInput
				info={{ format: ["Master", "Sub A", "Sub B"] }}
				setting={{ setting: "$22", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
				isExclusive={true}
			/>,
		);
		expect(screen.getByTestId("$22-0-key")).not.toBeDisabled();
		expect(screen.getByTestId("$22-1-key")).toBeDisabled();
		expect(screen.getByTestId("$22-2-key")).toBeDisabled();
	});

	it("in exclusive mode, enables bits after index 0 once bit 0 is on", () => {
		render(
			<BitfieldInput
				info={{ format: ["Master", "Sub A", "Sub B"] }}
				setting={{ setting: "$22", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
				isExclusive={true}
			/>,
		);
		expect(screen.getByTestId("$22-1-key")).not.toBeDisabled();
		expect(screen.getByTestId("$22-2-key")).not.toBeDisabled();
	});

	it("renders BitValueIndicator with the setting value, format, and bit metadata", () => {
		render(
			<BitfieldInput
				info={{ format: ["A"], bits: { 0: "A" }, numBits: 1 }}
				setting={{ setting: "$5", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		// BitValueIndicator is not mocked in this combined file, so it
		// renders for real - assert on its own badge output.
		expect(screen.getByTestId("badge")).toHaveTextContent("1");
	});
});

// ============================================================
// BitValueIndicator
// ============================================================
describe("BitValueIndicator", () => {
	it("returns null when value is not numeric", () => {
		const { container } = render(
			<BitValueIndicator value={"not-a-number"} format={["A", "B"]} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders the numeric value in the badge", () => {
		render(<BitValueIndicator value={5} format={["A", "B", "C"]} />);
		expect(screen.getByTestId("badge")).toHaveTextContent("5");
	});

	it("accepts a numeric string value", () => {
		render(<BitValueIndicator value={"3"} format={["A", "B"]} />);
		expect(screen.getByTestId("badge")).toHaveTextContent("3");
	});

	it("shows the binary representation using the provided numBits width", () => {
		render(
			<BitValueIndicator value={5} format={["A", "B", "C"]} numBits={4} />,
		);
		expect(screen.getByTestId("tooltip-content")).toHaveTextContent("0b0101");
	});

	it("uses format labels when format is non-empty, ignoring bits", () => {
		render(
			<BitValueIndicator
				value={1}
				format={["Custom Label"]}
				bits={{ 0: "Should not be used" }}
			/>,
		);
		expect(screen.getByTestId("tooltip-content")).toHaveTextContent(
			"Bit 0: Custom Label",
		);
		expect(screen.getByTestId("tooltip-content")).not.toHaveTextContent(
			"Should not be used",
		);
	});

	it("falls back to `bits` map for labels when format is empty", () => {
		render(
			<BitValueIndicator
				value={3}
				format={[]}
				bits={{ 0: "Enable", 1: "Strict Mode" }}
			/>,
		);
		expect(screen.getByTestId("tooltip-content")).toHaveTextContent(
			"Bit 0: Enable",
		);
		expect(screen.getByTestId("tooltip-content")).toHaveTextContent(
			"Bit 1: Strict Mode",
		);
	});

	it("skips rendering a line for labels that are empty or 'N/A'", () => {
		render(<BitValueIndicator value={1} format={["Real Label", "N/A", ""]} />);
		const content = screen.getByTestId("tooltip-content");
		expect(content).toHaveTextContent("Bit 0: Real Label");
		expect(content).not.toHaveTextContent("Bit 1:");
		expect(content).not.toHaveTextContent("Bit 2:");
	});

	it("marks 'on' bits distinctly from 'off' bits via a checkmark", () => {
		render(<BitValueIndicator value={1} format={["Bit0", "Bit1"]} />);
		expect(screen.getByTestId("tooltip-content").textContent).toContain("✓");
	});

	it("defaults numBits to at least 8 when neither numBits nor labels require more", () => {
		render(<BitValueIndicator value={1} format={["Bit0"]} />);
		expect(screen.getByTestId("tooltip-content")).toHaveTextContent(
			"0b00000001",
		);
	});
});

// ============================================================
// BooleanInput
// ============================================================
describe("BooleanInput", () => {
	it("renders unchecked when setting.value is 0", () => {
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	it("renders checked when setting.value is 1", () => {
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("treats the string '1' as checked (Number(value) === 1 coercion)", () => {
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: "1" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("treats any non-1 value (e.g. 2) as unchecked", () => {
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 2 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	it("re-syncs displayed state when setting.value changes externally", () => {
		const { rerender } = render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).not.toBeChecked();

		rerender(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("toggling calls onChange with 1 when switching on", () => {
		const onChange = jest.fn();
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 0 }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		fireEvent.click(screen.getByRole("checkbox"));
		expect(onChange).toHaveBeenCalledWith(1);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("toggling calls onChange with 0 when switching off", () => {
		const onChange = jest.fn();
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 1 }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		fireEvent.click(screen.getByRole("checkbox"));
		expect(onChange).toHaveBeenCalledWith(0);
		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	it("disables the switch when disabled prop is true", () => {
		render(
			<BooleanInput
				info={{}}
				setting={{ setting: "$4", value: 0 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByRole("checkbox")).toBeDisabled();
	});
});

// ============================================================
// ControlledInput
// ============================================================
describe("ControlledInput", () => {
	it("renders with the initial value", () => {
		render(
			<ControlledInput className="foo" value="abc" externalOnChange={jest.fn()} />,
		);
		expect(screen.getByRole("textbox")).toHaveValue("abc");
	});

	it("typing updates the displayed value without calling externalOnChange yet", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "xyz" },
		});
		expect(screen.getByRole("textbox")).toHaveValue("xyz");
		expect(externalOnChange).not.toHaveBeenCalled();
	});

	it("calls externalOnChange with the new value on blur after a change", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "xyz" } });
		fireEvent.blur(input);
		expect(externalOnChange).toHaveBeenCalledWith("xyz");
	});

	it("reverts to the original value on blur when nothing changed", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.blur(input);
		expect(input).toHaveValue("abc");
		expect(externalOnChange).not.toHaveBeenCalled();
	});

	it("reverts to the original value on blur when the field was cleared to empty", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "" } });
		fireEvent.blur(input);
		// localValue is falsy ("") so the `if (localValue && ...)` guard
		// fails and it falls through to reverting, per current source.
		expect(input).toHaveValue("abc");
		expect(externalOnChange).not.toHaveBeenCalled();
	});

	it("Escape reverts to the original value and blurs the field", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "xyz" } });
		fireEvent.keyDown(input, { key: "Escape" });
		expect(input).toHaveValue("abc");
		expect(externalOnChange).not.toHaveBeenCalled();
	});

	it("Enter blurs the field, triggering the same commit-on-blur logic", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledInput
				className="foo"
				value="abc"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "xyz" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(externalOnChange).toHaveBeenCalledWith("xyz");
	});

	it("updates both original and local value when the value prop changes externally", () => {
		const { rerender } = render(
			<ControlledInput className="foo" value="abc" externalOnChange={jest.fn()} />,
		);
		rerender(
			<ControlledInput className="foo" value="new-external" externalOnChange={jest.fn()} />,
		);
		expect(screen.getByRole("textbox")).toHaveValue("new-external");
	});

	it("does not throw when externalOnChange is not provided", () => {
		render(<ControlledInput className="foo" value="abc" />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "xyz" } });
		expect(() => fireEvent.blur(input)).not.toThrow();
	});
});

// ============================================================
// ControlledNumberInput
// ============================================================
describe("ControlledNumberInput", () => {
	it("renders with the initial value and a native number input type", () => {
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				externalOnChange={jest.fn()}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		expect(input).toHaveValue(5);
		expect(input).toHaveAttribute("type", "number");
	});

	it("truncates to 3 decimal places on blur by default (type='decimal')", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "5.123456" } });
		fireEvent.blur(input);
		expect(externalOnChange).toHaveBeenCalledWith(5.123);
	});

	it("reverts without calling externalOnChange when the truncated value equals the original", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		// Truncates to 5, which equals the original value of 5.
		fireEvent.change(input, { target: { value: "5.0001" } });
		fireEvent.blur(input);
		expect(externalOnChange).not.toHaveBeenCalled();
		expect(input).toHaveValue(5);
	});

	it("does not truncate when type is not 'decimal'", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				type="integer"
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "7.987654" } });
		fireEvent.blur(input);
		expect(externalOnChange).toHaveBeenCalledWith("7.987654");
	});

	it("Escape reverts to the original value and blurs the field", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "99" } });
		fireEvent.keyDown(input, { key: "Escape" });
		expect(input).toHaveValue(5);
		expect(externalOnChange).not.toHaveBeenCalled();
	});

	it("Enter blurs the field, triggering the truncate-and-commit logic", () => {
		const externalOnChange = jest.fn();
		render(
			<ControlledNumberInput
				className="foo"
				value={5}
				externalOnChange={externalOnChange}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "9.1234" } });
		fireEvent.keyDown(input, { key: "Enter" });
		// Number(9.1234).toFixed(3) -> "9.123" -> Number -> 9.123
		expect(externalOnChange).toHaveBeenCalledWith(9.123);
	});

	it("updates both original and local value when the value prop changes externally", () => {
		const { rerender } = render(
			<ControlledNumberInput className="foo" value={5} externalOnChange={jest.fn()} />,
		);
		rerender(
			<ControlledNumberInput className="foo" value={42} externalOnChange={jest.fn()} />,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(42);
	});
});

// ============================================================
// DecimalInput
// ============================================================
describe("DecimalInput", () => {
	it("renders the initial value coerced to a number", () => {
		render(
			<DecimalInput
				info={{}}
				setting={{ setting: "$11", value: "0.5" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(0.5);
	});

	it("renders the unit label when info.unit is provided", () => {
		render(
			<DecimalInput
				info={{ unit: "mm" }}
				setting={{ setting: "$11", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("mm")).toBeInTheDocument();
	});

	it("renders no unit label when info.unit is absent", () => {
		render(
			<DecimalInput
				info={{}}
				setting={{ setting: "$11", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.queryByText("mm")).not.toBeInTheDocument();
	});

	it("forwards disabled to the underlying input", () => {
		render(
			<DecimalInput
				info={{}}
				setting={{ setting: "$11", value: 1 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toBeDisabled();
	});

	it("commits a truncated (3-decimal) value via onChange on blur", () => {
		const onChange = jest.fn();
		render(
			<DecimalInput
				info={{}}
				setting={{ setting: "$11", value: 1 }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "1.23456" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith(1.235);
	});
});

// ============================================================
// ExclusiveBitfieldInput
// ============================================================
describe("ExclusiveBitfieldInput", () => {
	it("renders the underlying bitfield switches", () => {
		render(
			<ExclusiveBitfieldInput
				info={{ format: ["Master", "Sub A", "Sub B"] }}
				setting={{ setting: "$22", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("Master:")).toBeInTheDocument();
		expect(screen.getByText("Sub A:")).toBeInTheDocument();
	});

	it("forces exclusive mode: disables dependent bits when the master bit is off", () => {
		render(
			<ExclusiveBitfieldInput
				info={{ format: ["Master", "Sub A", "Sub B"] }}
				setting={{ setting: "$22", value: 0 }} // bit0 = 0
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByTestId("$22-0-key")).not.toBeDisabled();
		expect(screen.getByTestId("$22-1-key")).toBeDisabled();
		expect(screen.getByTestId("$22-2-key")).toBeDisabled();
	});

	it("enables dependent bits once the master bit is on", () => {
		render(
			<ExclusiveBitfieldInput
				info={{ format: ["Master", "Sub A", "Sub B"] }}
				setting={{ setting: "$22", value: 1 }} // bit0 = 1
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByTestId("$22-1-key")).not.toBeDisabled();
		expect(screen.getByTestId("$22-2-key")).not.toBeDisabled();
	});

	it("forwards disabled through to disable all switches regardless of exclusive state", () => {
		render(
			<ExclusiveBitfieldInput
				info={{ format: ["Master", "Sub A"] }}
				setting={{ setting: "$22", value: 1 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByTestId("$22-0-key")).toBeDisabled();
		expect(screen.getByTestId("$22-1-key")).toBeDisabled();
	});
});

// ============================================================
// IntegerInput
// ============================================================
describe("IntegerInput", () => {
	it("renders the initial value coerced to a number", () => {
		render(
			<IntegerInput
				info={{}}
				setting={{ setting: "$24", value: "10" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toHaveValue(10);
	});

	it("renders the unit label when provided", () => {
		render(
			<IntegerInput
				info={{ unit: "mm/min" }}
				setting={{ setting: "$24", value: 10 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("mm/min")).toBeInTheDocument();
	});

	it("forwards disabled to the underlying input", () => {
		render(
			<IntegerInput
				info={{}}
				setting={{ setting: "$24", value: 10 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toBeDisabled();
	});

	it("passes step=1 through to the native input", () => {
		render(
			<IntegerInput
				info={{}}
				setting={{ setting: "$24", value: 10 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByRole("spinbutton")).toHaveAttribute("step", "1");
	});

	it("BUG (flag to dev): type is hardcoded to 'decimal' instead of 'integer', so 3-decimal truncation still applies rather than rounding to a whole number", () => {
		const onChange = jest.fn();
		render(
			<IntegerInput
				info={{}}
				setting={{ setting: "$24", value: 10 }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "7.6789" } });
		fireEvent.blur(input);
		// If this were correctly typed as "integer", we'd expect 8 (rounded
		// to a whole number). Instead it truncates to 3 decimals like
		// DecimalInput does, because IntegerInput hardcodes type="decimal".
		expect(onChange).toHaveBeenCalledWith(7.679);
	});
});

// ============================================================
// Ipv4Input
// ============================================================
describe("Ipv4Input", () => {
	it("renders as a text input with the initial value", () => {
		render(
			<Ipv4Input
				info={{}}
				setting={{ setting: "$conn.ip", value: "192.168.5.1" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("textbox");
		expect(input).toHaveValue("192.168.5.1");
		expect(input).toHaveAttribute("type", "text");
	});

	it("renders the unit label when provided", () => {
		render(
			<Ipv4Input
				info={{ unit: "IP" }}
				setting={{ setting: "$conn.ip", value: "192.168.5.1" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("IP")).toBeInTheDocument();
	});

	it("forwards disabled to the underlying input", () => {
		render(
			<Ipv4Input
				info={{}}
				setting={{ setting: "$conn.ip", value: "192.168.5.1" }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	it("commits the new value via onChange on blur after a change", () => {
		const onChange = jest.fn();
		render(
			<Ipv4Input
				info={{}}
				setting={{ setting: "$conn.ip", value: "192.168.5.1" }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "10.0.0.1" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith("10.0.0.1");
	});
});

// ============================================================
// PasswordInput
// ============================================================
describe("PasswordInput", () => {
	it("renders as a password-type input", () => {
		render(
			<PasswordInput
				info={{}}
				setting={{ setting: "$wifi.pass", value: "secret" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		// Password inputs aren't exposed via getByRole('textbox'); query
		// by the type attribute instead.
		const input = document.querySelector('input[type="password"]');
		expect(input).not.toBeNull();
		expect(input).toHaveValue("secret");
	});

	it("renders the unit label when provided", () => {
		render(
			<PasswordInput
				info={{ unit: "WPA2" }}
				setting={{ setting: "$wifi.pass", value: "secret" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("WPA2")).toBeInTheDocument();
	});

	it("forwards disabled to the underlying input", () => {
		render(
			<PasswordInput
				info={{}}
				setting={{ setting: "$wifi.pass", value: "secret" }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		const input = document.querySelector('input[type="password"]');
		expect(input).toBeDisabled();
	});

	it("commits the new value via onChange on blur after a change", () => {
		const onChange = jest.fn();
		render(
			<PasswordInput
				info={{}}
				setting={{ setting: "$wifi.pass", value: "secret" }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const input = document.querySelector('input[type="password"]') as HTMLInputElement;
		fireEvent.change(input, { target: { value: "newpass" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith("newpass");
	});
});

// ============================================================
// RadioButtonInput
// ============================================================
describe("RadioButtonInput", () => {
	it("renders one radio button per format option", () => {
		render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getAllByRole("radio")).toHaveLength(2);
		expect(screen.getByText("mm:")).toBeInTheDocument();
		expect(screen.getByText("in:")).toBeInTheDocument();
	});

	it("checks the radio matching the current setting value", () => {
		render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		const radios = screen.getAllByRole("radio");
		expect(radios[0]).not.toBeChecked();
		expect(radios[1]).toBeChecked();
	});

	it("coerces a string setting value to a number for the initial checked state", () => {
		render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: "1" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getAllByRole("radio")[1]).toBeChecked();
	});

	it("clicking an option calls onChange with the numeric index and updates the checked radio", () => {
		const onChange = jest.fn();
		render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 0 }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const radios = screen.getAllByRole("radio");
		fireEvent.click(radios[1]);
		expect(onChange).toHaveBeenCalledWith(1);
		expect(radios[1]).toBeChecked();
		expect(radios[0]).not.toBeChecked();
	});

	it("re-syncs the checked radio when setting.value changes externally", () => {
		const { rerender } = render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		rerender(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 1 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getAllByRole("radio")[1]).toBeChecked();
	});

	it("disables every radio when disabled is true", () => {
		render(
			<RadioButtonInput
				info={{ format: ["mm", "in"] }}
				setting={{ setting: "$units", value: 0 }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		for (const radio of screen.getAllByRole("radio")) {
			expect(radio).toBeDisabled();
		}
	});

	it("renders no radios and does not crash when format is missing", () => {
		render(
			<RadioButtonInput
				info={{}}
				setting={{ setting: "$units", value: 0 }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.queryAllByRole("radio")).toHaveLength(0);
	});
});

// ============================================================
// StringInput
// ============================================================
describe("StringInput", () => {
	it("renders as a text input with the initial value", () => {
		render(
			<StringInput
				info={{}}
				setting={{ setting: "$hostname", value: "gsender" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("textbox");
		expect(input).toHaveValue("gsender");
		expect(input).toHaveAttribute("type", "text");
	});

	it("renders the unit label when provided", () => {
		render(
			<StringInput
				info={{ unit: "hostname" }}
				setting={{ setting: "$hostname", value: "gsender" }}
				onChange={jest.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("hostname")).toBeInTheDocument();
	});

	it("forwards disabled to the underlying input", () => {
		render(
			<StringInput
				info={{}}
				setting={{ setting: "$hostname", value: "gsender" }}
				onChange={jest.fn()}
				disabled={true}
			/>,
		);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	it("commits the new value via onChange on blur after a change", () => {
		const onChange = jest.fn();
		render(
			<StringInput
				info={{}}
				setting={{ setting: "$hostname", value: "gsender" }}
				onChange={onChange}
				disabled={false}
			/>,
		);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "my-cnc" } });
		fireEvent.blur(input);
		expect(onChange).toHaveBeenCalledWith("my-cnc");
	});
});