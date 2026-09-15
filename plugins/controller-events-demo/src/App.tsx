import { gcode, getSelector, machine } from "@sienci/gsender-plugin-sdk";
import { useCallback, useEffect, useState } from "react";

const WATCHED_EVENTS = [
	"job:start",
	"job:stop",
	"workflow:state",
	"serialport:open",
	"serialport:close",
	"file:load",
] as const;

const MAX_LOG_ENTRIES = 50;

// a handful of harmless jogs so "Load sample" has something to run against
// without needing a real job queued up on the carve page
const SAMPLE_GCODE = [
	"G21",
	"G91",
	"G0 X5 F500",
	"G0 Y5",
	"G0 X-5",
	"G0 Y-5",
].join("\n");

type LogEntry = {
	id: number;
	timestamp: string;
	name: string;
	args: unknown[];
};

let nextId = 0;

const formatArgs = (args: unknown[]): string => {
	if (args.length === 0) {
		return "";
	}
	try {
		return JSON.stringify(args);
	} catch {
		return String(args);
	}
};

const App = () => {
	const [entries, setEntries] = useState<LogEntry[]>([]);
	const [connected, setConnected] = useState(false);
	const [busy, setBusy] = useState(false);

	const logEvent = useCallback((name: string, args: unknown[]) => {
		setEntries((prev) =>
			[
				{
					id: nextId++,
					timestamp: new Date().toLocaleTimeString(),
					name,
					args,
				},
				...prev,
			].slice(0, MAX_LOG_ENTRIES),
		);
	}, []);

	// seed the initial value from redux in case the machine was already connected before this plugin mounted
	useEffect(() => {
		let cancelled = false;
		getSelector<boolean>(
			(state) =>
				(state as { connection?: { isConnected?: boolean } })?.connection
					?.isConnected ?? false,
		).then((isConnected) => {
			if (!cancelled) {
				setConnected(isConnected);
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const unsubscribers = WATCHED_EVENTS.map((name) =>
			machine.addListener(name, (...args: unknown[]) => {
				if (name === "serialport:open") {
					setConnected(true);
				} else if (name === "serialport:close") {
					setConnected(false);
				}
				logEvent(name, args);
			}),
		);

		return () => {
			for (const unsubscribe of unsubscribers) {
				unsubscribe();
			}
		};
	}, [logEvent]);

	const handleLoadSample = async () => {
		setBusy(true);
		try {
			await gcode.loadToVisualizer(
				SAMPLE_GCODE,
				"controller-events-demo.gcode",
			);
		} catch (error) {
			logEvent("error", [error instanceof Error ? error.message : error]);
		} finally {
			setBusy(false);
		}
	};

	const handleStart = async () => {
		setBusy(true);
		try {
			await machine.command("gcode:start");
		} catch (error) {
			logEvent("error", [error instanceof Error ? error.message : error]);
		} finally {
			setBusy(false);
		}
	};

	const handleStop = async () => {
		setBusy(true);
		try {
			await machine.command("gcode:stop", { force: true });
		} catch (error) {
			logEvent("error", [error instanceof Error ? error.message : error]);
		} finally {
			setBusy(false);
		}
	};

	return (
		<main className="app">
			<header>
				<h1>Controller Events Demo</h1>
				<p className="lede">
					<code>machine.addListener(name, callback)</code> mirrors gSender's own{" "}
					<code>controller.addListener</code>
				</p>
			</header>

			<section className="card">
				<h2>Watching</h2>
				<p className="hint">This demo only listens for a handful of events.</p>
				<ul className="watched">
					{WATCHED_EVENTS.map((name) => (
						<li key={name}>
							<code>{name}</code>
						</li>
					))}
				</ul>
			</section>

			<section className="card">
				<h2>Job controls</h2>
				<p className="hint">
					Trigger a job without leaving this page, so <code>job:start</code>/
					<code>job:stop</code> show up below. Loading the sample will replace
					anything currently loaded in the visualizer.
				</p>
				<div className="actions">
					<button
						type="button"
						className="secondary"
						onClick={handleLoadSample}
						disabled={!connected || busy}
					>
						Load sample
					</button>
					<button
						type="button"
						onClick={handleStart}
						disabled={!connected || busy}
					>
						Start
					</button>
					<button
						type="button"
						className="secondary"
						onClick={handleStop}
						disabled={!connected || busy}
					>
						Stop
					</button>
				</div>
				{!connected && (
					<p className="hint">Connect to a machine to enable these buttons.</p>
				)}
			</section>

			<section className="card">
				<h2>Event log</h2>
				{entries.length === 0 ? (
					<p className="hint">Waiting for one of the events above to fire…</p>
				) : (
					<ul className="log">
						{entries.map((entry) => (
							<li key={entry.id}>
								<span className="log-time">{entry.timestamp}</span>
								<span className="log-name">{entry.name}</span>
								{entry.args.length > 0 && (
									<span className="log-args">{formatArgs(entry.args)}</span>
								)}
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
};

export default App;
