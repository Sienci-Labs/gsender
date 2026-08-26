jest.mock("../../services/pluginregistry", () => ({
	setUserPluginsDir: jest.fn(),
	getUserPluginsDir: jest.fn(() => ""),
}));
jest.mock("../../lib/logger", () => () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

import pluginRegistry from "../../services/pluginregistry";
import { updateSettings } from "../api.plugins";

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

describe("api.plugins.updateSettings", () => {
	beforeEach(() => {
		pluginRegistry.setUserPluginsDir.mockReset();
		pluginRegistry.getUserPluginsDir.mockReset().mockReturnValue("");
	});

	it("rejects a non-string pluginsDir without calling setUserPluginsDir", () => {
		const req = { body: { pluginsDir: 42 } };
		const res = mockResponse();

		updateSettings(req, res);

		expect(pluginRegistry.setUserPluginsDir).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ msg: expect.stringContaining("pluginsDir") }),
		);
	});

	it("treats a missing pluginsDir as clearing the setting", () => {
		pluginRegistry.setUserPluginsDir.mockReturnValue("");
		const req = { body: {} };
		const res = mockResponse();

		updateSettings(req, res);

		expect(pluginRegistry.setUserPluginsDir).toHaveBeenCalledWith("");
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ userPluginsDir: "", restartRequired: true }),
		);
	});

	it("saves a valid directory and reports restartRequired", () => {
		pluginRegistry.setUserPluginsDir.mockReturnValue("/Users/me/my-plugins");
		const req = { body: { pluginsDir: "/Users/me/my-plugins" } };
		const res = mockResponse();

		updateSettings(req, res);

		expect(pluginRegistry.setUserPluginsDir).toHaveBeenCalledWith(
			"/Users/me/my-plugins",
		);
		expect(res.send).toHaveBeenCalledWith({
			msg: "Plugin settings updated",
			userPluginsDir: "/Users/me/my-plugins",
			previousUserPluginsDir: "",
			restartRequired: true,
		});
	});

	it("reports the directory being abandoned as previousUserPluginsDir", () => {
		pluginRegistry.getUserPluginsDir.mockReturnValue("/Users/me/old-plugins");
		pluginRegistry.setUserPluginsDir.mockReturnValue("/Users/me/new-plugins");
		const req = { body: { pluginsDir: "/Users/me/new-plugins" } };
		const res = mockResponse();

		updateSettings(req, res);

		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				userPluginsDir: "/Users/me/new-plugins",
				previousUserPluginsDir: "/Users/me/old-plugins",
			}),
		);
	});

	it("responds with 500 if setUserPluginsDir throws", () => {
		pluginRegistry.setUserPluginsDir.mockImplementation(() => {
			throw new Error("disk full");
		});
		const req = { body: { pluginsDir: "/Users/me/my-plugins" } };
		const res = mockResponse();

		updateSettings(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({ msg: expect.stringContaining("disk full") }),
		);
	});
});
