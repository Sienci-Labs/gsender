import {
	handleSDCardMount,
	mountSDCard,
	refreshSDCardFiles,
} from "app/features/SDCard/utils/utils.ts";
import controller from "app/lib/controller.ts";
import reduxStore from "app/store/redux";
import {
	emptyAllSDFiles,
	updateSDCardMountStatus,
} from "app/store/redux/slices/controller.slice.ts";

// ---- Mocks ----

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		command: jest.fn(),
		addListener: jest.fn(),
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
	updateSDCardMountStatus: jest.fn((payload) => ({
		type: "updateSDCardMountStatus",
		payload,
	})),
}));

const mockAddListener = controller.addListener as jest.Mock;

describe("SDCard utils", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// ---- mountSDCard ----

	describe("mountSDCard", () => {
		it("sends the sdcard:mount command", () => {
			mountSDCard();
			expect(controller.command).toHaveBeenCalledWith("sdcard:mount");
			expect(controller.command).toHaveBeenCalledTimes(1);
		});

		it("does not register any listeners", () => {
			mountSDCard();
			expect(controller.addListener).not.toHaveBeenCalled();
		});
	});

	// ---- refreshSDCardFiles ----

	describe("refreshSDCardFiles", () => {
		it("clears existing SD files in the store before requesting a new list", () => {
			refreshSDCardFiles();
			expect(emptyAllSDFiles).toHaveBeenCalledTimes(1);
			expect(reduxStore.dispatch).toHaveBeenCalledWith({
				type: "emptyAllSDFiles",
			});
		});

		it("sends the sdcard:list command", () => {
			refreshSDCardFiles();
			expect(controller.command).toHaveBeenCalledWith("sdcard:list");
		});

		it("clears files before requesting the list (dispatch precedes command)", () => {
			const callOrder: string[] = [];
			(reduxStore.dispatch as jest.Mock).mockImplementation(() =>
				callOrder.push("dispatch"),
			);
			(controller.command as jest.Mock).mockImplementation(() =>
				callOrder.push("command"),
			);

			refreshSDCardFiles();

			expect(callOrder).toEqual(["dispatch", "command"]);
		});
	});

	// ---- handleSDCardMount ----

	describe("handleSDCardMount", () => {
		it("sends the sdcard:mount command", () => {
			handleSDCardMount();
			expect(controller.command).toHaveBeenCalledWith("sdcard:mount");
		});

		it("registers a serialport:read listener", () => {
			handleSDCardMount();
			expect(mockAddListener).toHaveBeenCalledWith(
				"serialport:read",
				expect.any(Function),
			);
		});

		it("dispatches updateSDCardMountStatus({ isMounted: true }) when the payload includes 'ok'", () => {
			handleSDCardMount();
			const handler = mockAddListener.mock.calls[0][1];

			handler("ok\r\n");

			expect(updateSDCardMountStatus).toHaveBeenCalledWith({
				isMounted: true,
			});
			expect(reduxStore.dispatch).toHaveBeenCalledWith({
				type: "updateSDCardMountStatus",
				payload: { isMounted: true },
			});
		});

		it("does not dispatch when the payload does not include 'ok'", () => {
			handleSDCardMount();
			const handler = mockAddListener.mock.calls[0][1];

			handler("error:9");

			expect(updateSDCardMountStatus).not.toHaveBeenCalled();
			expect(reduxStore.dispatch).not.toHaveBeenCalled();
		});

		it("matches 'ok' as a substring anywhere in the payload", () => {
			handleSDCardMount();
			const handler = mockAddListener.mock.calls[0][1];

			handler("some prefix ok some suffix");

			expect(updateSDCardMountStatus).toHaveBeenCalledWith({
				isMounted: true,
			});
		});

		it("registers a new listener each time it is called (documents current behavior)", () => {
			handleSDCardMount();
			handleSDCardMount();
			expect(mockAddListener).toHaveBeenCalledTimes(2);
		});
	});
});