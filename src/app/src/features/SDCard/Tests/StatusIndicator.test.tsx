import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatusIndicator } from "app/features/SDCard/components/StatusIndicator.tsx";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";
import controller from "app/lib/controller.ts";
import { toast } from "app/lib/toaster";

// ---- Mocks ----

jest.mock("app/features/SDCard/hooks/useSDCard.ts", () => ({
	useSDCard: jest.fn(),
}));

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		addListener: jest.fn(),
		removeListener: jest.fn(),
	},
}));

jest.mock("app/lib/toaster", () => ({
	toast: {
		error: jest.fn(),
	},
}));

jest.mock("app/features/SDCard/components/ActionButtons.tsx", () => ({
	ActionButtons: () => <div data-testid="action-buttons" />,
}));

jest.mock("app/features/SDCard/components/UploadProgressBar.tsx", () => ({
	UploadProgressBar: ({ uploadState, uploadProgress }: any) => (
		<div
			data-testid="upload-progress-bar"
			data-state={uploadState}
			data-progress={uploadProgress}
		/>
	),
}));

jest.mock("lucide-react", () => ({
	HardDrive: () => <svg data-testid="icon-harddrive" />,
	CheckCircle: () => <svg data-testid="icon-checkcircle" />,
	XCircle: () => <svg data-testid="icon-xcircle" />,
}));

const mockUseSDCard = useSDCard as jest.Mock;
const mockAddListener = controller.addListener as jest.Mock;
const mockRemoveListener = controller.removeListener as jest.Mock;

// Helper to grab the handler registered for a given event name
const getHandler = (eventName: string) => {
	const call = mockAddListener.mock.calls.find((c) => c[0] === eventName);
	if (!call) throw new Error(`No listener registered for ${eventName}`);
	return call[1];
};

describe("StatusIndicator", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	const setup = (isConnected: boolean, isMounted: boolean) => {
		mockUseSDCard.mockReturnValue({ isConnected });
		return render(<StatusIndicator isMounted={isMounted} />);
	};

	// ---- Status text / styling ----

	describe("status states", () => {
		it("shows Disconnected when not connected", () => {
			setup(false, false);
			expect(screen.getByText("Disconnected")).toBeInTheDocument();
		});

		it("shows Disconnected even if isMounted is true, when not connected", () => {
			setup(false, true);
			expect(screen.getByText("Disconnected")).toBeInTheDocument();
		});

		it("shows Mounted when connected and mounted", () => {
			setup(true, true);
			expect(screen.getByText("Mounted")).toBeInTheDocument();
		});

		it("shows Unmounted when connected but not mounted", () => {
			setup(true, false);
			expect(screen.getByText("Unmounted")).toBeInTheDocument();
		});

		it("renders the CheckCircle icon when connected and mounted", () => {
			setup(true, true);
			expect(screen.getByTestId("icon-checkcircle")).toBeInTheDocument();
			expect(screen.queryByTestId("icon-xcircle")).not.toBeInTheDocument();
		});

		it("renders the XCircle icon when disconnected", () => {
			setup(false, false);
			expect(screen.getByTestId("icon-xcircle")).toBeInTheDocument();
			expect(screen.queryByTestId("icon-checkcircle")).not.toBeInTheDocument();
		});

		it("renders the XCircle icon when connected but unmounted", () => {
			setup(true, false);
			expect(screen.getByTestId("icon-xcircle")).toBeInTheDocument();
			expect(screen.queryByTestId("icon-checkcircle")).not.toBeInTheDocument();
		});
	});

	// ---- Listener registration / cleanup ----

	describe("ymodem listener lifecycle", () => {
		it("registers all four ymodem listeners on mount", () => {
			setup(true, true);
			expect(mockAddListener).toHaveBeenCalledWith(
				"ymodem:start",
				expect.any(Function),
			);
			expect(mockAddListener).toHaveBeenCalledWith(
				"ymodem:complete",
				expect.any(Function),
			);
			expect(mockAddListener).toHaveBeenCalledWith(
				"ymodem:progress",
				expect.any(Function),
			);
			expect(mockAddListener).toHaveBeenCalledWith(
				"ymodem:error",
				expect.any(Function),
			);
		});

		it("removes all four ymodem listeners on unmount", () => {
			const { unmount } = setup(true, true);
			unmount();
			expect(mockRemoveListener).toHaveBeenCalledWith(
				"ymodem:start",
				expect.any(Function),
			);
			expect(mockRemoveListener).toHaveBeenCalledWith(
				"ymodem:complete",
				expect.any(Function),
			);
			expect(mockRemoveListener).toHaveBeenCalledWith(
				"ymodem:progress",
				expect.any(Function),
			);
			expect(mockRemoveListener).toHaveBeenCalledWith(
				"ymodem:error",
				expect.any(Function),
			);
		});
	});

	// ---- Upload state transitions ----

	describe("upload state transitions", () => {
		it("shows ActionButtons and hides progress activity when idle", () => {
			setup(true, true);
			expect(screen.getByTestId("action-buttons")).toBeInTheDocument();
			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-state",
				"idle",
			);
		});

		it("switches to uploading state and hides ActionButtons on ymodem:start", () => {
			setup(true, true);
			const handleStart = getHandler("ymodem:start");

			act(() => {
				handleStart();
			});

			expect(screen.queryByTestId("action-buttons")).not.toBeInTheDocument();
			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-state",
				"uploading",
			);
			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-progress",
				"0",
			);
		});

		it("updates progress on ymodem:progress", () => {
			setup(true, true);
			const handleStart = getHandler("ymodem:start");
			const handleProgress = getHandler("ymodem:progress");

			act(() => {
				handleStart();
				handleProgress(42);
			});

			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-progress",
				"42",
			);
		});

		it("moves to complete on ymodem:complete, then back to idle after 1s", () => {
			setup(true, true);
			const handleComplete = getHandler("ymodem:complete");

			act(() => {
				handleComplete();
			});
			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-state",
				"complete",
			);
			expect(screen.queryByTestId("action-buttons")).not.toBeInTheDocument();

			act(() => {
				jest.advanceTimersByTime(1000);
			});

			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-state",
				"idle",
			);
			expect(screen.getByTestId("action-buttons")).toBeInTheDocument();
		});

		it("resets to idle and shows a toast on ymodem:error", () => {
			setup(true, true);
			const handleStart = getHandler("ymodem:start");
			const handleError = getHandler("ymodem:error");

			act(() => {
				handleStart();
				handleError("timeout");
			});

			expect(screen.getByTestId("upload-progress-bar")).toHaveAttribute(
				"data-state",
				"idle",
			);
			expect(toast.error).toHaveBeenCalledWith(
				"Error uploading file - timeout.",
			);
		});
	});
});