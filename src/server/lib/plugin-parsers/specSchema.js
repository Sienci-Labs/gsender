/**
 * Validation and compilation of plugin-supplied parser specs.
 *
 * A spec is plain JSON — it arrives identically from a plugin manifest, from a
 * runtime SDK call, or over the socket. Matchers are always serialized regex
 * ({ source, flags }), never functions, because they have to survive
 * postMessage and run on the server.
 *
 * Nothing here throws. Every rejection comes back as a string in `errors` so a
 * single bad parser can never take down a plugin, a manifest read, or the
 * serial read path.
 */

import { STATEFUL_FLAGS, assessRegexRisk } from "./regexSafety.js";

export const MAX_PARSERS_PER_PLUGIN = 16;

const ID_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

const MODES = new Set(["line", "block"]);
const UNTIL_KINDS = new Set(["ok", "error", "ok-or-error"]);
const WORKFLOW_GATES = new Set(["any", "idle"]);

// grblHAL pushes a status report every 250ms, so one lands in the middle of
// essentially every multi-line response. Blocks drop them by default.
export const STATUS_REPORT_PATTERN = /^<[^>]*>$/;

const DEFAULTS = {
	mode: "line",
	maxLines: 64,
	timeout: 2000,
	strict: false,
	// Opt-in on purpose. For the commonest block shape — a `$$` dump, where
	// `begin` is /^\$\d+=/ — the begin pattern matches every line in the block,
	// so defaulting this on would restart the block on each line and never
	// accumulate anything. Only blocks with a distinct header line (a
	// [TOOLTABLE:START] and such) want it.
	restartOnBegin: false,
	emitPartial: true,
	ignoreStatusReports: true,
	whenWorkflow: "any",
};

const LIMITS = {
	maxLines: { min: 1, max: 500 },
	timeout: { min: 100, max: 30_000 },
};

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value));

const isPlainObject = (value) =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Accepts { source, flags }, or a bare string treated as the source.
 * @returns {{ regex: RegExp|null, error: string|null, warning: string|null }}
 */
const compileRegex = (raw, field) => {
	if (raw === undefined || raw === null) {
		return { regex: null, error: null, warning: null };
	}

	const source = typeof raw === "string" ? raw : raw?.source;
	const rawFlags = typeof raw === "string" ? "" : (raw?.flags ?? "");

	if (typeof source !== "string") {
		return {
			regex: null,
			error: `"${field}" must be a string or { source, flags }`,
			warning: null,
		};
	}
	if (typeof rawFlags !== "string") {
		return { regex: null, error: `"${field}.flags" must be a string`, warning: null };
	}

	// `g` and `y` carry a lastIndex between .test() calls, which makes a parser
	// match every other line. That is effectively undebuggable for a plugin
	// author, so strip them and say so rather than honouring them.
	const flags = rawFlags.replace(STATEFUL_FLAGS, "");
	const warning =
		flags === rawFlags
			? null
			: `"${field}" — the g/y flags were ignored; they are stateful across lines`;

	const risk = assessRegexRisk(source, flags);
	if (!risk.ok) {
		return { regex: null, error: `"${field}" rejected: ${risk.reason}`, warning };
	}

	try {
		return { regex: new RegExp(source, flags), error: null, warning };
	} catch (err) {
		return { regex: null, error: `"${field}" invalid: ${err.message}`, warning };
	}
};

const readEnum = (value, allowed, field, fallback, errors) => {
	if (value === undefined) {
		return fallback;
	}
	if (!allowed.has(value)) {
		errors.push(`"${field}" must be one of: ${[...allowed].join(", ")}`);
		return fallback;
	}
	return value;
};

const readBool = (value, fallback) =>
	typeof value === "boolean" ? value : fallback;

const readNumber = (value, limits, fallback) =>
	typeof value === "number" && Number.isFinite(value)
		? clamp(value, limits)
		: fallback;

/**
 * @param {object} raw The spec as authored.
 * @param {{ pluginId: string, ownerId: string, origin: 'manifest'|'runtime' }} ctx
 * @returns {{ parser: object|null, errors: string[], warnings: string[] }}
 */
export const compileParserSpec = (raw, ctx) => {
	const errors = [];
	const warnings = [];

	if (!isPlainObject(raw)) {
		return { parser: null, errors: ["parser spec must be an object"], warnings };
	}

	const parserId = raw.id;
	if (typeof parserId !== "string" || !ID_PATTERN.test(parserId)) {
		return {
			parser: null,
			errors: [
				`"id" must match ${ID_PATTERN} (got ${JSON.stringify(parserId)})`,
			],
			warnings,
		};
	}

	const mode = readEnum(raw.mode, MODES, "mode", DEFAULTS.mode, errors);
	const whenWorkflow = readEnum(
		raw.whenWorkflow,
		WORKFLOW_GATES,
		"whenWorkflow",
		DEFAULTS.whenWorkflow,
		errors,
	);

	let untilKind = null;
	if (raw.until !== undefined) {
		if (!UNTIL_KINDS.has(raw.until)) {
			errors.push(`"until" must be one of: ${[...UNTIL_KINDS].join(", ")}`);
		} else {
			untilKind = raw.until;
		}
	}

	const compiled = {};
	for (const field of ["match", "begin", "end", "ignore"]) {
		const { regex, error, warning } = compileRegex(raw[field], field);
		if (error) {
			errors.push(error);
		}
		if (warning) {
			warnings.push(warning);
		}
		compiled[field] = regex;
	}

	// Only complain that a pattern is missing when it was genuinely absent. If it
	// was supplied but rejected, compileRegex has already said why, and adding
	// "needs a match" on top just buries the real reason.
	const wasSupplied = (field) => raw[field] !== undefined && raw[field] !== null;

	if (mode === "line" && !compiled.match && !wasSupplied("match")) {
		errors.push('a "line" parser needs a "match" pattern');
	}
	if (mode === "block") {
		if (!compiled.begin && !wasSupplied("begin")) {
			errors.push('a "block" parser needs a "begin" pattern');
		}
		if (!compiled.end && !untilKind && !wasSupplied("end")) {
			errors.push('a "block" parser needs either an "end" pattern or "until"');
		}
	}

	// `ok` is emitted once per accepted line, so while a job is streaming the ok
	// stream belongs to the sender, not to this parser. Sound only at idle.
	if (untilKind && whenWorkflow !== "idle") {
		warnings.push(
			`"until: ${untilKind}" can terminate early while a job is running — ` +
				'prefer an explicit "end" pattern, or set "whenWorkflow": "idle"',
		);
	}

	if (errors.length > 0) {
		return { parser: null, errors, warnings };
	}

	return {
		parser: {
			pluginId: ctx.pluginId,
			parserId,
			ownerId: ctx.ownerId,
			origin: ctx.origin,
			mode,
			match: compiled.match,
			begin: compiled.begin,
			end: compiled.end,
			ignore: compiled.ignore,
			untilKind,
			whenWorkflow,
			label: typeof raw.label === "string" ? raw.label : parserId,
			maxLines: readNumber(raw.maxLines, LIMITS.maxLines, DEFAULTS.maxLines),
			timeoutMs: readNumber(raw.timeout, LIMITS.timeout, DEFAULTS.timeout),
			strict: readBool(raw.strict, DEFAULTS.strict),
			restartOnBegin: readBool(raw.restartOnBegin, DEFAULTS.restartOnBegin),
			emitPartial: readBool(raw.emitPartial, DEFAULTS.emitPartial),
			ignoreStatusReports: readBool(
				raw.ignoreStatusReports,
				DEFAULTS.ignoreStatusReports,
			),

			// Mutable runtime health, owned by PluginParserChain.
			block: null,
			quarantined: false,
			slowHits: 0,
			emitWindowStart: 0,
			emitCount: 0,
			seq: 0,
		},
		errors,
		warnings,
	};
};

/**
 * Compiles a list of specs for one plugin, enforcing the per-plugin cap and
 * rejecting duplicate ids.
 *
 * @returns {{ parsers: object[], errors: {id: string, error: string}[], warnings: {id: string, warning: string}[] }}
 */
export const validateParserSpecs = (specs, ctx) => {
	const parsers = [];
	const errors = [];
	const warnings = [];

	if (specs === undefined || specs === null) {
		return { parsers, errors, warnings };
	}
	if (!Array.isArray(specs)) {
		return {
			parsers,
			errors: [{ id: "*", error: '"parsers" must be an array' }],
			warnings,
		};
	}

	const seen = new Set();

	specs.forEach((spec, index) => {
		const label = isPlainObject(spec) && spec.id ? String(spec.id) : `#${index}`;

		if (parsers.length >= MAX_PARSERS_PER_PLUGIN) {
			errors.push({
				id: label,
				error: `exceeds the limit of ${MAX_PARSERS_PER_PLUGIN} parsers per plugin`,
			});
			return;
		}

		const { parser, errors: specErrors, warnings: specWarnings } =
			compileParserSpec(spec, ctx);

		specWarnings.forEach((warning) => warnings.push({ id: label, warning }));

		if (!parser) {
			specErrors.forEach((error) => errors.push({ id: label, error }));
			return;
		}

		if (seen.has(parser.parserId)) {
			errors.push({ id: label, error: "duplicate parser id" });
			return;
		}

		seen.add(parser.parserId);
		parsers.push(parser);
	});

	return { parsers, errors, warnings };
};
