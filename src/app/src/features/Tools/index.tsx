import { ATCWidget } from "app/features/ATC";
import { PluginTabIframe } from "app/features/Plugins/components/PluginTabPanel";
import { usePlugins } from "app/features/Plugins/hooks/usePlugins";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import { useWidgetState } from "app/hooks/useWidgetState";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { RootState } from "app/store/redux";
import { useMemo } from "react";
import { Tabs } from "../../components/Tabs";
import { Widget } from "../../components/Widget";
import Console from "../Console";
import Coolant from "../Coolant";
import Macros from "../Macros";
import Probe from "../Probe";
import Rotary from "../Rotary";
import Spindle from "../Spindle";

export interface TabItem {
	label: string;
	content: React.ComponentType<{ isActive: boolean }>;
}

const tabs = [
	{
		label: "Probe",
		content: Probe,
	},
	{
		label: "Macros",
		content: Macros,
	},
	{
		label: "Spindle/Laser",
		content: Spindle,
	},
	{
		label: "ATC",
		content: ATCWidget,
	},
	{
		label: "Coolant",
		content: Coolant,
	},
	{
		label: "Rotary",
		content: Rotary,
	},
	{
		label: "Console",
		content: Console,
	},
];

const Tools = () => {
	const rotary = useWidgetState("rotary");
	const { spindleFunctions, coolantFunctions, atcEnabled } =
		useWorkspaceState();
	const { toolsTabPlugins } = usePlugins();
	const atcReport = useTypedSelector(
		(state: RootState) => state.controller.settings.info?.NEWOPT?.ATC,
	);

	const pluginTabs = useMemo(() => {
		return toolsTabPlugins.flatMap((plugin) => {
			const contribution = plugin.contributions.find(
				(c) => c.slot === "tools-tab",
			);
			if (!contribution) {
				return [];
			}

			const label = contribution.label || plugin.name;
			const TabContent = ({ isActive }: { isActive: boolean }) => (
				<PluginTabIframe pluginId={plugin.id} isActive={isActive} />
			);

			return [{ label, content: TabContent }];
		});
	}, [toolsTabPlugins]);

	const atcEnabledOrCompiled = atcEnabled || atcReport === "1";

	const filteredTabs = [...tabs, ...pluginTabs].filter((tab) => {
		if (tab.label === "Rotary" && !rotary.tab.show) {
			return false;
		}

		if (tab.label === "Spindle/Laser" && !spindleFunctions) {
			return false;
		}
		if (tab.label === "ATC" && !atcEnabledOrCompiled) {
			return false;
		}

		if (tab.label === "Coolant" && !coolantFunctions) {
			return false;
		}

		return true;
	});

	return (
		<Widget>
			<Widget.Content>
				<Tabs items={filteredTabs as TabItem[]} />
			</Widget.Content>
		</Widget>
	);
};

export default Tools;
