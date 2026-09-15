class GrblHalLineParserResultAXS {
	static parse(line) {
		// [AXS:3:XYZ]  - count and axis letters (normal)
		// [AXS:4]      - count only, no letters (some builds)
		const r = line.match(/^\[(?:AXS:)([^\]]*)\]$/);
		if (!r) {
			return null;
		}

		const axisInformation = r[1].split(":");

		const axisCount = Number.parseInt(axisInformation[0], 10);
		// Letters are the authoritative source. grblHAL can be built with
		// arbitrary axis letters and ordering, so when the count and the letters
		// disagree we trust the letters and ignore the count.
		const axes = (axisInformation[1] || "")
			.split("")
			.filter((letter) => /[A-Za-z]/.test(letter))
			.map((letter) => letter.toUpperCase());

		// Nothing usable in the line - fall through to the other parsers rather
		// than reporting a malformed AXS result.
		if (axes.length === 0 && !Number.isFinite(axisCount)) {
			return null;
		}

		const payload = {
			count: axes.length > 0 ? axes.length : axisCount,
			axes: axes,
		};

		return {
			type: GrblHalLineParserResultAXS,
			payload,
		};
	}
}

export default GrblHalLineParserResultAXS;
