import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "app/api";
import type { PluginInstallPlan } from "../../types";
import InstallPluginDialog from "../InstallPluginDialog";

jest.mock("is-electron", () => () => true);
jest.mock("app/api", () => ({
	__esModule: true,
	default: {
		plugins: {
			installPrepare: jest.fn(),
			installCommit: jest.fn(),
			installCancel: jest.fn(),
		},
	},
}));

const plugins = api.plugins as unknown as {
	installPrepare: jest.Mock;
	installCommit: jest.Mock;
	installCancel: jest.Mock;
};

// Captures the handler the dialog registers so tests can drive the picker.
let sourceHandler: ((event: unknown, payload: unknown) => void) | null = null;
const ipcSend = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	sourceHandler = null;

	(window as any).ipcRenderer = {
		send: ipcSend,
		on: (channel: string, handler: any) => {
			if (channel === "returned-plugin-source") {
				sourceHandler = handler;
			}
		},
		removeListener: (channel: string) => {
			if (channel === "returned-plugin-source") {
				sourceHandler = null;
			}
		},
	};

	plugins.installCancel.mockResolvedValue({ data: { ok: true } });
});

const makePlan = (
	overrides: Partial<PluginInstallPlan> = {},
): PluginInstallPlan => ({
	kind: "new",
	plugin: {
		id: "com.sienci.demo",
		name: "Demo Plugin",
		description: "Does demo things",
		version: "1.2.0",
		engine: ">=1.6.0",
		contributions: [{ slot: "tools-page", route: "demo", label: "Demo" }],
	},
	installedVersion: null,
	incomingVersion: "1.2.0",
	permissions: ["machine:read"],
	verifiedPermissions: ["machine:read"],
	declaredOnlyPermissions: [],
	capabilities: { requestTypes: [], topics: [], allowedFunctions: [] },
	scanned: true,
	unverifiable: false,
	engine: {
		checked: true,
		satisfied: true,
		appVersion: "1.6.2",
		range: ">=1.6.0",
	},
	shadowedBy: null,
	sourcePath: "/tmp/demo",
	targetDir: "/plugins/com.sienci.demo",
	...overrides,
});

const renderDialog = (
	props: Partial<React.ComponentProps<typeof InstallPluginDialog>> = {},
) =>
	render(
		<InstallPluginDialog
			show
			onClose={jest.fn()}
			onInstalled={jest.fn()}
			onRestartRequired={jest.fn()}
			{...props}
		/>,
	);

// Walks the wizard from the source step to the review step.
const advanceToReview = async (plan: PluginInstallPlan) => {
	plugins.installPrepare.mockResolvedValue({
		data: { ok: true, sessionId: "session-1", plan, log: [] },
	});

	await userEvent.click(screen.getByRole("button", { name: /from folder/i }));
	sourceHandler?.(null, { path: "/tmp/demo" });

	// The permissions heading is unique to the review step; the plugin name
	// appears both in the header and in the version banner.
	await screen.findByText("Permissions");
};

describe("InstallPluginDialog", () => {
	it("asks the main process for a folder or a zip", async () => {
		renderDialog();

		await userEvent.click(screen.getByRole("button", { name: /from folder/i }));
		expect(ipcSend).toHaveBeenCalledWith("open-plugin-source-dialog", "dir");

		sourceHandler?.(null, { canceled: true });

		await userEvent.click(screen.getByRole("button", { name: /from \.zip/i }));
		expect(ipcSend).toHaveBeenCalledWith("open-plugin-source-dialog", "zip");
	});

	it("stays on the source step when the user cancels the picker", async () => {
		renderDialog();

		await userEvent.click(screen.getByRole("button", { name: /from folder/i }));
		sourceHandler?.(null, { canceled: true });

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /from folder/i }),
			).toBeEnabled();
		});
		expect(plugins.installPrepare).not.toHaveBeenCalled();
	});

	it("shows the permissions and target before anything is installed", async () => {
		renderDialog();
		await advanceToReview(makePlan());

		expect(screen.getByText("machine:read")).toBeInTheDocument();
		expect(screen.getByText(/New install of/i)).toBeInTheDocument();
		expect(
			screen.getByText(/\/plugins\/com\.sienci\.demo/),
		).toBeInTheDocument();
		expect(plugins.installCommit).not.toHaveBeenCalled();
	});

	it("calls a downgrade a downgrade and labels the button accordingly", async () => {
		renderDialog();
		await advanceToReview(
			makePlan({
				kind: "downgrade",
				installedVersion: "2.0.0",
				incomingVersion: "1.2.0",
			}),
		);

		expect(screen.getByText(/This is a downgrade/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /downgrade anyway/i }),
		).toBeInTheDocument();
	});

	it("labels a same-version install as a reinstall", async () => {
		renderDialog();
		await advanceToReview(
			makePlan({
				kind: "reinstall",
				installedVersion: "1.2.0",
				incomingVersion: "1.2.0",
			}),
		);

		expect(screen.getByText(/already installed/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^reinstall$/i }),
		).toBeInTheDocument();
	});

	it("warns when the plugin targets a different gSender version", async () => {
		renderDialog();
		await advanceToReview(
			makePlan({
				engine: {
					checked: true,
					satisfied: false,
					appVersion: "1.5.2",
					range: ">=99.0.0",
				},
			}),
		);

		expect(screen.getByText(/may not work correctly/i)).toBeInTheDocument();
		// Still installable — an engine mismatch warns, it does not block.
		expect(screen.getByRole("button", { name: /^install$/i })).toBeEnabled();
	});

	it("marks permissions the manifest declares but the code does not confirm", async () => {
		renderDialog();
		await advanceToReview(
			makePlan({
				permissions: ["machine:read", "storage"],
				verifiedPermissions: ["machine:read"],
				declaredOnlyPermissions: ["storage"],
			}),
		);

		// Both are granted, but only one was corroborated by the bundle scan.
		expect(screen.getByText("machine:read")).toBeInTheDocument();
		expect(screen.getByText("storage")).toBeInTheDocument();
		// The phrase appears on the flagged permission and again in the note
		// below the list explaining what it means.
		expect(screen.getAllByText(/declared, not confirmed/i)).toHaveLength(2);
		expect(
			screen.getByText(/taking the author's word for it/i),
		).toBeInTheDocument();
	});

	it("warns when the plugin's SDK use cannot be verified", async () => {
		renderDialog();
		await advanceToReview(makePlan({ unverifiable: true }));

		expect(screen.getByText(/cannot be fully verified/i)).toBeInTheDocument();
	});

	it("reports manifest problems instead of offering to install", async () => {
		plugins.installPrepare.mockRejectedValue({
			response: {
				data: {
					ok: false,
					error: "This plugin's manifest is not valid",
					manifestErrors: ['Missing or invalid "id"'],
					log: [],
				},
			},
		});
		renderDialog();

		await userEvent.click(screen.getByRole("button", { name: /from folder/i }));
		sourceHandler?.(null, { path: "/tmp/broken" });

		expect(
			await screen.findByText(/manifest is not valid/i),
		).toBeInTheDocument();
		expect(screen.getByText('Missing or invalid "id"')).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /^install$/i }),
		).not.toBeInTheDocument();
	});

	it("offers a restart once the install succeeds", async () => {
		const onRestartRequired = jest.fn();
		plugins.installCommit.mockResolvedValue({
			data: { ok: true, restartRequired: true, replaced: false, log: [] },
		});
		renderDialog({ onRestartRequired });
		await advanceToReview(makePlan());

		await userEvent.click(screen.getByRole("button", { name: /^install$/i }));

		expect(await screen.findByText(/was installed/i)).toBeInTheDocument();
		expect(onRestartRequired).toHaveBeenCalled();

		await userEvent.click(screen.getByRole("button", { name: /restart now/i }));
		expect(ipcSend).toHaveBeenCalledWith("app-restart");
	});

	it("says the previous version was restored when the install fails", async () => {
		plugins.installCommit.mockRejectedValue({
			response: {
				data: {
					ok: false,
					error: "Install failed: EPERM",
					restored: true,
					log: [],
				},
			},
		});
		renderDialog();
		await advanceToReview(
			makePlan({ kind: "update", installedVersion: "1.0.0" }),
		);

		await userEvent.click(screen.getByRole("button", { name: /^update$/i }));

		expect(
			await screen.findByText(/Install failed: EPERM/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/previously installed version was put back/i),
		).toBeInTheDocument();
	});

	// --- Layout ---------------------------------------------------------------
	// The dialog used to be sized by its content, so it visibly jumped between
	// steps and again whenever a plugin requested more permissions.

	it("keeps the same panel size on every step", async () => {
		plugins.installCommit.mockResolvedValue({
			data: { ok: true, restartRequired: true, replaced: false, log: [] },
		});
		renderDialog();

		const panel = screen.getByRole("dialog");
		// Arbitrary-value class names are not valid CSS selectors, so scan instead.
		const bodyOf = () =>
			Array.from(panel.querySelectorAll("div")).find((element) =>
				element.className.includes("h-[420px]"),
			);

		const sizeOnSource = panel.className;
		expect(bodyOf()).toBeDefined();

		await advanceToReview(
			makePlan({
				// A long permission list is exactly what used to stretch the panel.
				permissions: ["machine:read", "machine:write", "storage", "redux:read"],
				verifiedPermissions: ["machine:read"],
				declaredOnlyPermissions: ["machine:write", "storage", "redux:read"],
			}),
		);
		expect(panel.className).toBe(sizeOnSource);
		expect(bodyOf()).toBeDefined();

		await userEvent.click(screen.getByRole("button", { name: /^install$/i }));
		await screen.findByText(/was installed/i);
		expect(panel.className).toBe(sizeOnSource);
		expect(bodyOf()).toBeDefined();
	});

	it("shows the activity log without needing a click", async () => {
		renderDialog();

		// Nothing to report before a plugin is chosen.
		expect(
			screen.queryByTestId("install-activity-log"),
		).not.toBeInTheDocument();
		expect(screen.getByText(/waiting for a plugin/i)).toBeInTheDocument();

		plugins.installPrepare.mockResolvedValue({
			data: {
				ok: true,
				sessionId: "session-1",
				plan: makePlan(),
				log: [
					{ level: "info", message: "Extracting demo.zip", at: "t1" },
					{ level: "warn", message: "Skipped 1 symlink entries", at: "t2" },
				],
			},
		});
		await userEvent.click(screen.getByRole("button", { name: /from folder/i }));
		sourceHandler?.(null, { path: "/tmp/demo" });

		const log = await screen.findByTestId("install-activity-log");
		expect(log).toHaveTextContent("Extracting demo.zip");
		expect(log).toHaveTextContent("Skipped 1 symlink entries");
	});

	it("summarises the version change in the info panel", async () => {
		renderDialog();
		await advanceToReview(
			makePlan({
				kind: "update",
				installedVersion: "0.1.0",
				incomingVersion: "0.2.0",
			}),
		);

		const version = screen.getByText("Version").closest("div");
		expect(version).toHaveTextContent("0.1.0");
		expect(version).toHaveTextContent("0.2.0");
		expect(screen.getByText("com.sienci.demo")).toBeInTheDocument();
	});

	it("offers no way out while the swap is in progress", async () => {
		// Never resolves, so the wizard stays on the installing step.
		plugins.installCommit.mockReturnValue(new Promise(() => {}));
		renderDialog();
		await advanceToReview(makePlan());

		await userEvent.click(screen.getByRole("button", { name: /^install$/i }));

		expect(
			await screen.findByText(/Installing Demo Plugin/i),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /back/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /^install$/i }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /close/i })).toBeDisabled();
	});

	it("discards the staged copy when the wizard is closed mid-review", async () => {
		const { rerender } = renderDialog();
		await advanceToReview(makePlan());

		rerender(
			<InstallPluginDialog
				show={false}
				onClose={jest.fn()}
				onInstalled={jest.fn()}
				onRestartRequired={jest.fn()}
			/>,
		);

		await waitFor(() => {
			expect(plugins.installCancel).toHaveBeenCalledWith("session-1");
		});
	});
});
