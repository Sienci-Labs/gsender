import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SDCard from "app/features/SDCard/index.tsx";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import redux from "app/store/redux";
import { emptyAllSDFiles } from "app/store/redux/slices/controller.slice.ts";

// ---- Mocks ----

jest.mock("app/constants", () => ({
	GRBL_ACTIVE_STATE_ALARM: "Alarm",
	GRBL_ACTIVE_STATE_IDLE: "Idle",
}));

jest.mock("app/features/SDCard/hooks/useSDCard.ts", () => ({
	useSDCard: jest.fn(),
}));

jest.mock("app/hooks/useTypedSelector.ts", () => ({
	useTypedSelector: jest.fn(),
}));

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		command: jest.fn(),
		state: { status: { activeState: undefined } },
	},
}));

jest.mock("app/store/redux", () => ({
	__esModule: true,
	default: {
		dispatch: jest.fn(),
	},
}));

jest.mock("app/store/redux/slices/controller.slice.ts", () => ({
	emptyAllSDFiles: jest.fn(() => ({ type: "emptyAllSDFiles" })),
}));

jest.mock("app/features/SDCard/components/StatusIndicator.tsx", () => ({
	StatusIndicator: ({ isMounted }: any) => (
		<div data-testid="status-indicator" data-mounted={isMounted} />
	),
}));

jest.mock("app/features/SDCard/components/FileList.tsx", () => ({
	FileList: () => <div data-testid="file-list" />,
}));

const mockUseSDCard = useSDCard as jest.Mock;
const mockUseTypedSelector = useTypedSelector as jest.Mock;

describe("SDCard (index)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// useTypedSelector's selector here reads from the `controller` module
		// directly (`controller.state.status?.activeState`) rather than from
		// the redux `state` argument passed in - this looks like a bug (it
		// likely should read `state.controller.state.status?.activeState`),
		// but we invoke the real selector against the mocked controller module
		// to reflect what the component actually does today.
		mockUseTypedSelector.mockImplementation((selector: any) =>
			selector({} as any),
		);
	});

	const setActiveState = (activeState: string | undefined) => {
		(controller as any).state.status.activeState = activeState;
	};

	const setup = (isMounted = false, isConnected = false) => {
		mockUseSDCard.mockReturnValue({ isMounted, isConnected });
		return render(<SDCard />);
	};

	// ---- Rendering ----

	describe("rendering", () => {
		it("renders the StatusIndicator with isMounted from useSDCard", () => {
			setActiveState(undefined);
			setup(true, false);
			expect(screen.getByTestId("status-indicator")).toHaveAttribute(
				"data-mounted",
				"true",
			);
		});

		it("renders isMounted=false through to StatusIndicator", () => {
			setActiveState(undefined);
			setup(false, false);
			expect(screen.getByTestId("status-indicator")).toHaveAttribute(
				"data-mounted",
				"false",
			);
		});

		it("renders FileList", () => {
			setActiveState(undefined);
			setup();
			expect(screen.getByTestId("file-list")).toBeInTheDocument();
		});
	});

	// ---- Mount-time SD file list refresh ----

	describe("initial SD file list refresh on mount", () => {
		it("dispatches emptyAllSDFiles and requests sdcard:list when connected and in Idle state", () => {
			setActiveState("Idle");
			setup(false, true);

			expect(emptyAllSDFiles).toHaveBeenCalledTimes(1);
			expect(redux.dispatch).toHaveBeenCalledWith({ type: "emptyAllSDFiles" });
			expect(controller.command).toHaveBeenCalledWith("sdcard:list");
		});

		it("dispatches emptyAllSDFiles and requests sdcard:list when connected and in Alarm state", () => {
			setActiveState("Alarm");
			setup(false, true);

			expect(redux.dispatch).toHaveBeenCalledWith({ type: "emptyAllSDFiles" });
			expect(controller.command).toHaveBeenCalledWith("sdcard:list");
		});

		it("does not refresh when not connected, even in Idle state", () => {
			setActiveState("Idle");
			setup(false, false);

			expect(redux.dispatch).not.toHaveBeenCalled();
			expect(controller.command).not.toHaveBeenCalled();
		});

		it("does not refresh when connected but activeState is not Idle or Alarm", () => {
			setActiveState("Run");
			setup(false, true);

			expect(redux.dispatch).not.toHaveBeenCalled();
			expect(controller.command).not.toHaveBeenCalled();
		});

		it("does not refresh when connected but activeState is undefined", () => {
			setActiveState(undefined);
			setup(false, true);

			expect(redux.dispatch).not.toHaveBeenCalled();
			expect(controller.command).not.toHaveBeenCalled();
		});

		it("only runs the refresh once on mount, even if the component re-renders (empty dependency array)", () => {
			setActiveState("Idle");
			const { rerender } = setup(false, true);

			expect(controller.command).toHaveBeenCalledTimes(1);

			// Change underlying values and force a re-render
			setActiveState("Run");
			mockUseSDCard.mockReturnValue({ isMounted: true, isConnected: false });
			rerender(<SDCard />);

			// Effect has an empty dependency array, so it should not re-fire
			expect(controller.command).toHaveBeenCalledTimes(1);
		});
	});
});