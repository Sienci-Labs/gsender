/**
 * Heuristic screen for regex patterns supplied by plugins.
 *
 * THIS IS A HEURISTIC, NOT A PROOF. It rejects the shapes that cause
 * catastrophic backtracking in practice; it does not decide the general case,
 * and a determined author can get a slow pattern past it.
 *
 * The screen is the first of three layers, and not the strongest one:
 *
 *   1. MAX_REGEX_SOURCE below — by far the most effective single control.
 *   2. Serial lines are short (well under 200 chars), which bounds the input
 *      that any pattern can blow up on.
 *   3. The per-parser time budget and quarantine in PluginParserChain, which
 *      catches whatever gets through.
 *
 * Layer 3 can only ever detect a slow match AFTER it has run: JS regex
 * execution is not interruptible, so there is no way to time one out mid-match
 * on this thread. That is why layers 1 and 2 matter more than this file does.
 *
 * If this ever needs to be airtight, the answer is to move matching off-thread
 * (worker) or onto a non-backtracking engine (node-re2) — NOT a cleverer
 * heuristic here.
 */

export const MAX_REGEX_SOURCE = 512;

// Flags whose behaviour depends on where the last match ended. A shared
// lastIndex across .test() calls makes a parser match every other line, which
// is effectively undebuggable for a plugin author, so callers strip these.
export const STATEFUL_FLAGS = /[gy]/g;
const ALLOWED_FLAGS = /^[imsu]*$/;

const UNBOUNDED_QUANTIFIERS = new Set(["*", "+"]);

const isUnbounded = (source, i) => {
	const ch = source[i];
	if (UNBOUNDED_QUANTIFIERS.has(ch)) {
		return true;
	}
	// {n,} — open-ended repetition is unbounded too.
	if (ch === "{") {
		const close = source.indexOf("}", i);
		if (close === -1) {
			return false;
		}
		const body = source.slice(i + 1, close);
		return /^\d+,\s*$/.test(body);
	}
	return false;
};

// Skips one atom starting at `i`, returning the index just past it. An atom is
// an escape, a character class, a group, or a single literal character.
const skipAtom = (source, i) => {
	const ch = source[i];

	if (ch === "\\") {
		return i + 2;
	}

	if (ch === "[") {
		let j = i + 1;
		while (j < source.length && source[j] !== "]") {
			j += source[j] === "\\" ? 2 : 1;
		}
		return j + 1;
	}

	if (ch === "(") {
		let depth = 0;
		let j = i;
		while (j < source.length) {
			const c = source[j];
			if (c === "\\") {
				j += 2;
				continue;
			}
			if (c === "(") {
				depth += 1;
			} else if (c === ")") {
				depth -= 1;
				if (depth === 0) {
					return j + 1;
				}
			}
			j += 1;
		}
		return source.length;
	}

	return i + 1;
};

// Strips a leading group prefix — (?: (?= (?! (?<name> etc. — so we can look at
// the group's actual first atom.
const stripGroupPrefix = (body) =>
	body.replace(/^\?(?::|=|!|<=|<!|<[A-Za-z_$][\w$]*>)/, "");

/**
 * Star height >= 2: an unbounded-quantified group whose body ALSO begins with an
 * unbounded quantifier — (a+)+, ([a-z]+)*, (.*)* , (\s*\w+)+ .
 *
 * The "begins with" part is what keeps this from over-rejecting. A group like
 * (\(.*\))* is nested too, but each iteration must start with a literal "(", so
 * consecutive iterations cannot claim the same text and the ambiguity
 * collapses. Only when the FIRST atom is itself unbounded can the engine split
 * one run of input between iterations in exponentially many ways.
 */
const hasNestedUnboundedQuantifier = (source) => {
	let i = 0;

	while (i < source.length) {
		const ch = source[i];

		if (ch === "\\") {
			i += 2;
			continue;
		}

		if (ch === "[") {
			i = skipAtom(source, i);
			continue;
		}

		if (ch !== "(") {
			i += 1;
			continue;
		}

		const end = skipAtom(source, i); // index just past ")"
		const isQuantified = isUnbounded(source, end);

		if (isQuantified) {
			const body = stripGroupPrefix(source.slice(i + 1, end - 1));
			if (body.length > 0) {
				const firstAtomEnd = skipAtom(body, 0);
				if (isUnbounded(body, firstAtomEnd)) {
					return true;
				}
			}
		}

		// Recurse into the group regardless — the risky pair may be nested deeper.
		i += 1;
	}

	return false;
};

// (a|a)* — alternation branches that can match the same first character, under
// an unbounded quantifier, give the engine exponentially many parses.
const hasQuantifiedOverlappingAlternation = (source) => {
	let i = 0;
	while (i < source.length) {
		if (source[i] === "\\") {
			i += 2;
			continue;
		}
		if (source[i] !== "(") {
			i += 1;
			continue;
		}

		// Find this group's matching close paren.
		let depth = 0;
		let j = i;
		while (j < source.length) {
			const ch = source[j];
			if (ch === "\\") {
				j += 2;
				continue;
			}
			if (ch === "(") {
				depth += 1;
			} else if (ch === ")") {
				depth -= 1;
				if (depth === 0) {
					break;
				}
			}
			j += 1;
		}

		if (j < source.length && isUnbounded(source, j + 1)) {
			const body = source.slice(i + 1, j).replace(/^\?[:=!<][a-zA-Z]*>?/, "");
			if (body.includes("|")) {
				const branches = body.split("|");
				const firsts = branches.map((b) =>
					b.startsWith("\\") ? b.slice(0, 2) : b.slice(0, 1),
				);
				const seen = new Set();
				for (const first of firsts) {
					if (first && seen.has(first)) {
						return true;
					}
					seen.add(first);
				}
			}
		}

		i += 1;
	}

	return false;
};

const hasHugeBoundedRepetition = (source) => {
	const matches = source.matchAll(/\{(\d+)(?:,(\d+))?\}/g);
	for (const m of matches) {
		const upper = m[2] !== undefined ? Number(m[2]) : Number(m[1]);
		if (upper > 1000) {
			return true;
		}
	}
	return false;
};

/**
 * @param {string} source Regex source, without delimiters.
 * @param {string} [flags]
 * @returns {{ ok: boolean, reason?: string }}
 */
export const assessRegexRisk = (source, flags = "") => {
	if (typeof source !== "string" || source.length === 0) {
		return { ok: false, reason: "pattern is empty" };
	}

	if (source.length > MAX_REGEX_SOURCE) {
		return {
			ok: false,
			reason: `pattern is longer than ${MAX_REGEX_SOURCE} characters`,
		};
	}

	if (!ALLOWED_FLAGS.test(flags.replace(STATEFUL_FLAGS, ""))) {
		return { ok: false, reason: `unsupported regex flags "${flags}"` };
	}

	if (hasNestedUnboundedQuantifier(source)) {
		return {
			ok: false,
			reason:
				"nested unbounded quantifier (e.g. (a+)+) — this backtracks catastrophically",
		};
	}

	// NOTE: adjacent unbounded quantifiers over overlapping classes (\s*\w+,
	// \s*(.+)) are deliberately NOT rejected. They are only quadratic, not
	// exponential, and on a serial line of a couple hundred characters that is a
	// few tens of thousands of steps — far below the time budget. Rejecting them
	// threw out five of grblHAL's own shipping parser patterns.

	if (hasQuantifiedOverlappingAlternation(source)) {
		return {
			ok: false,
			reason:
				"quantified alternation with overlapping branches (e.g. (a|a)*)",
		};
	}

	if (hasHugeBoundedRepetition(source)) {
		return { ok: false, reason: "repetition count above 1000" };
	}

	try {
		// eslint-disable-next-line no-new
		new RegExp(source, flags.replace(STATEFUL_FLAGS, ""));
	} catch (err) {
		return { ok: false, reason: `invalid regex: ${err.message}` };
	}

	return { ok: true };
};
