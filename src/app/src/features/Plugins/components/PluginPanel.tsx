/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import controller from "app/lib/controller";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePluginIframeTheme } from "../hooks/usePluginIframeTheme";
import type { PluginRecord } from "../types";
import { toRuntimeCapabilities } from "../utils/capabilities";
import {
	registerPluginWindow,
	unregisterPluginWindow,
} from "../utils/plugin-permissions";
import { releaseRuntimeParsersForSource } from "../utils/pluginBridge";

type PluginPanelProps = {
	plugin: PluginRecord;
	className?: string;
	title?: string;
};

// Delegates every granted permission straight to the plugin iframe's
// Permissions-Policy. Most permissions (workspace:read, machine:read, etc.)
// have no browser-feature counterpart and gate the message bridge instead —
// browsers silently ignore unrecognized Permissions-Policy feature names, so
// passing those through here has no effect and needs no filtering. This is
// what lets a plugin declare any real browser permission (camera,
// microphone, geolocation, midi, ...) in its manifest and have it actually
// delegated, without gSender maintaining a name-by-name allowlist.
const buildIframeAllow = (permissions: PluginRecord["permissions"]): string =>
	(permissions ?? []).join("; ");

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

	// register this plugin's granted capabilities against its iframe window.
	// an iframe that was never registered here gets EMPTY_CAPABILITIES
	// and every request/subscribe is denied.
	useEffect(() => {
		const iframe = iframeRef.current;
		const win = iframe?.contentWindow;
		if (!win) return;

		// convert the capabilities from arrays to sets
		registerPluginWindow(
			win,
			toRuntimeCapabilities(plugin.capabilities),
			plugin.id
		);
		return () => {
			// Order matters: releasing resolves this iframe's owner id from the
			// registry, so it has to run before the registry entry is removed.
			// Manifest-declared parsers are unaffected — they belong to the
			// server and keep running with no UI mounted.
			releaseRuntimeParsersForSource(win);
			unregisterPluginWindow(win);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [plugin, reloadToken]);

	usePluginIframeTheme(iframeRef, reloadToken);

	return (
		<div className={`flex flex-col w-full h-full min-h-0 ${className}`}>
			{title && (
				<p className="text-sm font-medium text-gray-600 dark:text-content-secondary mb-2">
					{title}
				</p>
			)}
			<iframe
				ref={iframeRef}
				key={reloadToken}
				title={plugin.name}
				src={iframeSrc}
				className="flex-1 w-full min-h-[320px] border border-gray-200 rounded-md dark:border-outline"
				sandbox="allow-scripts allow-forms allow-same-origin"
				allow={buildIframeAllow(plugin.permissions)}
			/>
		</div>
	);
};

export default PluginPanel;
