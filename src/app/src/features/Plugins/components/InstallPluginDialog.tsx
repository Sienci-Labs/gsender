import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogOverlay } from "app/components/shadcn/Dialog";
import cx from "classnames";
import isElectron from "is-electron";
import {
	AlertTriangle,
	ArrowDownCircle,
	ArrowLeft,
	ArrowRight,
	Check,
	FileArchive,
	FolderOpen,
	HelpCircle,
	Loader2,
	PackagePlus,
	RotateCw,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
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
	// Shown on the first step, before a plugin has been chosen and the server
	// has told us the exact target directory.
	pluginsDir?: string;
}

type FooterButton = {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	icon?: React.ReactNode;
};

// Chrome copied from the tool-change wizard (features/Helper) so the two read as
// siblings. That feature uses raw gray-* plus hardcoded dark: hex rather than the
// Workshop semantic tokens, so matching it means carrying the same values. Kept
// in one place here instead of scattered through the JSX.
const CHROME = {
	panel:
		"rounded-lg overflow-hidden shadow-2xl border border-gray-300/50 dark:border-[#2a2a35] bg-white dark:bg-[#18181f]",
	titlebar:
		"flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-[#2a2a35] bg-gray-100 dark:bg-[#111116]",
	titleText: "font-semibold text-base text-gray-900 dark:text-[#e5e5ea]",
	titleIcon: "text-gray-500 dark:text-content-muted",
	titlebarButton:
		"flex items-center justify-center w-7 h-7 rounded border border-gray-300 dark:border-[#3a3a48] bg-transparent text-gray-500 dark:text-content-muted hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none transition-colors",
	main: "flex-1 min-w-0 overflow-y-auto p-4 flex flex-col gap-3 bg-white dark:bg-[#18181f]",
	side: "w-[280px] shrink-0 border-l border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#141418] overflow-y-auto p-3 flex flex-col gap-3 portrait:w-full portrait:border-l-0 portrait:border-t",
	footer:
		"flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#111116]",
	ghostButton:
		"flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md border border-gray-300 dark:border-[#3a3a48] text-gray-600 dark:text-content-muted hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-35 disabled:pointer-events-none transition-colors",
	primaryButton:
		"flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-35 disabled:pointer-events-none transition-colors",
	eyebrow:
		"text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-amber-400",
	body: "text-sm leading-relaxed text-gray-600 dark:text-content-muted",
	heading: "text-sm font-semibold text-gray-900 dark:text-[#e5e5ea]",
	muted: "text-xs text-gray-400 dark:text-[#9ca3af]",
	code: "text-sky-700 dark:text-cyan-400",
	inset:
		"rounded border border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#0d0d12]",
} as const;

const STEPS: { id: InstallStep; label: string }[] = [
	{ id: "source", label: "Choose" },
	{ id: "review", label: "Review" },
	{ id: "installing", label: "Install" },
	{ id: "done", label: "Finish" },
];

// The error step replaces whichever step failed rather than adding one, so it
// reports the position of the step that was in progress.
const stepIndexFor = (step: InstallStep) =>
	step === "error" ? 1 : STEPS.findIndex((entry) => entry.id === step);

const STEP_TITLE: Record<InstallStep, string> = {
	source: "Choose",
	review: "Review",
	installing: "Installing",
	done: "Finish",
	error: "Problem",
};

const EYEBROW: Record<InstallStep, string> = {
	source: "Choose a plugin",
	review: "Review permissions",
	installing: "Installing",
	done: "All done",
	error: "Install stopped",
};

// What the primary button says. Downgrades and reinstalls are allowed but the
// label makes clear which one you are about to do.
const KIND_ACTION: Record<PluginInstallKind, string> = {
	new: "Install",
	update: "Update",
	downgrade: "Downgrade anyway",
	reinstall: "Reinstall",
	unknown: "Install anyway",
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
		className={cx(
			"flex gap-2 px-3 py-2 rounded-md border text-sm leading-relaxed",
			{
				"border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#0d0d12] text-gray-600 dark:text-content-muted":
					tone === "info",
				"border-orange-200 dark:border-orange-800 bg-amber-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300":
					tone === "warn",
				"border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300":
					tone === "error",
				"border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-[#052e16] text-emerald-800 dark:text-[#6ee7b7]":
					tone === "success",
			},
		)}
	>
		{icon && <span className="mt-0.5 shrink-0">{icon}</span>}
		<div className="min-w-0">{children}</div>
	</div>
);

const SideSection = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<section className="flex flex-col gap-1.5">
		<h3 className={CHROME.eyebrow}>{label}</h3>
		{children}
	</section>
);

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
	<div className="flex flex-col gap-0.5">
		<dt className={CHROME.muted}>{label}</dt>
		<dd className="text-xs text-gray-700 dark:text-content-muted break-all">
			{value}
		</dd>
	</div>
);

// Always expanded — the log is what you want the moment something goes wrong,
// and hiding it behind a toggle also made the panel resize.
const ActivityLog = ({ entries }: { entries: PluginInstallLogEntry[] }) => {
	const endRef = useRef<HTMLDivElement>(null);

	// Optional call: scrollIntoView is missing in some environments (jsdom, older
	// embedded webviews) and an absent convenience must not take the panel down.
	useEffect(() => {
		endRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [entries.length]);

	if (entries.length === 0) {
		return <p className={CHROME.muted}>Waiting for a plugin&hellip;</p>;
	}

	return (
		<ul
			className={cx(CHROME.inset, "px-2 py-1.5 font-mono text-[11px]")}
			data-testid="install-activity-log"
		>
			{entries.map((entry) => (
				<li
					key={`${entry.at}-${entry.message}`}
					className={cx("break-words py-0.5", {
						"text-gray-600 dark:text-content-muted": entry.level === "info",
						"text-amber-700 dark:text-amber-400": entry.level === "warn",
						"text-red-700 dark:text-red-400": entry.level === "error",
					})}
				>
					{entry.message}
				</li>
			))}
			<div ref={endRef} />
		</ul>
	);
};

const InfoPanel = ({
	plan,
	log,
	pluginsDir,
}: {
	plan: PluginInstallPlan | null;
	log: PluginInstallLogEntry[];
	pluginsDir?: string;
}) => (
	<aside className={CHROME.side}>
		<SideSection label="Details">
			{plan ? (
				<dl className="flex flex-col gap-2">
					<Fact label="Plugin" value={plan.plugin.name} />
					<Fact
						label="Identifier"
						value={<code className={CHROME.code}>{plan.plugin.id}</code>}
					/>
					<Fact
						label="Version"
						value={
							plan.installedVersion ? (
								<span>
									{plan.installedVersion} <span aria-hidden>&rarr;</span>{" "}
									<strong>{plan.incomingVersion}</strong>
								</span>
							) : (
								plan.incomingVersion
							)
						}
					/>
					{plan.plugin.contributions.length > 0 && (
						<Fact
							label="Adds"
							value={plan.plugin.contributions
								.map((contribution) => contribution.label ?? contribution.slot)
								.join(", ")}
						/>
					)}
					<Fact label="Installs to" value={plan.targetDir} />
				</dl>
			) : (
				<div className="flex flex-col gap-2">
					<p className={CHROME.body}>
						A gSender plugin is a folder holding a{" "}
						<code className={cx("text-xs", CHROME.code)}>
							gsender-plugin.json
						</code>{" "}
						manifest and a{" "}
						<code className={cx("text-xs", CHROME.code)}>ui/</code> build, or a{" "}
						<code className={cx("text-xs", CHROME.code)}>.zip</code> of that
						folder.
					</p>
					{pluginsDir && <Fact label="Installs into" value={pluginsDir} />}
				</div>
			)}
		</SideSection>

		<SideSection label="Activity">
			<ActivityLog entries={log} />
		</SideSection>
	</aside>
);

const VersionBanner = ({ plan }: { plan: PluginInstallPlan }) => {
	const { kind, installedVersion, incomingVersion } = plan;

	if (kind === "new") {
		return (
			<Callout tone="success" icon={<PackagePlus size={13} />}>
				New install of <strong>{plan.plugin.name}</strong> v{incomingVersion}.
			</Callout>
		);
	}

	if (kind === "update") {
		return (
			<Callout tone="success" icon={<Check size={13} />}>
				Updating <strong>{plan.plugin.name}</strong> from v{installedVersion} to
				v{incomingVersion}.
			</Callout>
		);
	}

	if (kind === "downgrade") {
		return (
			<Callout tone="warn" icon={<ArrowDownCircle size={13} />}>
				<strong>This is a downgrade.</strong> You have v{installedVersion}{" "}
				installed and this package is v{incomingVersion}. Any settings or files
				the newer version created may not work with the older one.
			</Callout>
		);
	}

	if (kind === "reinstall") {
		return (
			<Callout tone="warn" icon={<RotateCw size={13} />}>
				<strong>v{incomingVersion} is already installed.</strong> Continuing
				replaces the installed copy with this one.
			</Callout>
		);
	}

	return (
		<Callout tone="warn" icon={<HelpCircle size={13} />}>
			<strong>Version numbers could not be compared.</strong> Installed:{" "}
			{installedVersion}. This package: {incomingVersion}. Continuing replaces
			the installed copy.
		</Callout>
	);
};

const PermissionList = ({ plan }: { plan: PluginInstallPlan }) => (
	<div className="flex flex-col gap-2">
		<p className={CHROME.heading}>Permissions</p>

		{plan.unverifiable && (
			<Callout tone="warn" icon={<AlertTriangle size={13} />}>
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
				<ul className="flex flex-col gap-1">
					{plan.permissions.map((permission) => {
						const declaredOnly =
							plan.declaredOnlyPermissions.includes(permission);
						return (
							<li
								key={permission}
								className={cx(
									CHROME.inset,
									"flex items-center gap-2 px-3 py-1.5",
								)}
							>
								<code className={cx("text-sm font-mono", CHROME.code)}>
									{permission}
								</code>
								{declaredOnly && (
									<span className="text-[10px] text-amber-700 dark:text-amber-400">
										declared, not confirmed
									</span>
								)}
							</li>
						);
					})}
				</ul>
				{plan.declaredOnlyPermissions.length > 0 && (
					<p className={CHROME.muted}>
						Permissions marked &ldquo;declared, not confirmed&rdquo; are ones
						the plugin asks for that we could not find in its code. That is
						normal for plugins that bundle gSender&apos;s SDK, but it does mean
						you are taking the author&apos;s word for it.
					</p>
				)}
			</>
		) : (
			<p className={CHROME.body}>
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
	pluginsDir,
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

	// The swap must not be interrupted half-way through.
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

	const activeIndex = stepIndexFor(step);

	// Back on the left, primary on the right — the tool-change wizard's footer.
	const footerActions: {
		back: FooterButton | null;
		primary: FooterButton | null;
	} = (() => {
		switch (step) {
			case "review":
				return {
					back: { label: "Back", onClick: startOver },
					primary: plan
						? {
								label: KIND_ACTION[plan.kind],
								onClick: install,
								disabled: busy,
							}
						: null,
				};
			case "done":
				return {
					back: { label: "Later", onClick: onClose },
					primary: {
						label: "Restart now",
						onClick: restartNow,
						disabled: !isElectron(),
						icon: <RotateCw size={12} />,
					},
				};
			case "error":
				return {
					back: { label: "Close", onClick: onClose },
					primary: { label: "Try again", onClick: startOver },
				};
			default:
				return { back: null, primary: null };
		}
	})();

	return (
		<DialogPrimitive.Root open={show} onOpenChange={handleOpenChange}>
			<DialogPrimitive.Portal>
				<DialogOverlay />
				{/*
				 * Composed from the Radix primitives rather than shadcn's DialogContent:
				 * tailwind runs with important:true, so a className cannot reliably beat
				 * DialogContent's own p-6/grid/bg base classes, and it renders a second
				 * close button that would land on top of ours.
				 */}
				<DialogPrimitive.Content
					className={cx(
						"fixed left-[50%] top-[50%] z-[9999] translate-x-[-50%] translate-y-[-50%] w-[860px] max-w-[95vw]",
						CHROME.panel,
					)}
					onInteractOutside={(event) => {
						if (!canClose) {
							event.preventDefault();
						}
					}}
					onEscapeKeyDown={(event) => {
						if (!canClose) {
							event.preventDefault();
						}
					}}
				>
					<div className={CHROME.titlebar}>
						<div className="flex items-center gap-2 min-w-0">
							<PackagePlus size={14} className={CHROME.titleIcon} />
							<DialogPrimitive.Title className={CHROME.titleText}>
								Install a plugin
							</DialogPrimitive.Title>
							<span className={CHROME.muted} aria-hidden>
								&rsaquo;
							</span>
							<span className="text-xs text-gray-600 dark:text-content-primary truncate">
								{STEP_TITLE[step]}
							</span>
						</div>
						<DialogPrimitive.Close
							className={CHROME.titlebarButton}
							disabled={!canClose}
							aria-label="Close"
						>
							<X size={14} />
						</DialogPrimitive.Close>
					</div>

					<DialogPrimitive.Description className="sr-only">
						Install a gSender plugin from a folder or a zip file. You will be
						shown what it can do before anything is installed.
					</DialogPrimitive.Description>

					{/* Fixed body height: the left column scrolls so the panel never
					    changes size as you move between steps. */}
					<div className="flex h-[420px] portrait:h-auto portrait:flex-col">
						<div className={CHROME.main}>
							<p className={CHROME.eyebrow}>{EYEBROW[step]}</p>

							{step === "source" && (
								<div className="flex flex-col gap-4">
									<p className={CHROME.body}>
										Pick the plugin you want to install. Nothing is copied
										anywhere until you have seen what it can do.
									</p>

									{!isElectron() && (
										<Callout tone="warn" icon={<AlertTriangle size={13} />}>
											Picking a file needs the gSender desktop app. In the
											browser, copy the plugin folder into the plugins directory
											by hand.
										</Callout>
									)}

									<div className="flex flex-col gap-2 sm:flex-row">
										<button
											type="button"
											onClick={() => chooseSource("dir")}
											disabled={busy || !isElectron()}
											className={cx(
												CHROME.ghostButton,
												"flex-1 justify-center py-3",
											)}
										>
											<FolderOpen size={12} />
											From folder&hellip;
										</button>
										<button
											type="button"
											onClick={() => chooseSource("zip")}
											disabled={busy || !isElectron()}
											className={cx(
												CHROME.ghostButton,
												"flex-1 justify-center py-3",
											)}
										>
											<FileArchive size={12} />
											From .zip&hellip;
										</button>
									</div>

									{busy && (
										<p className={cx(CHROME.body, "flex items-center gap-2")}>
											<Loader2 size={13} className="animate-spin" />
											Reading the plugin&hellip;
										</p>
									)}

									<p className={CHROME.muted}>
										Only install plugins from sources you trust.
									</p>
								</div>
							)}

							{step === "review" && plan && (
								<div className="flex flex-col gap-3">
									<div>
										<p className={CHROME.heading}>{plan.plugin.name}</p>
										{plan.plugin.description && (
											<p className={cx(CHROME.body, "mt-1")}>
												{plan.plugin.description}
											</p>
										)}
									</div>

									<VersionBanner plan={plan} />

									{plan.engine.checked && !plan.engine.satisfied && (
										<Callout tone="warn" icon={<AlertTriangle size={13} />}>
											This plugin targets gSender{" "}
											<strong>{plan.engine.range}</strong> and you are running{" "}
											<strong>{plan.engine.appVersion}</strong>. It may not work
											correctly.
										</Callout>
									)}

									{plan.shadowedBy && (
										<Callout tone="warn" icon={<AlertTriangle size={13} />}>
											Another copy of this plugin is already loaded from{" "}
											<code className={cx("text-xs", CHROME.code)}>
												{plan.shadowedBy}
											</code>{" "}
											and will take priority over this one. Remove it if you
											want this version to be used.
										</Callout>
									)}

									<PermissionList plan={plan} />
								</div>
							)}

							{step === "installing" && (
								<div className="flex flex-1 flex-col items-center justify-center gap-3">
									<Loader2
										size={24}
										className="animate-spin text-blue-600 dark:text-blue-400"
									/>
									<p className={CHROME.body}>
										Installing {plan?.plugin.name}&hellip;
									</p>
									<p className={CHROME.muted}>
										Your previous version is kept until this finishes.
									</p>
								</div>
							)}

							{step === "done" && (
								<div className="flex flex-col gap-3">
									<Callout tone="success" icon={<Check size={13} />}>
										<strong>{plan?.plugin.name}</strong> v
										{plan?.incomingVersion} was{" "}
										{result?.replaced ? "updated" : "installed"}.
									</Callout>
									<p className={CHROME.body}>
										gSender registers plugin pages when it starts, so it needs a
										restart before you can open this plugin.
									</p>
								</div>
							)}

							{step === "error" && (
								<div className="flex flex-col gap-3">
									<Callout tone="error" icon={<XCircle size={13} />}>
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
											Your previously installed version was put back and still
											works.
										</Callout>
									)}

									<p className={CHROME.body}>
										Nothing was left half-installed. You can pick a different
										folder or zip and try again.
									</p>
								</div>
							)}
						</div>

						<InfoPanel plan={plan} log={log} pluginsDir={pluginsDir} />
					</div>

					<div className={CHROME.footer}>
						{footerActions.back ? (
							<button
								type="button"
								onClick={footerActions.back.onClick}
								className={CHROME.ghostButton}
							>
								<ArrowLeft size={12} />
								{footerActions.back.label}
							</button>
						) : (
							<span />
						)}

						<div className="flex items-center gap-1">
							{STEPS.map((entry, index) => (
								<div
									key={entry.id}
									className={cx("h-[3px] rounded-sm transition-all", {
										"w-[24px] bg-blue-600 dark:bg-blue-400":
											index === activeIndex,
										"w-[18px] bg-blue-300 dark:bg-blue-700":
											index < activeIndex,
										"w-[18px] bg-gray-300 dark:bg-[#2a2a35]":
											index > activeIndex,
									})}
								/>
							))}
						</div>

						{footerActions.primary ? (
							<button
								type="button"
								onClick={footerActions.primary.onClick}
								disabled={footerActions.primary.disabled}
								className={CHROME.primaryButton}
							>
								{footerActions.primary.label}
								{footerActions.primary.icon ?? <ArrowRight size={12} />}
							</button>
						) : (
							<span />
						)}
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
};

export default InstallPluginDialog;
