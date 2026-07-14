import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EEPROMNotConnectedWarning } from "app/features/Config/components/EEPROMNotConnectedWarning.tsx";

describe("EEPROMNotConnectedWarning", () => {
	// ---- Content rendering ----

	describe("content", () => {
		it("renders the alert role", () => {
			render(<EEPROMNotConnectedWarning connected={false} />);
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		it("renders the 'Disconnected!' message and explanatory text", () => {
			render(<EEPROMNotConnectedWarning connected={false} />);
			expect(screen.getByText("Disconnected!")).toBeInTheDocument();
			expect(
				screen.getByText(
					/Some settings may not appear unless connected to a machine\./,
				),
			).toBeInTheDocument();
		});

		it("includes a screen-reader-only 'Disconnected' label", () => {
			render(<EEPROMNotConnectedWarning connected={false} />);
			const srLabel = screen.getByText("Disconnected", { selector: "span" });
			expect(srLabel).toHaveClass("sr-only");
		});
	});

	// ---- Visibility toggling ----

	describe("visibility based on connected prop", () => {
		it("is visible (not hidden) when connected is false", () => {
			render(<EEPROMNotConnectedWarning connected={false} />);
			expect(screen.getByRole("alert")).not.toHaveClass("hidden");
		});

		it("is hidden when connected is true", () => {
			render(<EEPROMNotConnectedWarning connected={true} />);
			expect(screen.getByRole("alert")).toHaveClass("hidden");
		});

		it("still renders its content in the DOM even when hidden (hidden via CSS class, not unmounted)", () => {
			render(<EEPROMNotConnectedWarning connected={true} />);
			expect(screen.getByText("Disconnected!")).toBeInTheDocument();
		});
	});

	// ---- Base styling always present ----

	it("always applies the base alert styling regardless of connected state", () => {
		const { rerender } = render(<EEPROMNotConnectedWarning connected={false} />);
		expect(screen.getByRole("alert")).toHaveClass(
			"flex",
			"items-center",
			"text-yellow-800",
			"border-yellow-300",
			"bg-yellow-50",
		);

		rerender(<EEPROMNotConnectedWarning connected={true} />);
		expect(screen.getByRole("alert")).toHaveClass(
			"flex",
			"items-center",
			"text-yellow-800",
			"border-yellow-300",
			"bg-yellow-50",
		);
	});
});