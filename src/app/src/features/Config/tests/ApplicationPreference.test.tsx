import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ApplicationPreferences } from "app/features/Config/components/ApplicationPreferences.tsx";
import {
	exportSettings,
	handleRestoreDefaultClick,
	importSettings,
} from "app/features/Config/utils/Settings.ts";

// ---- Mocks ----

jest.mock("app/features/Config/utils/Settings.ts", () => ({
	exportSettings: jest.fn(),
	handleRestoreDefaultClick: jest.fn(),
	importSettings: jest.fn(),
}));

// test focuses purely on ApplicationPreferences' own wiring.
jest.mock("app/features/Config/components/ActionButton.tsx", () => ({
	ActionButton: ({ label, icon, onClick, testId, disabled }: any) => (
		<button data-testid={testId} onClick={onClick} disabled={disabled}>
			{icon}
			<span>{label}</span>
		</button>
	),
}));

describe("ApplicationPreferences", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// ---- Rendering ----

	describe("rendering", () => {
		it("renders the 'gSender Preferences' legend", () => {
			render(<ApplicationPreferences />);
			expect(screen.getByText("gSender Preferences")).toBeInTheDocument();
		});

		it("renders Reset, Import, and Export buttons with their labels", () => {
			render(<ApplicationPreferences />);

			expect(screen.getByTestId("gsender-settings-reset-button")).toBeInTheDocument();
			expect(screen.getByText("Reset")).toBeInTheDocument();

			expect(screen.getByTestId("gsender-settings-import-button")).toBeInTheDocument();
			expect(screen.getByText("Import")).toBeInTheDocument();

			expect(screen.getByTestId("gsender-settings-export-button")).toBeInTheDocument();
			expect(screen.getByText("Export")).toBeInTheDocument();
		});

		it("renders a hidden file input restricted to .json files", () => {
			const { container } = render(<ApplicationPreferences />);
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;

			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute("accept", ".json");
			expect(input).toHaveClass("hidden");
		});
	});

	// ---- Button click wiring ----

	describe("button actions", () => {
		it("calls handleRestoreDefaultClick when Reset is clicked", () => {
			render(<ApplicationPreferences />);
			fireEvent.click(screen.getByTestId("gsender-settings-reset-button"));
			expect(handleRestoreDefaultClick).toHaveBeenCalledTimes(1);
		});

		it("calls exportSettings when Export is clicked", () => {
			render(<ApplicationPreferences />);
			fireEvent.click(screen.getByTestId("gsender-settings-export-button"));
			expect(exportSettings).toHaveBeenCalledTimes(1);
		});

		it("triggers the hidden file input's click when Import is clicked", () => {
			const { container } = render(<ApplicationPreferences />);
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			const clickSpy = jest.spyOn(input, "click");

			fireEvent.click(screen.getByTestId("gsender-settings-import-button"));

			expect(clickSpy).toHaveBeenCalledTimes(1);
		});
	});

	// ---- File input behavior ----

	describe("file input", () => {
		it("calls importSettings on change", () => {
			const { container } = render(<ApplicationPreferences />);
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;
			const file = new File(["{}"], "settings.json", {
				type: "application/json",
			});

			fireEvent.change(input, { target: { files: [file] } });

			expect(importSettings).toHaveBeenCalledTimes(1);
		});

		it("does not throw when the input itself is clicked directly (value-reset handler)", () => {
			const { container } = render(<ApplicationPreferences />);
			const input = container.querySelector(
				'input[type="file"]',
			) as HTMLInputElement;

			expect(() => {
				fireEvent.click(input);
			}).not.toThrow();
		});
	});
});