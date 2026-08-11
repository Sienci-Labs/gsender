import controller from "app/lib/controller";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PluginCapabilities, PluginRecord } from "../types";
import {
	registerPluginWindow,
	unregisterPluginWindow,
} from "../utils/plugin-permissions";

type PluginPanelProps = {
	plugin: PluginRecord;
	className?: string;
	title?: string;
};

const PluginPanel = ({ plugin, className = "", title }: PluginPanelProps) => {
	// Bumped on dev live-reload to force the iframe to re-fetch its content.
	const [reloadToken, setReloadToken] = useState(0);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const iframeSrc = useMemo(() => {
		const entry = plugin.uiUrl.startsWith("/")
			? plugin.uiUrl
			: `/${plugin.uiUrl}`;
		// Cache-bust so a reload actually pulls the latest built/edited files.
		return reloadToken > 0 ? `${entry}?r=${reloadToken}` : entry;
	}, [plugin.uiUrl, reloadToken]);

	useEffect(() => {
		const onPluginsChanged = () => setReloadToken((token) => token + 1);
		controller.addListener("plugins:changed", onPluginsChanged);
		return () => {
			controller.removeListener("plugins:changed", onPluginsChanged);
		};
	}, []);

	// Register this plugin's granted capabilities against its actual iframe
	// window BEFORE the iframe can send its first bridge message, and
	// deregister on unmount/reload. installPluginBridgeListener (mounted once,
	// globally) looks up capabilities by event.source on every incoming
	// message -- an iframe that was never registered here gets
	// EMPTY_CAPABILITIES and every request/subscribe is denied.
	useEffect(() => {
		const iframe = iframeRef.current;
		const win = iframe?.contentWindow;
		if (!win) return;

		const capabilities: PluginCapabilities = {
			requestTypes: new Set(plugin.capabilities.requestTypes ?? []),
			topics: new Set(plugin.capabilities.topics ?? []),
			allowedFunctions: new Set(plugin.capabilities.allowedFunctions ?? []),
		};

		registerPluginWindow(win, capabilities);
		return () => unregisterPluginWindow(win);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [plugin, reloadToken]);

	return (
		<div className={`flex flex-col w-full h-full min-h-0 ${className}`}>
			{title && (
				<p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
					{title}
				</p>
			)}
			<iframe
				ref={iframeRef}
				key={reloadToken}
				title={plugin.name}
				src={iframeSrc}
				className="flex-1 w-full min-h-[320px] border border-gray-200 rounded-md dark:border-dark-lighter bg-white dark:bg-dark"
				sandbox="allow-scripts allow-forms"
			/>
		</div>
	);
};

export default PluginPanel;
