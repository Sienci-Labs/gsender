import { useMemo } from "react";

import type { PluginRecord } from "../types";

type PluginPanelProps = {
	plugin: PluginRecord;
	className?: string;
	title?: string;
};

const PluginPanel = ({ plugin, className = "", title }: PluginPanelProps) => {
	const iframeSrc = useMemo(() => {
		const entry = plugin.uiUrl.startsWith("/")
			? plugin.uiUrl
			: `/${plugin.uiUrl}`;
		return entry;
	}, [plugin.uiUrl]);

	return (
		<div className={`flex flex-col w-full h-full min-h-0 ${className}`}>
			{title && (
				<p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
					{title}
				</p>
			)}
			<iframe
				title={plugin.name}
				src={iframeSrc}
				className="flex-1 w-full min-h-[320px] border border-gray-200 rounded-md dark:border-dark-lighter bg-white dark:bg-dark"
				sandbox="allow-scripts allow-forms allow-same-origin"
			/>
		</div>
	);
};

export default PluginPanel;
