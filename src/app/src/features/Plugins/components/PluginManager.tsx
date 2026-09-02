import api from "app/api";
import { Button } from "app/components/Button";
import Page from "app/components/Page";
import Switch from "app/components/Switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "app/components/shadcn/AlertDialog";
import { Badge } from "app/components/shadcn/Badge";
import { Tooltip } from "app/components/Tooltip";
import { toast } from "app/lib/toaster";
import isElectron from "is-electron";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { usePlugins } from "../hooks/usePlugins";
import type { PluginRecord } from "../types";
import InstallPluginDialog from "./InstallPluginDialog";

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
	const [showInstall, setShowInstall] = useState(false);
	const [pendingRemoval, setPendingRemoval] = useState<PluginRecord | null>(
		null,
	);
	const [removing, setRemoving] = useState(false);

	const canOpenDir = isElectron();

	const handleToggle = async (id: string, enabled: boolean) => {
		const result = await setEnabled(id, enabled);
		if (result?.restartRequired) {
			setRestartRequired(true);
		}
	};

	const handleOpenDir = async () => {
		try {
			await openPluginsDir();
		} catch {
			// Opening the folder is best-effort; ignore failures silently.
		}
	};

	const handleRestart = () => {
		(window as unknown as { ipcRenderer?: any }).ipcRenderer?.send(
			"app-restart",
		);
	};

	const handleUninstall = async () => {
		if (!pendingRemoval) {
			return;
		}

		setRemoving(true);
		try {
			await api.plugins.uninstall(pendingRemoval.id);
			toast.success(`${pendingRemoval.name} was removed.`);
			setRestartRequired(true);
			setPendingRemoval(null);
			await refresh();
		} catch (err) {
			const message =
				(err as { response?: { data?: { error?: string } } })?.response?.data
					?.error ?? "Could not remove the plugin. Please try again.";
			toast.error(message, { position: "bottom-right" });
		} finally {
			setRemoving(false);
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
					<code className="text-xs">ui/</code> build output. After installing,
					removing or enabling a plugin, restart gSender for mount routes to
					apply.
				</p>

				{restartRequired && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
						<span>
							Restart gSender to apply plugin changes. Mount routes are
							registered when the server starts.
						</span>
						{isElectron() && (
							<Button onClick={handleRestart} size="sm">
								Restart now
							</Button>
						)}
					</div>
				)}

				<div className="flex gap-2">
					<Button onClick={() => setShowInstall(true)}>Install Plugin</Button>
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
								{plugin.permissions?.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{plugin.permissions.map((permission) => (
											<Badge
												key={permission}
												variant="secondary"
												className="text-[10px]"
											>
												{permission}
											</Badge>
										))}
									</div>
								)}
							</div>
							<div className="mt-4 flex items-center justify-between">
								<Tooltip content={`Remove ${plugin.name} from this machine`}>
									<div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setPendingRemoval(plugin)}
											icon={<Trash2 className="h-4 w-4" />}
										>
											Uninstall
										</Button>
									</div>
								</Tooltip>
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

			<InstallPluginDialog
				show={showInstall}
				onClose={() => setShowInstall(false)}
				onInstalled={refresh}
				onRestartRequired={() => setRestartRequired(true)}
			/>

			<AlertDialog
				open={Boolean(pendingRemoval)}
				onOpenChange={(open) => {
					if (!open && !removing) {
						setPendingRemoval(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove {pendingRemoval?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							This deletes the plugin folder from your plugins directory. Any
							data it stored is kept, but the plugin itself will be gone until
							you install it again. gSender will need a restart afterwards.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								// Keep the dialog up while the request is in flight so the
								// user sees it finish rather than a flash of nothing.
								event.preventDefault();
								handleUninstall();
							}}
							disabled={removing}
						>
							{removing ? "Removing..." : "Uninstall"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	);
};

export default PluginManager;
