/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import api from "app/api";
import { Button } from "app/components/Button";
import { Confirm } from "app/components/ConfirmationDialog/ConfirmationDialogLib";
import Page from "app/components/Page";
import Switch from "app/components/Switch";
import { Tooltip } from "app/components/Tooltip"; // Ensure Tooltip exists
import { toast } from "app/lib/toaster";
import isElectron from "is-electron";
import { isEmpty } from "lodash";
import { useEffect, useState } from "react";
import { usePlugins } from "../hooks/usePlugins";
import { SDK_SCAN_SPECIFIERS } from "../types";
import {
	buildGrantFromScan,
	mergeManifestParserGrant,
} from "../utils/capabilities";

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
	const [importData, setImportData] = useState<{
		directory?: string;
	}>({});

	const handleToggle = async (id: string, enabled: boolean) => {
		const result = await setEnabled(id, enabled);
		if (result?.restartRequired) {
			setRestartRequired(true);
		}
	};

	const canOpenDir = isElectron();

	const handleOpenDir = async () => {
		try {
			await openPluginsDir();
		} catch {
			// Opening the folder is best-effort; ignore failures silently.
		}
	};

	const handleImportPlugin = () => {
		if (isElectron()) {
			(window as any).ipcRenderer?.send("open-plugin-import-dialog");
		}
	};

	useEffect(() => {
		if (isElectron()) {
			(window as any).ipcRenderer.on(
				"returned-plugin-directory-data",
				async (_: any, directory: string, indexFile: string) => {
					const res = await api.plugins.readImportedManifest(directory);
					const { isValid, plugin } = res.data;

					if (!isValid) {
						Confirm({
							title: "Plugin Error",
							content:
								"The imported plugin does not have a valid manifest. Please make sure the plugin is created for gSender.",
							confirmLabel: "Ok",
						});
						return;
					}

					// do plugin checks
					const result = await api.plugins.scanPluginForSDKUsage(
						indexFile,
						SDK_SCAN_SPECIFIERS,
					);
					if (result.status !== 200) {
						console.error(result.data.msg);
						toast.error("Oops. Something went wrong.", {
							position: "bottom-right",
						});
						return;
					}

					const { capabilities, hasDynamicImport } = result.data;

					// figure out which clients they imported
					const scanned = buildGrantFromScan(capabilities);
					// Manifest parsers involve no SDK import, so the bundle scan
					// above cannot see them — fold them in explicitly.
					const { permissions, wire } = mergeManifestParserGrant(
						scanned,
						plugin.parsers,
					);
					const declaredParsers = Array.isArray(plugin.parsers)
						? plugin.parsers
						: [];
					const parserErrors = Array.isArray(plugin.parserErrors)
						? plugin.parserErrors
						: [];

					Confirm({
						title: "Plugin Permissions",
						content: (
							<div className="flex flex-col h-full">
								{hasDynamicImport && (
									<>
										<p className="font-bold">
											The actions this plugin runs cannot be verified.
										</p>
										<p className="font-bold">
											Not all permissions needed may be listed here.
										</p>
										<p className="font-bold text-amber-500">
											Please exercise caution.
										</p>
										<hr></hr>
									</>
								)}
								{permissions.length > 0 ? (
									<>
										<p>
											The plugin {plugin.name} needs the following permissions:
										</p>
										<ul>
											{permissions.map((permission) => (
												<li key={permission}>- {permission}</li>
											))}
										</ul>
									</>
								) : (
									<p>The plugin {plugin.name} does not need any permissions.</p>
								)}
								{declaredParsers.length > 0 && (
									<>
										<hr />
										<p>
											It watches your machine's responses for these patterns:
										</p>
										<ul>
											{declaredParsers.map((parser: any) => (
												<li key={parser.id}>
													- {parser.label || parser.id}{" "}
													<code className="text-xs">
														{[parser.begin, parser.match, parser.end]
															.filter(Boolean)
															.map((p: any) =>
																typeof p === "string" ? p : p?.source,
															)
															.join("  …  ")}
														{parser.until ? `  …  ${parser.until}` : ""}
													</code>
												</li>
											))}
										</ul>
									</>
								)}
								{parserErrors.length > 0 && (
									<>
										<p className="font-bold text-amber-500">
											Some of this plugin's parsers were rejected and will not
											run:
										</p>
										<ul className="text-amber-500 text-xs">
											{parserErrors.map((error: string) => (
												<li key={error}>- {error}</li>
											))}
										</ul>
									</>
								)}
								<p>Press Authorize to continue importing this plugin.</p>
							</div>
						),
						confirmLabel: "Authorize",
						cancelLabel: "Cancel",
						onConfirm: async () => {
							// write used permissions to manifest
							api.plugins.writePermissions(directory, wire).then((res) => {
								if (res.status !== 200) {
									console.error(res.data.error);
									toast.error(
										"Failed to write permissions for plugin. Please try again.",
										{
											position: "bottom-right",
										},
									);
								} else {
									setImportData({ directory });
								}
							});
						},
					});
				},
			);
		}
	}, []);

	useEffect(() => {
		if (!isEmpty(importData)) {
			const { directory } = importData;
			// import the directory to the plugins directory
			api.plugins.importPlugin(pluginsDir, directory).then((res) => {
				if (res.status !== 200) {
					console.error(res.data.error);
					toast.error("Failed to import plugin. Please try again.", {
						position: "bottom-right",
					});
				} else {
					toast.success("Plugin imported.");
					refresh();
				}
			});
		}
	}, [importData]);

	return (
		<Page
			title="Plugins"
			description="Manage UI plugins installed on this machine"
			withGoBackButton
			withFullPadding
		>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-gray-600 dark:text-content-secondary">
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

				<p className="text-sm text-gray-500 dark:text-content-muted">
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
					<Button onClick={handleImportPlugin}>Import Plugin</Button>
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
							className="border border-gray-200 dark:border-outline rounded-md p-4 flex flex-col h-full"
						>
							<div className="flex-1">
								<p className="font-semibold dark:text-content-primary">
									{plugin.name}
								</p>
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
										Slots: {plugin.contributions.map((c) => c.slot).join(", ")}
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
											onChange={(checked, _e) =>
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
