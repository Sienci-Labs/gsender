import { renderHook, act } from "@testing-library/react";
import { useSDCard } from "app/features/SDCard/hooks/useSDCard.ts";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";

// ---- Mocks ----

jest.mock("app/constants", () => ({
	WORKFLOW_STATE_IDLE: "idle",
}));

jest.mock("app/hooks/useTypedSelector.ts", () => ({
	useTypedSelector: jest.fn(),
}));

jest.mock("app/lib/controller.ts", () => ({
	__esModule: true,
	default: {
		command: jest.fn(),
	},
}));

const mockUseTypedSelector = useTypedSelector as jest.Mock;

// Builds a fake RootState and wires useTypedSelector to evaluate the real
// selector functions against it, mirroring how react-redux's useSelector works.
function buildState(overrides = {}) {
	const defaultState = {
		connection: { isConnected: false },
		controller: {
			type: "Grbl",
			state: { status: { sdCard: false, SD: undefined } },
			sdcard: { files: [] },
			workflow: { state: "run" },
			settings: { info: { NEWOPT: undefined } },
		},
	};

	// shallow-merge helper for nested overrides
	return {
		...defaultState,
		...overrides,
		connection: { ...defaultState.connection, ...(overrides as any).connection },
		controller: {
			...defaultState.controller,
			...(overrides as any).controller,
			state: {
				...defaultState.controller.state,
				...((overrides as any).controller?.state ?? {}),
			},
			sdcard: {
				...defaultState.controller.sdcard,
				...((overrides as any).controller?.sdcard ?? {}),
			},
			workflow: {
				...defaultState.controller.workflow,
				...((overrides as any).controller?.workflow ?? {}),
			},
			settings: {
				...defaultState.controller.settings,
				...((overrides as any).controller?.settings ?? {}),
			},
		},
	};
}

function wireSelector(state: any) {
	mockUseTypedSelector.mockImplementation((selector: any) => selector(state));
}

describe("useSDCard", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		wireSelector(buildState());
	});

	// ---- Direct state passthroughs ----

	describe("state passthroughs", () => {
		it("reflects isConnected from redux state", () => {
			wireSelector(buildState({ connection: { isConnected: true } }));
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isConnected).toBe(true);
		});

		it("reflects isMounted (sdCard status) from redux state", () => {
			wireSelector(
				buildState({ controller: { state: { status: { sdCard: true } } } }),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isMounted).toBe(true);
		});

		it("reflects files from redux state", () => {
			const files = [{ name: "a.gcode", size: 10 }];
			wireSelector(buildState({ controller: { sdcard: { files } } }));
			const { result } = renderHook(() => useSDCard());
			expect(result.current.files).toEqual(files);
		});

		it("reflects firmwareType from redux state", () => {
			wireSelector(buildState({ controller: { type: "grblHAL" } }));
			const { result } = renderHook(() => useSDCard());
			expect(result.current.firmwareType).toBe("grblHAL");
		});
	});

	// ---- isRunningSDFile ----
	// NOTE: the hook checks `sdRunReported !== null`. When no SD job is running,
	// the selector for `state.controller.state.status?.SD?.name` resolves to
	// `undefined` (not `null`), and `undefined !== null` is `true` - so
	// isRunningSDFile ends up `true` by default. This looks like a latent bug
	// (likely intended to be `!== undefined`) worth flagging to Kieran/Walid,
	// but these tests document the CURRENT behavior of the shipped hook.

	describe("isRunningSDFile", () => {
		it("is true when SD.name is a string (a file is running)", () => {
			wireSelector(
				buildState({
					controller: { state: { status: { SD: { name: "job.gcode" } } } },
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isRunningSDFile).toBe(true);
		});

		it("is true when SD.name is undefined, due to the `!== null` check (documents current behavior)", () => {
			wireSelector(
				buildState({ controller: { state: { status: { SD: undefined } } } }),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isRunningSDFile).toBe(true);
		});

		it("is false only when SD.name is explicitly null", () => {
			wireSelector(
				buildState({
					controller: { state: { status: { SD: { name: null } } } },
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isRunningSDFile).toBe(false);
		});
	});

	// ---- isWorkflowIdle ----

	describe("isWorkflowIdle", () => {
		it("is true when workflow.state equals WORKFLOW_STATE_IDLE", () => {
			wireSelector(buildState({ controller: { workflow: { state: "idle" } } }));
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isWorkflowIdle).toBe(true);
		});

		it("is false when workflow.state does not equal WORKFLOW_STATE_IDLE", () => {
			wireSelector(buildState({ controller: { workflow: { state: "run" } } }));
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isWorkflowIdle).toBe(false);
		});

		it("updates isWorkflowIdle when workflow state changes across renders", () => {
			wireSelector(buildState({ controller: { workflow: { state: "run" } } }));
			const { result, rerender } = renderHook(() => useSDCard());
			expect(result.current.isWorkflowIdle).toBe(false);

			wireSelector(buildState({ controller: { workflow: { state: "idle" } } }));
			rerender();
			expect(result.current.isWorkflowIdle).toBe(true);
		});
	});

	// ---- hasFTP / hasYM ----

	describe("hasFTP / hasYM", () => {
		it("are both false when NEWOPT is undefined", () => {
			wireSelector(
				buildState({ controller: { settings: { info: { NEWOPT: undefined } } } }),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.hasFTP).toBe(false);
			expect(result.current.hasYM).toBe(false);
		});

		it("hasFTP is true when NEWOPT has an FTP key", () => {
			wireSelector(
				buildState({
					controller: { settings: { info: { NEWOPT: { FTP: true } } } },
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.hasFTP).toBe(true);
			expect(result.current.hasYM).toBe(false);
		});

		it("hasYM is true when NEWOPT has a YM key", () => {
			wireSelector(
				buildState({
					controller: { settings: { info: { NEWOPT: { YM: true } } } },
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.hasYM).toBe(true);
			expect(result.current.hasFTP).toBe(false);
		});

		it("both are true when NEWOPT has both keys", () => {
			wireSelector(
				buildState({
					controller: {
						settings: { info: { NEWOPT: { FTP: true, YM: true } } },
					},
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.hasFTP).toBe(true);
			expect(result.current.hasYM).toBe(true);
		});

		it("are false when NEWOPT is an object without those keys", () => {
			wireSelector(
				buildState({
					controller: { settings: { info: { NEWOPT: { OTHER: true } } } },
				}),
			);
			const { result } = renderHook(() => useSDCard());
			expect(result.current.hasFTP).toBe(false);
			expect(result.current.hasYM).toBe(false);
		});
	});

	// ---- uploadFileToSDCard ----

	describe("uploadFileToSDCard", () => {
		it("sends ymodem:uploadFiles when given an array", () => {
			const { result } = renderHook(() => useSDCard());
			const filesData = [{ name: "a.gcode", content: "G0", size: 2 }];

			result.current.uploadFileToSDCard(filesData);

			expect(controller.command).toHaveBeenCalledWith(
				"ymodem:uploadFiles",
				filesData,
			);
		});

		it("sends ymodem:upload when given a single (non-array) file", () => {
			const { result } = renderHook(() => useSDCard());
			const fileData = { name: "a.gcode", content: "G0", size: 2 };

			result.current.uploadFileToSDCard(fileData);

			expect(controller.command).toHaveBeenCalledWith(
				"ymodem:upload",
				fileData,
			);
		});
	});

	// ---- runSDFile ----

	it("runSDFile sends sdcard:run with the given path", () => {
		const { result } = renderHook(() => useSDCard());
		result.current.runSDFile("job.gcode");
		expect(controller.command).toHaveBeenCalledWith("sdcard:run", "job.gcode");
	});

	// ---- deleteSDCard ----

	it("deleteSDCard does not call controller.command (currently a no-op / stub)", () => {
		const { result } = renderHook(() => useSDCard());
		result.current.deleteSDCard("job.gcode");
		expect(controller.command).not.toHaveBeenCalled();
	});

	// ---- isLoading state ----

	describe("isLoading", () => {
		it("defaults to false and can be toggled via setIsLoading", () => {
			const { result } = renderHook(() => useSDCard());
			expect(result.current.isLoading).toBe(false);

			act(() => {
				result.current.setIsLoading(true);
			});

			expect(result.current.isLoading).toBe(true);
		});
	});
});