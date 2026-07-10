import { Button } from "app/components/Button";
import Page from "app/components/Page";
import Switch from "app/components/Switch";
import { Tooltip } from "app/components/Tooltip"; // Ensure Tooltip exists
import isElectron from "is-electron";
import { useState } from "react";
import { usePlugins } from "../hooks/usePlugins";

const PluginManager = () => {
	const {
		plugins,
		pluginsDir,
		loading,
		error,
		refresh,
		setEnabled,
		openPluginsDir,
	} = usePlugins();
	const [restartRequired, setRestartRequired] = useState(false);

	const handleToggle = async (id: string, enabled: boolean) => {
		const result = await setEnabled(id, enabled);
		if (result?.restartRequired) {
			setRestartRequired(true);
		}
	};

	// The plugins folder lives on the machine running the gSender server. Opening
	// it in a file manager only makes sense from the local desktop app — when the
	// UI is loaded remotely in a web browser there is no local folder to reveal.
	const canOpenDir = isElectron();

	const handleOpenDir = async () => {
		try {
			await openPluginsDir();
		} catch {
			// Opening the folder is best-effort; ignore failures silently.
		}
	};

	return (
		<Page
			title="Plugins"
			description="Manage UI plugins installed on this machine"
			withGoBackButton
			withFullPadding
		>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-gray-600 dark:text-gray-300">
					Plugins directory:{" "}
					{canOpenDir ? (
						<Tooltip content="Open this folder in your file manager">
							<button
								type="button"
								onClick={handleOpenDir}
								disabled={!pluginsDir}
								className="text-xs break-all font-mono text-blue-600 underline underline-offset-2 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline dark:text-blue-400 dark:hover:text-blue-300"
							>
								{pluginsDir}
							</button>
						</Tooltip>
					) : (
						<code className="text-xs break-all">{pluginsDir}</code>
					)}
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
					<Button onClick={() => {}}>
						Import Plugin
					</Button>
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

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					{plugins.map((plugin) => (
						<div
							key={plugin.id}
							className="border border-gray-200 dark:border-dark-lighter rounded-md p-4 flex flex-col h-full"
						>
							<div className="flex-1">
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
							<div className="mt-4 flex justify-end">
								<Tooltip
									content={
										plugin.enabled
											? "Disable this plugin"
											: "Enable this plugin"
									}
								>
									<div>
										<Switch
											checked={plugin.enabled}
											onChange={(checked, e) =>
												handleToggle(plugin.id, checked)
											}
											disabled={!plugin.valid}
											label={plugin.enabled ? "Enabled" : "Disabled"}
											onColor="#22c55e" // Tailwind green-500
										/>
									</div>
								</Tooltip>
							</div>
						</div>
					))}
				</div>
			</div>
		</Page>
	);
};

export default PluginManager;
