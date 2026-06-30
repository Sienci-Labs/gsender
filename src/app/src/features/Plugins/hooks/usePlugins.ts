import api from "app/api";
import { useCallback, useEffect, useState } from "react";
import type { PluginRecord, PluginsResponse } from "../types";

export const usePlugins = () => {
	const [plugins, setPlugins] = useState<PluginRecord[]>([]);
	const [pluginsDir, setPluginsDir] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const { data } = await api.plugins.fetch();
			const response = data as PluginsResponse;
			setPlugins(response.plugins || []);
			setPluginsDir(response.pluginsDir || "");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load plugins");
			setPlugins([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const setEnabled = useCallback(
		async (id: string, enabled: boolean) => {
			const { data } = await api.plugins.update(id, { enabled });
			await refresh();
			return data as { restartRequired?: boolean };
		},
		[refresh],
	);

	const activePlugins = plugins.filter((p) => p.valid && p.enabled);

	const toolsPagePlugins = activePlugins.filter((p) =>
		p.contributions.some((c) => c.slot === "tools-page"),
	);

	const toolsTabPlugins = activePlugins.filter((p) =>
		p.contributions.some((c) => c.slot === "tools-tab"),
	);

	return {
		plugins,
		pluginsDir,
		loading,
		error,
		refresh,
		setEnabled,
		activePlugins,
		toolsPagePlugins,
		toolsTabPlugins,
	};
};
