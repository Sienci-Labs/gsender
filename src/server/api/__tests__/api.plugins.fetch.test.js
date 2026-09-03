jest.mock("../../services/pluginregistry", () => ({
	discoverPlugins: jest.fn(() => []),
	getPluginsDirectory: jest.fn(),
	getUserPluginsDir: jest.fn(),
}));
jest.mock("../../lib/logger", () => () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

import pluginRegistry from "../../services/pluginregistry";
import { fetch } from "../api.plugins";

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

describe("api.plugins.fetch", () => {
	beforeEach(() => {
		pluginRegistry.discoverPlugins.mockReset().mockReturnValue([]);
		pluginRegistry.getPluginsDirectory.mockReset();
		pluginRegistry.getUserPluginsDir.mockReset();
	});

	it("includes both the default pluginsDir and the user's persisted userPluginsDir", () => {
		pluginRegistry.getPluginsDirectory.mockReturnValue(
			"/Users/me/userData/plugins",
		);
		pluginRegistry.getUserPluginsDir.mockReturnValue("/Users/me/my-plugins");
		const res = mockResponse();

		fetch({}, res);

		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				pluginsDir: "/Users/me/userData/plugins",
				userPluginsDir: "/Users/me/my-plugins",
			}),
		);
	});

	it("reports an empty userPluginsDir when none has been set, without dropping pluginsDir", () => {
		pluginRegistry.getPluginsDirectory.mockReturnValue(
			"/Users/me/userData/plugins",
		);
		pluginRegistry.getUserPluginsDir.mockReturnValue("");
		const res = mockResponse();

		fetch({}, res);

		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				pluginsDir: "/Users/me/userData/plugins",
				userPluginsDir: "",
			}),
		);
	});
});
