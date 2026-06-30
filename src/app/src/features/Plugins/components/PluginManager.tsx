import { Button } from "app/components/Button";

import Page from "app/components/Page";
import { useState } from "react";
import { usePlugins } from "../hooks/usePlugins";

const PluginManager = () => {
	const { plugins, pluginsDir, loading, error, refresh, setEnabled } =
		usePlugins();
	const [restartRequired, setRestartRequired] = useState(false);

	const handleToggle = async (id: string, enabled: boolean) => {
		const result = await setEnabled(id, enabled);
		if (result?.restartRequired) {
			setRestartRequired(true);
		}
	};

	return (
		<Page
			title="Plugins"
			description="Manage UI plugins installed on this machine"
			withGoBackButton
			withFullPadding
		>
			<div className="flex flex-col gap-4 max-w-3xl">
				<p className="text-sm text-gray-600 dark:text-gray-300">
					Plugins directory:{" "}
					<code className="text-xs break-all">{pluginsDir}</code>
				</p>

				<p className="text-sm text-gray-500 dark:text-gray-400">
					Each plugin is a folder containing{" "}
					<code className="text-xs">gsender-plugin.json</code> and a{" "}
					<code className="text-xs">ui/</code> build output. After installing or
					enabling a plugin, restart gSender for mount routes to apply.
				</p>

				{restartRequired && (
					<div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
						Restart gSender to apply plugin changes. Mount routes are registered
						when the server starts.
					</div>
				)}

				<div className="flex gap-2">
					<Button onClick={refresh} disabled={loading}>
						Refresh
					</Button>
				</div>

				{error && (
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				)}

				{loading && <p className="text-sm text-gray-500">Loading plugins...</p>}

				{!loading && plugins.length === 0 && (
					<p className="text-sm text-gray-500">No plugins installed.</p>
				)}

				<ul className="flex flex-col gap-3">
					{plugins.map((plugin) => (
						<li
							key={plugin.id}
							className="border border-gray-200 dark:border-dark-lighter rounded-md p-4"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="font-semibold dark:text-white">{plugin.name}</p>
									<p className="text-xs text-gray-500">
										{plugin.id} · v{plugin.version}
									</p>
									{!plugin.valid && (
										<ul className="mt-2 text-xs text-red-600 list-disc pl-4">
											{plugin.errors.map((err) => (
												<li key={err}>{err}</li>
											))}
										</ul>
									)}
									{plugin.contributions.length > 0 && (
										<p className="mt-2 text-xs text-gray-500">
											Slots:{" "}
											{plugin.contributions.map((c) => c.slot).join(", ")}
										</p>
									)}
								</div>
								<Button
									onClick={() => handleToggle(plugin.id, !plugin.enabled)}
									disabled={!plugin.valid}
									variant={plugin.enabled ? "outline" : "primary"}
								>
									{plugin.enabled ? "Disable" : "Enable"}
								</Button>
							</div>
						</li>
					))}
				</ul>
			</div>
		</Page>
	);
};

export default PluginManager;
