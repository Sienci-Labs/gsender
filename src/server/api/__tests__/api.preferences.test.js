jest.mock("../../services/configstore/preferencesStore", () => ({
	__esModule: true,
	default: { get: jest.fn(), replace: jest.fn() },
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
import preferencesStore from "../../services/configstore/preferencesStore";
import { fetch, replace } from "../api.preferences";

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

describe("api.preferences", () => {
	beforeEach(() => {
		preferencesStore.get.mockReset();
		preferencesStore.replace.mockReset();
		cncengine.emit.mockReset();
	});

	it("fetch returns the stored preferences", () => {
		preferencesStore.get.mockReturnValue({ version: "1", state: { a: 1 } });
		const res = mockResponse();

		fetch({}, res);

		expect(res.send).toHaveBeenCalledWith({ version: "1", state: { a: 1 } });
	});

	it("replace persists version+state and broadcasts preferences:changed with the originId", () => {
		const res = mockResponse();

		replace(
			{ body: { version: "1", state: { a: 2 }, originId: "client-1" } },
			res,
		);

		expect(preferencesStore.replace).toHaveBeenCalledWith({
			version: "1",
			state: { a: 2 },
		});
		expect(cncengine.emit).toHaveBeenCalledWith("preferences:changed", {
			version: "1",
			state: { a: 2 },
			originId: "client-1",
		});
		expect(res.send).toHaveBeenCalledWith({ message: "gSender preferences saved" });
	});

	it("replace reports a 500 and does not broadcast when saving throws", () => {
		preferencesStore.replace.mockImplementation(() => {
			throw new Error("disk full");
		});
		const res = mockResponse();

		replace({ body: { version: "1", state: { a: 1 } } }, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(cncengine.emit).not.toHaveBeenCalled();
	});

	it("replace rejects a missing or empty state and leaves the store untouched", () => {
		for (const body of [undefined, {}, { version: "1" }, { state: {} }]) {
			const res = mockResponse();
			replace({ body }, res);
			expect(res.status).toHaveBeenCalledWith(400);
		}
		expect(preferencesStore.replace).not.toHaveBeenCalled();
		expect(cncengine.emit).not.toHaveBeenCalled();
	});
});
