import { usePlugins } from "../hooks/usePlugins";
import type { PluginRecord } from "../types";

type PluginTabPanelProps = {
	plugin: PluginRecord;
	isActive: boolean;
};

export const PluginTabPanel = ({ plugin, isActive }: PluginTabPanelProps) => {
	if (!isActive) {
		return null;
	}

	const iframeSrc = plugin.uiUrl.startsWith("/")
		? plugin.uiUrl
		: `/${plugin.uiUrl}`;

	return (
		<iframe
			title={plugin.name}
			src={iframeSrc}
			className="w-full h-full min-h-[280px] border-0"
			sandbox="allow-scripts allow-forms allow-same-origin"
		/>
	);
};

type PluginTabIframeProps = {
	pluginId: string;
	isActive: boolean;
};

export const PluginTabIframe = ({
	pluginId,
	isActive,
}: PluginTabIframeProps) => {
	const { plugins } = usePlugins();
	const plugin = plugins.find((p) => p.id === pluginId);

	if (!plugin) {
		return <p className="text-sm text-gray-500 p-4">Plugin unavailable.</p>;
	}

	return <PluginTabPanel plugin={plugin} isActive={isActive} />;
};
