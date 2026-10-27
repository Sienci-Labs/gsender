import { PENDING_PAIR_TTL_MS, PairingStore } from "../pairing";

// Minimal stand-in for configstore's dotted-path get/set.
const makeStore = () => {
	const data = {};
	return {
		data,
		get: (key, def) => (key in data ? data[key] : def),
		set: (key, value) => {
			data[key] = value;
		},
	};
};

const DESKTOP = { desktopId: "desk-1", desktopName: "Shop PC" };

describe("PairingStore", () => {
	let store;
	let pairing;

	beforeEach(() => {
		store = makeStore();
		pairing = new PairingStore(store, "remoteFileReceive");
	});

	it("creates a device id once and reuses it", () => {
		const id = pairing.getDeviceId();
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
		expect(pairing.getDeviceId()).toBe(id);
	});

	it("claims a scanned nonce and verifies the issued key", () => {
		pairing.setPendingPair({ nonce: "abc", ...DESKTOP });

		const result = pairing.claim({ nonce: "abc", desktopId: "desk-1" }, null);

		expect(result).toMatchObject({ desktopId: "desk-1", desktopName: "Shop PC" });
		expect(pairing.verify("desk-1", result.key)).toBe(true);
		expect(pairing.verify("desk-1", "wrong")).toBe(false);
		expect(pairing.verify("desk-2", result.key)).toBe(false);
	});

	it("stores only a hash of the key", () => {
		pairing.setPendingPair({ nonce: "abc", ...DESKTOP });
		const { key } = pairing.claim({ nonce: "abc", desktopId: "desk-1" }, null);

		expect(JSON.stringify(store.data)).not.toContain(key);
	});

	it("consumes the nonce so it can't be claimed twice", () => {
		pairing.setPendingPair({ nonce: "abc", ...DESKTOP });
		pairing.claim({ nonce: "abc", desktopId: "desk-1" }, null);

		expect(pairing.claim({ nonce: "abc", desktopId: "desk-1" }, null)).toBeNull();
	});

	it("rejects a nonce claimed by a different desktop", () => {
		pairing.setPendingPair({ nonce: "abc", ...DESKTOP });

		expect(pairing.claim({ nonce: "abc", desktopId: "desk-2" }, null)).toBeNull();
	});

	it("rejects an expired nonce", () => {
		const now = 1_000_000;
		pairing.setPendingPair({ nonce: "abc", ...DESKTOP }, now);

		expect(
			pairing.claim(
				{ nonce: "abc", desktopId: "desk-1" },
				null,
				now + PENDING_PAIR_TTL_MS,
			),
		).toBeNull();
	});

	it("claims with the on-screen code", () => {
		const result = pairing.claim({ code: "123456", ...DESKTOP }, "123456");

		expect(result).not.toBeNull();
		expect(pairing.verify("desk-1", result.key)).toBe(true);
		expect(pairing.claim({ code: "000000", ...DESKTOP }, "123456")).toBeNull();
	});

	it("forgets a desktop so its key stops working", () => {
		const { key } = pairing.claim({ code: "123456", ...DESKTOP }, "123456");

		expect(pairing.listTrusted()).toEqual([
			expect.objectContaining({ id: "desk-1", name: "Shop PC" }),
		]);
		expect(pairing.forget("desk-1")).toBe(true);
		expect(pairing.verify("desk-1", key)).toBe(false);
		expect(pairing.forget("desk-1")).toBe(false);
	});

	it("rate limits claim attempts per address", () => {
		const now = 5_000;
		for (let i = 0; i < 10; i++) {
			expect(pairing.recordClaimAttempt("10.0.0.5", now)).toBe(true);
		}
		expect(pairing.recordClaimAttempt("10.0.0.5", now)).toBe(false);
		expect(pairing.recordClaimAttempt("10.0.0.6", now)).toBe(true);
		expect(pairing.recordClaimAttempt("10.0.0.5", now + 60_000)).toBe(true);
	});
});
