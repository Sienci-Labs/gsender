import { machine, onParserError } from "@sienci/gsender-plugin-sdk";

const $ = (id) => document.getElementById(id);

const render = (el, value) => {
	el.textContent =
		value === undefined
			? "— nothing yet —"
			: typeof value === "string"
				? value
				: JSON.stringify(value, null, 2);
};

const stamp = () => new Date().toLocaleTimeString();

// Preset buttons fill whichever input they belong to. Each of these provokes
// something the parsers below are watching for.
const PRESETS = ["$$", "$I", "$#", "$G", "$ES"];

const addPresets = (containerId, inputId) => {
	const container = $(containerId);
	for (const preset of PRESETS) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "preset";
		button.textContent = preset;
		button.addEventListener("click", () => {
			$(inputId).value = preset;
		});
		container.appendChild(button);
	}
};

addPresets("send-presets", "send-cmd");
addPresets("query-presets", "query-cmd");

// --- Manifest-declared parsers ------------------------------------------------
// These two are declared in gsender-plugin.json, NOT registered here. That means
// they are live from the moment the port opens, whether or not this view has
// ever been mounted — so results are already waiting when you arrive. onParsed
// fires immediately with the last result if one exists.

// `$#` (view parameters) also emits a `[PRB:...]` line as part of its own
// dump, alongside G54/G55/etc — it isn't only sent right after a real probe
// cycle. So this panel updates on `$#` too, and the trailing flag reflects
// the *last recorded* probe outcome (did the probe switch trigger?), not
// whether whatever command was just sent succeeded.
machine.onParsed("probe", (result) => {
	const { x, y, z, rest, success } = result.groups;
	// `rest` holds any axes past Z — grblHAL reports up to six (A/B/C), so the
	// pattern has to tolerate them or a rotary machine never matches at all.
	const extraAxes = rest ? rest.split(",").filter(Boolean) : [];

	render($("probe-out"), {
		position: { x, y, z },
		...(extraAxes.length ? { extraAxes } : {}),
		lastProbeTriggered: success === "1",
		at: new Date(result.endedAt).toLocaleTimeString(),
	});
});

machine.onParsed("settings", (result) => {
	const settings = Object.fromEntries(
		result.entries.map((entry) => [`$${entry.groups.key}`, entry.groups.value]),
	);
	render($("settings-out"), {
		complete: result.complete,
		reason: result.reason,
		count: result.entries.length,
		settings,
	});
});

// --- machine.command: fire and forget ------------------------------------------
// Resolves once the command has been DELIVERED to the controller, not when the
// machine has finished responding. The response shows up in the parser sections
// above, not as a return value — that is the whole point of the demo.

$("send-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	const cmd = $("send-cmd").value.trim();
	if (!cmd) {
		return;
	}

	const button = $("send-btn");
	button.disabled = true;
	render($("send-out"), `sending ${cmd}…`);
	try {
		await machine.command("gcode", cmd);
		render(
			$("send-out"),
			`${stamp()}  delivered: ${cmd}\n(watch the parser sections above for the response)`,
		);
	} catch (err) {
		render($("send-out"), `${stamp()}  failed: ${err.message}`);
	} finally {
		button.disabled = false;
	}
});

// --- machine.query: a command and everything it sends back ---------------------

const readUntil = () => {
	const choice = document.querySelector('input[name="until"]:checked').value;
	if (choice !== "custom") {
		return choice;
	}
	const source = $("query-until-custom").value.trim();
	if (!source) {
		return "ok-or-error";
	}
	// A real RegExp: exercises the SDK's toRegexSpec normalisation and the
	// server's object-`until` branch, rather than the string shorthand.
	return new RegExp(source);
};

$("query-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	const cmd = $("query-cmd").value.trim();
	if (!cmd) {
		return;
	}

	const button = $("query-btn");
	button.disabled = true;
	render($("query-out"), `running ${cmd}…`);

	const started = performance.now();
	try {
		const result = await machine.query(cmd, {
			until: readUntil(),
			timeout: Number($("query-timeout").value) || 5000,
			includeStatusReports: $("query-status").checked,
		});
		render($("query-out"), result);
	} catch (err) {
		render($("query-out"), {
			error: err.message,
			// Distinguishes "rejected up front" (busy, closed port) from
			// "waited and gave up".
			elapsedMs: Math.round(performance.now() - started),
		});
	} finally {
		button.disabled = false;
	}
});

// --- onLine: a quick ad-hoc tap ------------------------------------------------
// Sugar over an anonymous runtime parser. Runtime registrations live only as
// long as this view, unlike the manifest parsers above.

const messages = [];
machine.onLine(/^\[MSG:/i, (result) => {
	messages.unshift(
		`${new Date(result.endedAt).toLocaleTimeString()}  ${result.line}`,
	);
	messages.length = Math.min(messages.length, 10);
	$("messages-out").textContent = messages.join("\n") || "— nothing yet —";
});

// --- Runtime registration from user input --------------------------------------

$("custom-form").addEventListener("submit", async (event) => {
	event.preventDefault();
	const pattern = $("custom-pattern").value.trim();
	if (!pattern) {
		return;
	}

	try {
		await machine.unregisterParser("custom");
	} catch {
		// Nothing registered yet — fine.
	}

	try {
		const result = await machine.registerParser({
			id: "custom",
			mode: "line",
			match: pattern,
		});
		if (result.errors?.length) {
			render($("custom-out"), { rejected: result.errors });
			return;
		}
		render($("custom-out"), "watching…");
	} catch (err) {
		render($("custom-out"), { error: err.message });
	}
});

machine.onParsed("custom", (result) => {
	render($("custom-out"), {
		line: result.line,
		groups: result.groups,
		captures: result.captures,
	});
});

// Rejected, rate-limited, and quarantined parsers report here rather than
// failing silently.
onParserError((error) => {
	$("errors-out").textContent =
		`${stamp()}  ${error.parserId}: ${error.reason} — ${error.message}`;
});
