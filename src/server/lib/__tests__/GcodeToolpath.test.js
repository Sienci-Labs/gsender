import GcodeToolpath from "../GcodeToolpath";

describe("GcodeToolpath - M6 vs bare T tracking", () => {
	it("does not report hasSeenM6 when only a bare T word is parsed", () => {
		const toolpath = new GcodeToolpath();
		toolpath.loadFromStringSync("T1\nG0 X1");

		expect(toolpath.getModal().tool).toBe(1);
		expect(toolpath.hasSeenM6()).toBe(false);
	});

	it("reports hasSeenM6 when M6 T<n> is parsed", () => {
		const toolpath = new GcodeToolpath();
		toolpath.loadFromStringSync("M6 T1\nG0 X1");

		expect(toolpath.getModal().tool).toBe(1);
		expect(toolpath.hasSeenM6()).toBe(true);
	});

	it("reports hasSeenM6 when a bare M6 (no T word) is parsed after an earlier T", () => {
		const toolpath = new GcodeToolpath();
		toolpath.loadFromStringSync("T1\nM6\nG0 X1");

		expect(toolpath.hasSeenM6()).toBe(true);
	});
});

describe('GcodeToolpath - WCS tracking', () => {
    it.each(['G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'G59.1', 'G59.2', 'G59.3'])(
        'tracks %s as the active WCS',
        (wcs) => {
            const toolpath = new GcodeToolpath();
            toolpath.loadFromStringSync(`${wcs}\nG1 X1 F100`);

            expect(toolpath.getModal().wcs).toBe(wcs);
        },
    );

    it('switches back to G54 after G59.1', () => {
        const toolpath = new GcodeToolpath();
        toolpath.loadFromStringSync('G59.1\nG1 X1 F100\nG54\nG1 X2');

        expect(toolpath.getModal().wcs).toBe('G54');
    });
});
