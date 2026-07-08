import Page from "app/components/Page";
import { useMemo } from "react";
import { useParams } from "react-router";
import { usePlugins } from "../hooks/usePlugins";
import PluginPanel from "./PluginPanel";

const PluginPage = () => {
	const { pluginRoute = "" } = useParams();
	const { plugins, loading } = usePlugins();

	const plugin = useMemo(() => {
		return plugins.find(
			(p) =>
				p.enabled &&
				p.valid &&
				p.contributions.some(
					(c) => c.slot === "tools-page" && c.route === pluginRoute,
				),
		);
	}, [plugins, pluginRoute]);

	if (loading) {
		return (
			<Page title="Plugin" withGoBackButton>
				<p className="text-gray-500">Loading plugin...</p>
			</Page>
		);
	}

	if (!plugin) {
		return (
			<Page title="Plugin" withGoBackButton>
				<p className="text-gray-500">
					Plugin not found or disabled. Install plugins to{" "}
					<code className="text-sm">plugins</code> folder and restart gSender.
				</p>
			</Page>
		);
	}

	const contribution = plugin.contributions.find(
		(c) => c.slot === "tools-page",
	);

	return (
		<Page
			title={contribution?.label || plugin.name}
			withGoBackButton
		>
			<PluginPanel plugin={plugin} className="h-full" />
		</Page>
	);
};

export default PluginPage;
