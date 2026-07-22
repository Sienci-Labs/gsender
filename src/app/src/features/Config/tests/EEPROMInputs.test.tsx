import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";

jest.mock("../components/EEPROMInputs/utils.ts", () => ({
    getBitfieldArr: jest.fn((value: number) => {
        const bin = Number(value).toString(2).padStart(8, "0").split("").reverse();
        return bin.map(Number);
    }),
    convertBitfieldToValue: jest.fn((bitArr: number[]) =>
        bitArr.reduce((acc, bit, i) => acc + (bit ? 1 << i : 0), 0),
    ),
}));

jest.mock("app/components/shadcn/Switch", () => {
    const React = require("react");
    return {
        Switch: ({ id, onChange, checked, value, disabled }: any) =>
            React.createElement("input", {
                type: "checkbox",
                id,
                "data-testid": id,
                checked,
                readOnly: true,
                value,
                disabled,
                onClick: () => onChange(!checked, id),
            }),
    };
});

jest.mock("app/components/shadcn/Badge", () => {
    const React = require("react");
    return {
        Badge: ({ children }: any) =>
            React.createElement("span", { "data-testid": "badge" }, children),
    };
});

jest.mock("app/components/shadcn/Tooltip", () => {
    const React = require("react");
    return {
        TooltipProvider: ({ children }: any) =>
            React.createElement(React.Fragment, null, children),
        Tooltip: ({ children }: any) =>
            React.createElement("div", { "data-testid": "tooltip-root" }, children),
        TooltipTrigger: ({ children }: any) =>
            React.createElement(React.Fragment, null, children),
        TooltipContent: ({ children }: any) =>
            React.createElement(
                "div",
                { "data-testid": "tooltip-content" },
                children,
            ),
    };
});

jest.mock("app/components/shadcn/Input", () => {
    const React = require("react");
    return {
        Input: React.forwardRef((props: any, ref: any) =>
            React.createElement("input", { ref, ...props }),
        ),
    };
});

import AxisMaskInput from "../components/EEPROMInputs/AxisMaskInput";
import BitfieldInput from "../components/EEPROMInputs/BitfieldInput";
import BitValueIndicator from "../components/EEPROMInputs/BitValueIndicator";
import BooleanInput from "../components/EEPROMInputs/BooleanInput";
import ControlledInput from "../components/EEPROMInputs/ControlledInput";
import ControlledNumberInput from "../components/EEPROMInputs/ControlledNumberInput";
import {
    getBitfieldArr,
    convertBitfieldToValue,
} from "../components/EEPROMInputs/utils.ts";

afterEach(() => {
    jest.clearAllMocks();
});

// ============================================================
// AxisMaskInput
// ============================================================

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
    // Test 1: Checks the component correctly retirves axes from Redux and passes them to BitfieldInput
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

    //Test 2: it checks if there are no axes present , returns to default state

    it("falls back to ['X', 'Y', 'Z'] when axes are not present in redux state", () => {
        renderWithStore({ controller: { state: {} } }, baseProps);
        expect(screen.getByText("X:")).toBeInTheDocument();
        expect(screen.getByText("Y:")).toBeInTheDocument();
        expect(screen.getByText("Z:")).toBeInTheDocument();
        expect(screen.queryByText("A:")).not.toBeInTheDocument();
    });
    //Test 3. It checks if the entire oath os absent lodash/get() safetly returns ["X","Y","Z"]
    it("falls back to ['X', 'Y', 'Z'] when controller.state.axes.axes path is entirely missing", () => {
        renderWithStore({}, baseProps);
        expect(screen.getByText("X:")).toBeInTheDocument();
        expect(screen.getByText("Y:")).toBeInTheDocument();
        expect(screen.getByText("Z:")).toBeInTheDocument();
    });
    //Test 4: properly forwards the prop to BitfieldInput.
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
    //Test : 5 AxisMaskInput does not modify or block the callback.
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
    //Test 6: verify the exact number of rendered axes
    it("renders one switch per axis", () => {
        renderWithStore(
            {
                controller: {
                    state: {
                        axes: {
                            axes: ["X", "Y", "Z", "A"],
                        },
                    },
                },
            },
            baseProps,
        );

        expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    });
});

// ============================================================
// BitfieldInput
// ============================================================

// Bitfield input renders a set of switches repersentign individual bits--- Converts setting value into a bit array for display ----> convert updated array to integer ( when user toggle switch)

describe("BitfieldInput", () => {
    const baseSetting = { setting: "$21", value: 1 }; // binary ...0001

//Test 1:Verify every valid label provied in format is displyed

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
//Test 2: Checks whether the row for N/A formats are skipped
 
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
    expect(screen.queryByText("N/A:")).not.toBeInTheDocument(); // <-- queryByText, not getByText
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

 it("respects numBits only when it exceeds the 8-bit floor", () => {
    render(
        <BitValueIndicator value={5} format={["A", "B", "C"]} numBits={4} />,
    );
    // numBits=4 doesn't shrink below the component's built-in 8-bit minimum
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("0b00000101");
});

it("widens the binary display when numBits exceeds 8", () => {
    render(
        <BitValueIndicator value={5} format={["A", "B", "C"]} numBits={12} />,
    );
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("0b000000000101");
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
    input.focus();                                 // <-- real DOM focus, not fireEvent.focus
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
    input.focus();                                    
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