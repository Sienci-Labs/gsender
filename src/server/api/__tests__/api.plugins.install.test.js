jest.mock("../../services/pluginregistry", () => ({
	getPluginsDirectory: jest.fn(() => "/plugins"),
	getUserPluginsDir: jest.fn(() => ""),
	isWithinAllowedRoots: jest.fn(() => true),
}));
jest.mock("../../services/pluginregistry/install", () => ({
	prepare: jest.fn(),
	commit: jest.fn(),
	cancel: jest.fn(),
	uninstall: jest.fn(),
}));
jest.mock("../../services/cncengine", () => ({
	__esModule: true,
	default: { emit: jest.fn() },
}));
jest.mock("../../lib/logger", () => () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

import cncengine from "../../services/cncengine";
import pluginInstaller from "../../services/pluginregistry/install";
import {
	installCancel,
	installCommit,
	installPrepare,
	uninstall,
} from "../api.plugins";

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

beforeEach(() => {
	jest.clearAllMocks();
});

describe("api.plugins.installPrepare", () => {
	it("passes the source path through and returns the plan", async () => {
		const plan = { kind: "new", permissions: ["storage"] };
		pluginInstaller.prepare.mockResolvedValue({
			ok: true,
			sessionId: "abc",
			plan,
		});
		const res = mockResponse();

		await installPrepare({ body: { sourcePath: "/tmp/demo" } }, res);

		expect(pluginInstaller.prepare).toHaveBeenCalledWith("/tmp/demo");
		expect(res.status).not.toHaveBeenCalled();
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ ok: true, sessionId: "abc", plan }),
		);
	});

	it("returns 400 with the reason when the source cannot be staged", async () => {
		pluginInstaller.prepare.mockResolvedValue({
			ok: false,
			error: "No gsender-plugin.json found",
		});
		const res = mockResponse();

		await installPrepare({ body: { sourcePath: "/tmp/nope" } }, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ ok: false, error: expect.any(String) }),
		);
	});

	it("turns an unexpected throw into a 500 rather than crashing", async () => {
		pluginInstaller.prepare.mockRejectedValue(new Error("disk on fire"));
		const res = mockResponse();

		await installPrepare({ body: { sourcePath: "/tmp/demo" } }, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				ok: false,
				error: expect.stringContaining("disk on fire"),
			}),
		);
	});

	it("tolerates a missing body", async () => {
		pluginInstaller.prepare.mockResolvedValue({ ok: false, error: "nothing" });
		const res = mockResponse();

		await installPrepare({}, res);

		expect(pluginInstaller.prepare).toHaveBeenCalledWith(undefined);
		expect(res.status).toHaveBeenCalledWith(400);
	});
});

describe("api.plugins.installCommit", () => {
	it("rejects a non-string sessionId without committing", () => {
		const res = mockResponse();

		installCommit({ body: { sessionId: 42 } }, res);

		expect(pluginInstaller.commit).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
	});

	it("notifies open clients once the plugin is installed", () => {
		pluginInstaller.commit.mockReturnValue({
			ok: true,
			pluginId: "com.sienci.demo",
			restartRequired: true,
		});
		const res = mockResponse();

		installCommit({ body: { sessionId: "abc" } }, res);

		expect(pluginInstaller.commit).toHaveBeenCalledWith("abc");
		expect(cncengine.emit).toHaveBeenCalledWith("plugins:changed", {
			pluginId: "com.sienci.demo",
		});
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ restartRequired: true }),
		);
	});

	it("returns 500 and does not notify clients when the install fails", () => {
		pluginInstaller.commit.mockReturnValue({
			ok: false,
			error: "Install failed: EPERM",
			restored: true,
		});
		const res = mockResponse();

		installCommit({ body: { sessionId: "abc" } }, res);

		expect(cncengine.emit).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ ok: false, restored: true }),
		);
	});
});

describe("api.plugins.installCancel", () => {
	it("cleans up the staged copy", () => {
		pluginInstaller.cancel.mockReturnValue({ ok: true });
		const res = mockResponse();

		installCancel({ body: { sessionId: "abc" } }, res);

		expect(pluginInstaller.cancel).toHaveBeenCalledWith("abc");
		expect(res.send).toHaveBeenCalledWith({ ok: true });
	});
});

describe("api.plugins.uninstall", () => {
	it("removes the plugin and notifies open clients", () => {
		pluginInstaller.uninstall.mockReturnValue({
			ok: true,
			pluginId: "com.sienci.demo",
			restartRequired: true,
		});
		const res = mockResponse();

		uninstall({ params: { id: "com.sienci.demo" } }, res);

		expect(pluginInstaller.uninstall).toHaveBeenCalledWith("com.sienci.demo");
		expect(cncengine.emit).toHaveBeenCalledWith("plugins:changed", {
			pluginId: "com.sienci.demo",
		});
	});

	it("returns 404 when the plugin is not installed", () => {
		pluginInstaller.uninstall.mockReturnValue({
			ok: false,
			error: "Plugin not found: com.sienci.missing",
		});
		const res = mockResponse();

		uninstall({ params: { id: "com.sienci.missing" } }, res);

		expect(cncengine.emit).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(404);
	});
});
