import { Button } from "app/components/Button";
import { Badge } from "app/components/shadcn/Badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "app/components/shadcn/Dialog";
import { Spinner } from "app/components/shadcn/Spinner";
import cx from "classnames";
import isElectron from "is-electron";
import {
	AlertTriangle,
	ArrowDownCircle,
	ArrowUpCircle,
	Check,
	ChevronDown,
	FileArchive,
	FolderOpen,
	HelpCircle,
	PackagePlus,
	RotateCw,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type InstallStep, usePluginInstall } from "../hooks/usePluginInstall";
import type {
	PluginInstallKind,
	PluginInstallLogEntry,
	PluginInstallPlan,
} from "../types";

interface InstallPluginDialogProps {
	show: boolean;
	onClose: () => void;
	// Fired after the plugin list on disk may have changed, including after a
	// failed install that rolled back.
	onInstalled: () => void;
	// Fired once a plugin is installed, so the page can show its restart banner.
	onRestartRequired: () => void;
}

const STEPS: { id: InstallStep; label: string }[] = [
	{ id: "source", label: "Choose" },
	{ id: "review", label: "Review" },
	{ id: "installing", label: "Install" },
	{ id: "done", label: "Finish" },
];

// What the primary button on the review step says, and how loudly the version
// banner reads. Downgrades and reinstalls are allowed but called out.
const KIND_COPY: Record<
	PluginInstallKind,
	{ action: string; tone: "neutral" | "caution" }
> = {
	new: { action: "Install", tone: "neutral" },
	update: { action: "Update", tone: "neutral" },
	downgrade: { action: "Downgrade anyway", tone: "caution" },
	reinstall: { action: "Reinstall", tone: "caution" },
	unknown: { action: "Install anyway", tone: "caution" },
};

const StepIndicator = ({ current }: { current: InstallStep }) => {
	// The error step replaces whichever step failed, so nothing is marked done.
	const activeIndex = STEPS.findIndex((step) => step.id === current);

	return (
		<ol className="flex items-center gap-2 text-xs">
			{STEPS.map((step, index) => {
				const isDone = activeIndex > index;
				const isCurrent = activeIndex === index;
				return (
					<li key={step.id} className="flex items-center gap-2">
						<span
							className={cx(
								"flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
								{
									"border-green-500 bg-green-500 text-white": isDone,
									"border-blue-500 bg-blue-500 text-white": isCurrent,
									"border-gray-300 text-gray-400 dark:border-outline dark:text-content-muted":
										!isDone && !isCurrent,
								},
							)}
						>
							{isDone ? <Check className="h-3 w-3" /> : index + 1}
						</span>
						<span
							className={cx({
								"font-medium text-gray-900 dark:text-content-primary":
									isCurrent,
								"text-gray-500 dark:text-content-muted": !isCurrent,
							})}
						>
							{step.label}
						</span>
						{index < STEPS.length - 1 && (
							<span className="mx-1 h-px w-4 bg-gray-300 dark:bg-outline" />
						)}
					</li>
				);
			})}
		</ol>
	);
};

const Callout = ({
	tone,
	icon,
	children,
}: {
	tone: "info" | "warn" | "error" | "success";
	icon?: React.ReactNode;
	children: React.ReactNode;
}) => (
	<div
		className={cx("flex gap-2 rounded-md border px-3 py-2 text-sm", {
			"border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100":
				tone === "info",
			"border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100":
				tone === "warn",
			"border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100":
				tone === "error",
			"border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100":
				tone === "success",
		})}
	>
		{icon && <span className="mt-0.5 shrink-0">{icon}</span>}
		<div className="min-w-0">{children}</div>
	</div>
);

// Collapsed by default — it only matters when something went wrong or a
// curious user wants to see exactly which paths were touched.
const InstallLog = ({ entries }: { entries: PluginInstallLogEntry[] }) => {
	const [open, setOpen] = useState(false);

	if (entries.length === 0) {
		return null;
	}

	return (
		<div className="rounded-md border border-gray-200 dark:border-outline">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="flex w-full items-center justify-between px-3 py-2 text-xs text-gray-600 dark:text-content-secondary"
			>
				<span>Details ({entries.length})</span>
				<ChevronDown
					className={cx("h-4 w-4 transition-transform", { "rotate-180": open })}
				/>
			</button>
			{open && (
				<ul className="max-h-40 overflow-y-auto border-t border-gray-200 px-3 py-2 font-mono text-[11px] dark:border-outline">
					{entries.map((entry) => (
						<li
							key={`${entry.at}-${entry.message}`}
							className={cx("break-all py-0.5", {
								"text-gray-600 dark:text-content-secondary":
									entry.level === "info",
								"text-amber-700 dark:text-amber-400": entry.level === "warn",
								"text-red-700 dark:text-red-400": entry.level === "error",
							})}
						>
							{entry.message}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

const VersionBanner = ({ plan }: { plan: PluginInstallPlan }) => {
	const { kind, installedVersion, incomingVersion } = plan;

	if (kind === "new") {
		return (
			<Callout tone="info" icon={<PackagePlus className="h-4 w-4" />}>
				New install of <strong>{plan.plugin.name}</strong> v{incomingVersion}.
			</Callout>
		);
	}

	if (kind === "update") {
		return (
			<Callout tone="info" icon={<ArrowUpCircle className="h-4 w-4" />}>
				Updating <strong>{plan.plugin.name}</strong> from v{installedVersion} to
				v{incomingVersion}.
			</Callout>
		);
	}

	if (kind === "downgrade") {
		return (
			<Callout tone="warn" icon={<ArrowDownCircle className="h-4 w-4" />}>
				<strong>This is a downgrade.</strong> You have v{installedVersion}{" "}
				installed and this package is v{incomingVersion}. Any settings or files
				the newer version created may not work with the older one.
			</Callout>
		);
	}

	if (kind === "reinstall") {
		return (
			<Callout tone="warn" icon={<RotateCw className="h-4 w-4" />}>
				<strong>v{incomingVersion} is already installed.</strong> Continuing
				replaces the installed copy with this one.
			</Callout>
		);
	}

	return (
		<Callout tone="warn" icon={<HelpCircle className="h-4 w-4" />}>
			<strong>Version numbers could not be compared.</strong> Installed:{" "}
			{installedVersion}. This package: {incomingVersion}. Continuing replaces
			the installed copy.
		</Callout>
	);
};

const PermissionList = ({ plan }: { plan: PluginInstallPlan }) => (
	<div className="flex flex-col gap-2">
		<p className="text-sm font-medium text-gray-900 dark:text-content-primary">
			Permissions
		</p>

		{plan.unverifiable && (
			<Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
				<p className="font-semibold">
					This plugin&apos;s use of gSender cannot be fully verified.
				</p>
				<p>
					{plan.scanned
						? "It loads parts of the gSender SDK in a way we cannot inspect, so it may use more than the permissions listed below."
						: "No readable plugin bundle was found, so no permissions could be determined."}{" "}
					Only continue if you trust where this plugin came from.
				</p>
			</Callout>
		)}

		{plan.permissions.length > 0 ? (
			<>
				<ul className="flex flex-col gap-1 text-sm text-gray-700 dark:text-content-secondary">
					{plan.permissions.map((permission) => {
						const declaredOnly =
							plan.declaredOnlyPermissions.includes(permission);
						return (
							<li key={permission} className="flex items-center gap-2">
								<span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" />
								<code className="text-xs">{permission}</code>
								{declaredOnly && (
									<span className="text-[11px] text-amber-700 dark:text-amber-400">
										declared, not confirmed
									</span>
								)}
							</li>
						);
					})}
				</ul>
				{plan.declaredOnlyPermissions.length > 0 && (
					<p className="text-xs text-gray-500 dark:text-content-muted">
						Permissions marked &ldquo;declared, not confirmed&rdquo; are ones
						the plugin asks for that we could not find in its code. That is
						normal for plugins that bundle gSender&apos;s SDK, but it does mean
						you are taking the author&apos;s word for it.
					</p>
				)}
			</>
		) : (
			<p className="text-sm text-gray-500 dark:text-content-muted">
				{plan.scanned
					? "This plugin does not request any permissions."
					: "No permissions will be granted."}
			</p>
		)}
	</div>
);

export const InstallPluginDialog = ({
	show,
	onClose,
	onInstalled,
	onRestartRequired,
}: InstallPluginDialogProps) => {
	const {
		step,
		busy,
		plan,
		log,
		error,
		manifestErrors,
		restored,
		result,
		chooseSource,
		install,
		startOver,
		reset,
	} = usePluginInstall({ onInstalled });

	// Reset once the dialog is fully closed so reopening starts clean, and drop
	// any staged copy the user walked away from.
	// biome-ignore lint/correctness/useExhaustiveDependencies: only the open
	// state should drive this, not the identity of reset.
	useEffect(() => {
		if (!show) {
			reset();
		}
	}, [show]);

	useEffect(() => {
		if (step === "done") {
			onRestartRequired();
		}
	}, [step, onRestartRequired]);

	// Installing must not be interrupted half-way through the swap.
	const canClose = step !== "installing";
	const handleOpenChange = (open: boolean) => {
		if (!open && canClose) {
			onClose();
		}
	};

	const restartNow = () => {
		(window as unknown as { ipcRenderer?: any }).ipcRenderer?.send(
			"app-restart",
		);
	};

	return (
		<Dialog open={show} onOpenChange={handleOpenChange}>
			<DialogContent
				className="flex max-h-[85vh] w-[600px] max-w-[95vw] flex-col gap-4 overflow-y-auto"
				onInteractOutside={(event) => {
					if (!canClose) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>Install a plugin</DialogTitle>
					<DialogDescription>
						Plugins add pages and tools to gSender. Only install plugins from
						sources you trust.
					</DialogDescription>
				</DialogHeader>

				<StepIndicator current={step} />

				{step === "source" && (
					<div className="flex flex-col gap-4">
						<p className="text-sm text-gray-600 dark:text-content-secondary">
							A gSender plugin is a folder containing{" "}
							<code className="text-xs">gsender-plugin.json</code> and a{" "}
							<code className="text-xs">ui/</code> build, or a{" "}
							<code className="text-xs">.zip</code> of that folder. Nothing is
							installed until you have reviewed what it can do.
						</p>

						{!isElectron() && (
							<Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
								Picking a file needs the gSender desktop app. In the browser,
								copy the plugin folder into the plugins directory by hand.
							</Callout>
						)}

						<div className="flex flex-col gap-2 sm:flex-row">
							<Button
								onClick={() => chooseSource("dir")}
								disabled={busy || !isElectron()}
								icon={<FolderOpen className="h-4 w-4" />}
								className="flex-1"
							>
								From folder...
							</Button>
							<Button
								onClick={() => chooseSource("zip")}
								disabled={busy || !isElectron()}
								icon={<FileArchive className="h-4 w-4" />}
								className="flex-1"
							>
								From .zip...
							</Button>
						</div>

						{busy && (
							<p className="flex items-center gap-2 text-sm text-gray-500 dark:text-content-muted">
								<Spinner className="h-4 w-4" />
								Reading the plugin...
							</p>
						)}
					</div>
				)}

				{step === "review" && plan && (
					<div className="flex flex-col gap-4">
						<div>
							<p className="font-semibold dark:text-content-primary">
								{plan.plugin.name}
							</p>
							<p className="text-xs text-gray-500 dark:text-content-muted">
								{plan.plugin.id} · v{plan.plugin.version}
							</p>
							{plan.plugin.description && (
								<p className="mt-1 text-sm text-gray-600 dark:text-content-secondary">
									{plan.plugin.description}
								</p>
							)}
						</div>

						<VersionBanner plan={plan} />

						{plan.engine.checked && !plan.engine.satisfied && (
							<Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
								This plugin targets gSender <strong>{plan.engine.range}</strong>{" "}
								and you are running <strong>{plan.engine.appVersion}</strong>.
								It may not work correctly.
							</Callout>
						)}

						{plan.shadowedBy && (
							<Callout tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
								Another copy of this plugin is already loaded from{" "}
								<code className="break-all text-xs">{plan.shadowedBy}</code> and
								will take priority over this one. Remove it if you want this
								version to be used.
							</Callout>
						)}

						<PermissionList plan={plan} />

						{plan.plugin.contributions.length > 0 && (
							<div className="flex flex-wrap items-center gap-1">
								<span className="text-sm text-gray-600 dark:text-content-secondary">
									Adds to:
								</span>
								{plan.plugin.contributions.map((contribution) => (
									<Badge
										key={`${contribution.slot}-${contribution.route ?? ""}`}
										variant="secondary"
									>
										{contribution.label ?? contribution.slot}
									</Badge>
								))}
							</div>
						)}

						<p className="break-all text-xs text-gray-500 dark:text-content-muted">
							Will be installed to <code>{plan.targetDir}</code>
						</p>

						<InstallLog entries={log} />

						<div className="flex justify-end gap-2">
							<Button variant="secondary" onClick={startOver}>
								Back
							</Button>
							<Button onClick={install} disabled={busy}>
								{KIND_COPY[plan.kind].action}
							</Button>
						</div>
					</div>
				)}

				{step === "installing" && (
					<div className="flex flex-col gap-4 py-6">
						<p className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-content-secondary">
							<Spinner className="h-4 w-4" />
							Installing {plan?.plugin.name}...
						</p>
						<p className="text-center text-xs text-gray-500 dark:text-content-muted">
							Your previous version is kept until this finishes.
						</p>
					</div>
				)}

				{step === "done" && (
					<div className="flex flex-col gap-4">
						<Callout tone="success" icon={<Check className="h-4 w-4" />}>
							<strong>{plan?.plugin.name}</strong> v{plan?.incomingVersion} was{" "}
							{result?.replaced ? "updated" : "installed"}.
						</Callout>
						<p className="text-sm text-gray-600 dark:text-content-secondary">
							gSender registers plugin pages when it starts, so it needs a
							restart before you can open this plugin.
						</p>

						<InstallLog entries={log} />

						<div className="flex justify-end gap-2">
							<Button variant="secondary" onClick={onClose}>
								Later
							</Button>
							<Button onClick={restartNow} disabled={!isElectron()}>
								Restart now
							</Button>
						</div>
					</div>
				)}

				{step === "error" && (
					<div className="flex flex-col gap-4">
						<Callout tone="error" icon={<XCircle className="h-4 w-4" />}>
							<p className="font-semibold">{error}</p>
							{manifestErrors.length > 0 && (
								<ul className="mt-1 list-disc pl-4">
									{manifestErrors.map((manifestError) => (
										<li key={manifestError}>{manifestError}</li>
									))}
								</ul>
							)}
						</Callout>

						{restored && (
							<Callout tone="info">
								Your previously installed version was put back and still works.
							</Callout>
						)}

						<p className="text-sm text-gray-600 dark:text-content-secondary">
							Nothing was left half-installed. You can pick a different folder
							or zip and try again.
						</p>

						<InstallLog entries={log} />

						<div className="flex justify-end gap-2">
							<Button variant="secondary" onClick={onClose}>
								Close
							</Button>
							<Button onClick={startOver}>Try again</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default InstallPluginDialog;
