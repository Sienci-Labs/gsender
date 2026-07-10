import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ActionButtons } from "app/features/SDCard/components/ActionButtons.tsx";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";
import { refreshSDCardFiles } from "app/features/SDCard/utils/utils.ts";

// Mock the hook
jest.mock("app/features/SDCard/hooks/useSDCard.ts", () => ({
	useSDCard: jest.fn(),
}));

// Mock the utils (named exports)
jest.mock("app/features/SDCard/utils/utils.ts", () => ({
	mountSDCard: jest.fn(),
	refreshSDCardFiles: jest.fn(),
}));

// Mock UploadModal so we can assert on its props without rendering its internals
jest.mock("app/features/SDCard/components/UploadModal.tsx", () => ({
	UploadModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
		<div data-testid="upload-modal" data-open={isOpen}>
			<button data-testid="upload-modal-close" onClick={onClose}>
				close
			</button>
		</div>
	),
}));

// Mock Button as a plain passthrough button
jest.mock("app/components/Button", () => ({
	__esModule: true,
	default: ({ children, onClick, disabled, className }: any) => (
		<button onClick={onClick} disabled={disabled} className={className}>
			{children}
		</button>
	),
}));

const mockUseSDCard = useSDCard as jest.Mock;

describe("ActionButtons", () => {
	const setIsLoading = jest.fn();

	const setup = (overrides = {}) => {
		mockUseSDCard.mockReturnValue({
			isMounted: true,
			isConnected: true,
			isLoading: false,
			setIsLoading,
			firmwareType: "grblHAL",
			hasFTP: true,
			hasYM: false,
			...overrides,
		});
		return render(<ActionButtons />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders Refresh Files and Upload buttons", () => {
		setup();
		expect(screen.getByText("Refresh Files")).toBeInTheDocument();
		expect(screen.getByText("Upload")).toBeInTheDocument();
	});

	it("calls refreshSDCardFiles when Refresh Files is clicked", () => {
		setup();
		fireEvent.click(screen.getByText("Refresh Files"));
		expect(refreshSDCardFiles).toHaveBeenCalledTimes(1);
	});

	it("enables both buttons when connected, grblHAL, has transfer, and mounted", () => {
		setup();
		expect(screen.getByText("Refresh Files").closest("button")).not.toBeDisabled();
		expect(screen.getByText("Upload").closest("button")).not.toBeDisabled();
	});

	it("disables Refresh Files when not connected", () => {
		setup({ isConnected: false });
		expect(screen.getByText("Refresh Files").closest("button")).toBeDisabled();
	});

	it("disables Refresh Files when firmwareType is not grblHAL", () => {
		setup({ firmwareType: "grbl" });
		expect(screen.getByText("Refresh Files").closest("button")).toBeDisabled();
	});

	it("disables Refresh Files when neither hasFTP nor hasYM is true", () => {
		setup({ hasFTP: false, hasYM: false });
		expect(screen.getByText("Refresh Files").closest("button")).toBeDisabled();
	});

	it("enables Refresh Files when hasYM is true even if hasFTP is false", () => {
		setup({ hasFTP: false, hasYM: true });
		expect(screen.getByText("Refresh Files").closest("button")).not.toBeDisabled();
	});

	it("disables Upload when SD card is not mounted, even if otherwise enabled", () => {
		setup({ isMounted: false });
		expect(screen.getByText("Upload").closest("button")).toBeDisabled();
	});

	it("disables Upload when the underlying 'disabled' condition is true (not connected)", () => {
		setup({ isConnected: false });
		expect(screen.getByText("Upload").closest("button")).toBeDisabled();
	});

	it("applies the animate-spin class to the refresh icon when isLoading is true", () => {
		const { container } = setup({ isLoading: true });
		const icon = container.querySelector("svg");
		expect(icon).toHaveClass("animate-spin");
	});

	it("does not apply the animate-spin class when isLoading is false", () => {
		const { container } = setup({ isLoading: false });
		const icon = container.querySelector("svg");
		expect(icon).not.toHaveClass("animate-spin");
	});

	it("renders UploadModal closed by default", () => {
		setup();
		expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-open", "false");
	});

	it("opens UploadModal when Upload button is clicked", () => {
		setup();
		fireEvent.click(screen.getByText("Upload"));
		expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-open", "true");
	});

	it("closes UploadModal when onClose is triggered", () => {
		setup();
		fireEvent.click(screen.getByText("Upload"));
		expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-open", "true");

		fireEvent.click(screen.getByTestId("upload-modal-close"));
		expect(screen.getByTestId("upload-modal")).toHaveAttribute("data-open", "false");
	});

	it("does not call refreshSDCardFiles when the Refresh Files button is disabled", () => {
		setup({ isConnected: false });
		fireEvent.click(screen.getByText("Refresh Files"));
		expect(refreshSDCardFiles).not.toHaveBeenCalled();
	});
});
