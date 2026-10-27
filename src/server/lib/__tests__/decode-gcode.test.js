import decodeGcode from "../decode-gcode";

describe("decodeGcode", () => {
	it("decodes UTF-8 comments such as a degree sign", () => {
		const buffer = Buffer.from("T1 M6 (60° V-bit - 6.35mm)\n", "utf8");
		expect(decodeGcode(buffer)).toBe("T1 M6 (60° V-bit - 6.35mm)\n");
	});

	it("falls back to latin1 for legacy single-byte files", () => {
		const buffer = Buffer.from([0x28, 0x36, 0x30, 0xb0, 0x29]);
		expect(decodeGcode(buffer)).toBe("(60°)");
	});
});
