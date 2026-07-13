import { gsender } from "@sienci/gsender-plugin-sdk";
import {
	useTypedSelector,
	useWorkspaceState,
} from "@sienci/gsender-plugin-sdk/react";
import { useState } from "react";

type WorkspaceState = {
	units?: string;
	[key: string]: unknown;
};

type RootState = {
	connection?: {
		isConnected?: boolean;
	};
};

const App = () => {
	const workspace = useWorkspaceState<WorkspaceState>();
	const isConnected = useTypedSelector<boolean, RootState>(
		(state) => state.connection?.isConnected ?? false,
	);

	const [contextJson, setContextJson] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchContext = async () => {
		setLoading(true);
		try {
			const ctx = await gsender.machine.getContext();
			setContextJson(JSON.stringify(ctx, null, 2));
		} catch (err) {
			setContextJson(
				`Error: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="app">
			<header>
				<h1>React SDK Demo</h1>
				<p className="lede">
					React + TypeScript plugin using{" "}
					<code>@sienci/gsender-plugin-sdk/react</code> hooks.
				</p>
			</header>

			<section className="card">
				<h2>Live workspace</h2>
				<p className="hint">
					<code>useWorkspaceState()</code> — re-renders when workspace changes
				</p>
				<dl className="stats">
					<div>
						<dt>Units</dt>
						<dd>{workspace?.units ?? "—"}</dd>
					</div>
				</dl>
			</section>

			<section className="card">
				<h2>Redux selector</h2>
				<p className="hint">
					<code>useTypedSelector()</code> — subscribe to a redux slice
				</p>
				<dl className="stats">
					<div>
						<dt>Connected</dt>
						<dd className={isConnected ? "connected" : "disconnected"}>
							{isConnected === undefined ? "—" : isConnected ? "Yes" : "No"}
						</dd>
					</div>
				</dl>
			</section>

			<section className="card">
				<h2>Machine context</h2>
				<p className="hint">
					Imperative <code>gsender.machine.getContext()</code> from a button
					handler
				</p>
				<button type="button" onClick={fetchContext} disabled={loading}>
					{loading ? "Loading…" : "Fetch context"}
				</button>
				{contextJson && <pre className="output">{contextJson}</pre>}
			</section>
		</main>
	);
};

export default App;
