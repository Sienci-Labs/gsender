import { MAX_REGEX_SOURCE, assessRegexRisk } from "../regexSafety.js";

// Every regex gSender's own grbl/grblHAL line parsers actually ship. If the
// screen rejects one of these it is over-rejecting, and plugin authors writing
// perfectly ordinary firmware patterns will hit false positives.
const SHIPPING_GRBL_PATTERNS = [
	String.raw`"\$-Code"`,
	String.raw`(\d*)\t(.*)`,
	String.raw`\[(MSG:(?:Error: )?ATCI):?(\d*)?\|(.*)]$`,
	String.raw`\[FILE:\/([^|]+)\|SIZE:(\d+)(\|UNUSABLE)?\]`,
	String.raw`\[SPINDLE:(.+?)]`,
	String.raw`\[T:(\d+)\|([-\d.]+(?:,[-\d.]+){2,6})\|([-\d.]+)]`,
	String.raw`^(.+):(.+)`,
	String.raw`^([a-zA-Z]+):?(.*)$`,
	String.raw`^(\$[^=]+)=([^(]*)(\(.*\))*`,
	String.raw`^(\$\d{1,3})=([\d.]+)$`,
	String.raw`^(\d+)( - )(.+?)?$`,
	String.raw`^({.*})$`,
	String.raw`^<(.+)>$`,
	String.raw`^<(Alarm):([0-9]*)\|.*>$`,
	String.raw`^ALARM:\s*(.+)$`,
	String.raw`^\[(?:AXS:)(.+)\]$`,
	String.raw`^\[(?:GC:)?((?:[a-zA-Z][0-9]+(?:\.[0-9]*)?\s*)+)\]$`,
	String.raw`^\[(?:HLP:)(.+)\]$`,
	String.raw`^\[(?:MSG:)?(.+)\]$`,
	String.raw`^\[(?:OPT:)(.+)\]$`,
	String.raw`^\[(?:VER:)(.+)\]$`,
	String.raw`^\[(?:echo:)(.+)\]$`,
	String.raw`^\[([A-Z ]*):(.+)\]$`,
	String.raw`^\[ALARMCODE:(\d+)\|\|(.*)]$`,
	String.raw`^\[ERRORCODE:(\d+)\|\|(.*)]$`,
	String.raw`^\[MSG:Info:\s*Autoconfig:\s*(.+)\]$`,
	String.raw`^\[SETTING:(\d+)(\|)(.+?)(?=])`,
	String.raw`^\[SETTINGGROUP:(\d+)\|(\d+)\|(.*)]$`,
	String.raw`^error:\s*(.+)$`,
	String.raw`^o*k*$`,
	String.raw`^ok$`,
	String.raw`^<[^>]*>$`,
];

describe("assessRegexRisk", () => {
	it.each(SHIPPING_GRBL_PATTERNS)("accepts the shipping pattern %s", (source) => {
		expect(assessRegexRisk(source)).toEqual({ ok: true });
	});

	it.each([
		[String.raw`(a+)+$`, "nested unbounded quantifier"],
		[String.raw`([a-zA-Z]+)*$`, "nested unbounded quantifier"],
		[String.raw`(.*)*x`, "nested unbounded quantifier"],
		[String.raw`(\s*\w+)+`, "nested unbounded quantifier"],
		[String.raw`(?:a*)*b`, "nested unbounded quantifier"],
		[String.raw`(a|a)*$`, "quantified alternation"],
		[String.raw`(ab|ac)+$`, "quantified alternation"],
	])("rejects the catastrophic pattern %s", (source, expected) => {
		const result = assessRegexRisk(source);
		expect(result.ok).toBe(false);
		expect(result.reason).toContain(expected);
	});

	it("rejects a pattern longer than the source cap", () => {
		const result = assessRegexRisk("a".repeat(MAX_REGEX_SOURCE + 1));
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/longer than/);
	});

	it("rejects huge bounded repetition", () => {
		expect(assessRegexRisk("a{5000}").ok).toBe(false);
		expect(assessRegexRisk("a{1,2000}").ok).toBe(false);
		expect(assessRegexRisk("a{1,10}").ok).toBe(true);
	});

	it("rejects an empty or non-string pattern", () => {
		expect(assessRegexRisk("").ok).toBe(false);
		expect(assessRegexRisk(undefined).ok).toBe(false);
	});

	it("rejects a syntactically invalid pattern", () => {
		const result = assessRegexRisk("([unclosed");
		expect(result.ok).toBe(false);
	});

	it("tolerates the stateful flags it expects callers to strip", () => {
		expect(assessRegexRisk("^ok$", "g").ok).toBe(true);
		expect(assessRegexRisk("^ok$", "gi").ok).toBe(true);
	});

	it("rejects unsupported flags", () => {
		expect(assessRegexRisk("^ok$", "x").ok).toBe(false);
	});

	it("allows a nested group whose body starts with a literal delimiter", () => {
		// (\(.*\))* is nested, but each iteration must start with "(" so the
		// iterations cannot claim the same text. This is the false positive that
		// the "first atom" refinement exists to avoid.
		expect(assessRegexRisk(String.raw`(\(.*\))*`).ok).toBe(true);
	});
});
