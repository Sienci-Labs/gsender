import { usePostHog } from "@posthog/react";
import Button from "app/components/Button";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "app/components/shadcn/Sheet";
import store from "app/store";
import { BarChart3, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

/** Wait before showing the consent sheet so startup UI can settle. */
const SHOW_DELAY_MS = 3000;

const isDev =
	typeof process !== "undefined"
		? process.env.NODE_ENV === "development"
		: import.meta?.env?.MODE === "development";

const DataCollection = () => {
	if (isDev) return null;

	const posthog = usePostHog();
	const [open, setOpen] = useState(false);

	const collectUsageDataStatus = store.get(
		"workspace.collectUsageDataStatus",
		"pending",
	);

	useEffect(() => {
		if (collectUsageDataStatus !== "pending") {
			setOpen(false);
			return;
		}
		const id = window.setTimeout(() => {
			setOpen(true);
		}, SHOW_DELAY_MS);
		return () => clearTimeout(id);
	}, [collectUsageDataStatus]);

	const handleAccept = async () => {
		posthog.opt_in_capturing();
		store.replace("workspace.collectUsageDataStatus", "accepted");
		setOpen(false);
	};

	const handleDecline = async () => {
		posthog.opt_out_capturing();
		store.replace("workspace.collectUsageDataStatus", "denied");
		setOpen(false);
	};

	return (
		<Sheet
			open={open && collectUsageDataStatus === "pending"}
			onOpenChange={setOpen}
		>
			<SheetContent
				side="bottom"
				hideClose
				className="border-0 bg-transparent shadow-none z-50"
				transparent
				forceMount
			>
				<div className="pointer-events-auto relative w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white pl-6 pr-12 pb-8 pt-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.03)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)]">
					<SheetClose className="absolute right-3 top-3 rounded-sm p-1 text-slate-500 opacity-80 ring-offset-background transition-opacity hover:bg-slate-100 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:hover:bg-slate-800">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</SheetClose>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col space-y-1 text-center">
							<SheetTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
								Anonymous usage information
							</SheetTitle>
							<p className="text-sm font-medium text-blue-600 dark:text-blue-400">
								Help us make gSender better
							</p>
						</div>

						<div className="flex flex-wrap justify-center gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
								<ShieldCheck
									className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
									strokeWidth={2}
								/>
								Anonymous
							</span>
							<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
								Optional
							</span>
							<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
								<SlidersHorizontal
									className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
									strokeWidth={2}
								/>
								Change anytime in Settings
							</span>
						</div>

						<div className="flex flex-col items-center gap-6 text-slate-600 md:flex-row md:items-center md:justify-center dark:text-slate-400">
							<div
								className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/[0.12] via-slate-50 to-emerald-600/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] ring-1 ring-slate-200/70 dark:from-blue-400/15 dark:via-slate-800 dark:to-emerald-500/10 dark:ring-slate-600/80"
								aria-hidden
							>
								<BarChart3
									className="h-9 w-9 text-blue-600/90 dark:text-blue-400"
									strokeWidth={1.5}
								/>
							</div>

							<div className="min-w-0 max-w-prose flex-1 space-y-4">
								<SheetDescription className="space-y-3 text-sm leading-relaxed">
									We&apos;d like a clearer picture of how many people use
									gSender, which CNCs and computers it runs on, and general app
									usage, so we can focus improvements where they matter most.
									<br /> <br />
									Nothing is collected without your permission, and you can opt
									in or out whenever you like from the settings screen.
								</SheetDescription>
							</div>
						</div>
					</div>

					<div className="mt-8 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:space-x-2">
						<Button
							variant="secondary"
							className="w-full sm:w-auto"
							onClick={handleDecline}
						>
							Decline
						</Button>
						<Button
							variant="alt"
							className="w-full sm:w-auto"
							onClick={handleAccept}
						>
							Accept
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default DataCollection;
