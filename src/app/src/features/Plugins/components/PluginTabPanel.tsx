import { useRef } from "react";

import { usePluginIframeTheme } from "../hooks/usePluginIframeTheme";
import type { PluginRecord } from "../types";
import PluginPanel from "./PluginPanel";

type PluginTabPanelProps = {
	plugin: PluginRecord;
	isActive: boolean;
};

// reuses PluginPanel so the iframe window gets registered with the
// plugin's granted capabilities
export const PluginTabPanel = ({ plugin, isActive }: PluginTabPanelProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	usePluginIframeTheme(iframeRef, isActive);

	return <PluginPanel plugin={plugin} className="h-full" />;
};
