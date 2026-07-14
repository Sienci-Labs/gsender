import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
	EEPROMSection,
	isEEPROMSettingsSection,
} from "app/features/Config/components/EEPROMSection.tsx";
import { useSettings } from "app/features/Config/utils/SettingsContext.tsx";
import controller from "app/lib/controller.ts";
import { toast } from "app/lib/toaster";
import { useSelector } from "react-redux";

// ---- Mocks ----

jest.mock("app/features/Config/utils/SettingsContext.tsx", () => ({
	useSettings: jest.fn(),
}));

jest.mock("react-redux", () => ({
	useSelector: jest.fn(),
}));

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: { command: jest.fn() },
}));

jest.mock("app/lib/toaster", () => ({
	toast: { success: jest.fn() },
}));

jest.mock("react-icons/bi", () => ({
	BiReset: () => <svg data-testid="icon-reset" />,
}));

jest.mock("app/features/Config/components/EEPROMNotConnectedWarning.tsx", () => ({
	EEPROMNotConnectedWarning: () => <div data-testid="eeprom-warning" />,
}));

jest.mock("app/features/Config/components/EEPROMSettingRow.tsx", () => ({
	EEPROMSettingRow: ({ eID, changeHandler, resetHandler }: any) => (
		<div data-testid={`row-${eID}`}>
			<button
				data-testid={`change-${eID}`}
				onClick={() => changeHandler(0)("42")}
			>
				change
			</button>
			<button
				data-testid={`reset-${eID}`}
				onClick={() => resetHandler(eID, "10")}
			>
				reset
			</button>
		</div>
	),
}));

const mockUseSettings = useSettings as jest.Mock;
const mockUseSelector = useSelector as jest.Mock;

describe("EEPROMSection", () => {
	const setSettingsAreDirty = jest.fn();
	const setEEPROM = jest.fn();

	const twoSections = [
		{
			label: "Motor",
			eeprom: [{ eId: "$100" }, { eId: "$101" }],
		},
		{
			label: "Homing",
			eeprom: [{ eId: "$22" }],
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseSettings.mockReturnValue({
			EEPROM: [],
			setSettingsAreDirty,
			setEEPROM,
			searchTerm: "",
		});
		mockUseSelector.mockReturnValue(true); // connected by default
	});

	// ---- isEEPROMSettingsSection ----

	describe("isEEPROMSettingsSection", () => {
		it("returns true for an object with both label and eeprom keys", () => {
			expect(
				isEEPROMSettingsSection({ label: "Motor", eeprom: [] } as any),
			).toBe(true);
		});

		it("returns false when label is missing", () => {
			expect(isEEPROMSettingsSection({ eeprom: [] } as any)).toBe(false);
		});

		it("returns false when eeprom is missing", () => {
			expect(isEEPROMSettingsSection({ label: "Motor" } as any)).toBe(false);
		});

		it("returns false for an unrelated object", () => {
			expect(isEEPROMSettingsSection({ foo: "bar" } as any)).toBe(false);
		});
	});

	// ---- Connection gating ----

	describe("connection gating", () => {
		it("renders EEPROMNotConnectedWarning and nothing else when not connected", () => {
			mockUseSelector.mockReturnValue(false);
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			expect(screen.getByTestId("eeprom-warning")).toBeInTheDocument();
			expect(screen.queryByTestId("row-$100")).not.toBeInTheDocument();
		});

		it("renders the settings rows when connected", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			expect(screen.queryByTestId("eeprom-warning")).not.toBeInTheDocument();
			expect(screen.getByTestId("row-$100")).toBeInTheDocument();
		});
	});

	// ---- Rendering sections and rows ----

	describe("rendering sections and rows", () => {
		it("renders a wrapper for each settings section and a row for each eeprom entry", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			expect(screen.getByTestId("row-$100")).toBeInTheDocument();
			expect(screen.getByTestId("row-$101")).toBeInTheDocument();
			expect(screen.getByTestId("row-$22")).toBeInTheDocument();
		});

		it("shows a legend for each section when there is more than one section", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			expect(screen.getByText("Motor")).toBeInTheDocument();
			expect(screen.getByText("Homing")).toBeInTheDocument();
		});

		it("does not show a legend when there is only a single section", () => {
			const oneSection = [{ label: "Motor", eeprom: [{ eId: "$100" }] }];
			render(<EEPROMSection label="EEPROM" settings={oneSection} />);
			expect(screen.queryByText("Motor")).not.toBeInTheDocument();
		});

		it("renders nothing extra when settings is empty (default prop)", () => {
			render(<EEPROMSection label="EEPROM" />);
			expect(screen.queryByTestId(/^row-/)).not.toBeInTheDocument();
		});
	});

	// ---- handleSettingsChange ----

	describe("handleSettingsChange", () => {
		it("marks settings as dirty and updates the value + dirty flag for the changed setting", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);

			fireEvent.click(screen.getByTestId("change-$100"));

			expect(setSettingsAreDirty).toHaveBeenCalledWith(true);
			expect(setEEPROM).toHaveBeenCalledTimes(1);

			const updater = setEEPROM.mock.calls[0][0];
			const prevState = [
				{ setting: "$100", value: "5", dirty: false },
				{ setting: "$101", value: "1", dirty: false },
			];
			const result = updater(prevState);

			expect(result[0]).toMatchObject({ value: "42", dirty: true });
			// untouched entries should remain unchanged
			expect(result[1]).toEqual(prevState[1]);
		});

		it("does not mutate the original array reference (immutable update)", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			fireEvent.click(screen.getByTestId("change-$100"));

			const updater = setEEPROM.mock.calls[0][0];
			const prevState = [{ setting: "$100", value: "5", dirty: false }];
			const result = updater(prevState);

			expect(result).not.toBe(prevState);
		});
	});

	// ---- handleSingleSettingReset ----

	describe("handleSingleSettingReset", () => {
		it("resets the matching setting's value and clears its dirty flag", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			fireEvent.click(screen.getByTestId("reset-$100"));

			const updater = setEEPROM.mock.calls[0][0];
			const prevState = [
				{ setting: "$100", value: "5", dirty: true },
				{ setting: "$101", value: "1", dirty: false },
			];
			const result = updater(prevState);

			expect(result[0]).toMatchObject({
				setting: "$100",
				value: "10",
				dirty: false,
			});
			expect(result[1]).toEqual(prevState[1]);
		});

		it("sends the reset value via gcode and requests updated settings", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			fireEvent.click(screen.getByTestId("reset-$100"));

			expect(controller.command).toHaveBeenCalledWith("gcode", [
				"$100=10",
				"$$",
			]);
		});

		it("shows a success toast with the setting name and restored value", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			fireEvent.click(screen.getByTestId("reset-$100"));

			expect(toast.success).toHaveBeenCalledWith(
				"Restored $100 to default value of 10",
				{ position: "bottom-right" },
			);
		});

		it("still sends the gcode command and toast even if the setting isn't found in current EEPROM state (documents current behavior)", () => {
			render(<EEPROMSection label="EEPROM" settings={twoSections} />);
			fireEvent.click(screen.getByTestId("reset-$100"));

			const updater = setEEPROM.mock.calls[0][0];
			const prevStateWithoutMatch = [
				{ setting: "$999", value: "1", dirty: false },
			];
			const result = updater(prevStateWithoutMatch);

			// array is unchanged since no matching setting was found
			expect(result).toEqual(prevStateWithoutMatch);
			// but the side effects still fire regardless
			expect(controller.command).toHaveBeenCalledWith("gcode", [
				"$100=10",
				"$$",
			]);
			expect(toast.success).toHaveBeenCalled();
		});
	});
});