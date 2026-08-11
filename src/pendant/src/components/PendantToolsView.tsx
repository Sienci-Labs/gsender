import PluginPanel from "app/features/Plugins/components/PluginPanel";
import PluginToolCard from "app/components/PluginToolCard";
import ToolCard from "app/components/ToolCard";
import { usePlugins } from "app/features/Plugins/hooks/usePlugins";
import type { PluginRecord } from "app/features/Plugins/types";
import { useState } from "react";
import { BiSolidCylinder } from "react-icons/bi";
import { FaGamepad, FaKeyboard, FaSdCard } from "react-icons/fa";
import { GiFlatPlatform } from "react-icons/gi";
import { LuArrowLeft, LuDrill } from "react-icons/lu";
import { MdSquareFoot } from "react-icons/md";
import { PiPuzzlePiece } from "react-icons/pi";
import { TbPuzzle, TbRulerMeasure } from "react-icons/tb";

export default function PendantToolsView() {
	const { toolsPagePlugins } = usePlugins();
	const [activePlugin, setActivePlugin] = useState<PluginRecord | null>(null);

	if (activePlugin) {
		const contribution = activePlugin.contributions.find(
			(c) => c.slot === "tools-page",
		);

		return (
			<div className="flex-1 flex flex-col min-h-0 p-3">
				<div className="flex items-center justify-between mb-2">
					<h1 className="text-xl font-bold dark:text-content-primary">
						{contribution?.label || activePlugin.name}
					</h1>
					<button
						type="button"
						onClick={() => setActivePlugin(null)}
						className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary"
					>
						<LuArrowLeft className="w-4 h-4" />
						Back
					</button>
				</div>
				<PluginPanel plugin={activePlugin} className="flex-1" />
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3">
			<h1 className="text-xl font-bold dark:text-content-primary mb-1">
				Tools
			</h1>
			<p className="text-sm text-gray-500 dark:text-content-muted mb-3">
				Tools are plugins that can be installed and used to extend the
				functionality of gSender. Some are built in to gSender, some are third
				party plugins.
			</p>

			<div className="grid grid-cols-2 gap-3">
				<ToolCard
					title="Surfacing"
					description="Flatten your wasteboard or other non-flat stock"
					icon={GiFlatPlatform}
				/>

				<ToolCard
					title="Rotary Surfacing"
					description="Turn square material into round stock for rotary cutting"
					icon={BiSolidCylinder}
				/>

				<ToolCard
					title="Movement Tuning"
					description="Ensure that each axis of your machine is moving accurately"
					icon={TbRulerMeasure}
				/>

				<ToolCard
					title="XY Squaring"
					description="Get your CNC accurately aligned to make square cuts"
					icon={MdSquareFoot}
				/>

				<ToolCard
					title="Keyboard Shortcuts"
					description="Set up keyboard shortcuts for easy navigation and control"
					icon={FaKeyboard}
				/>

				<ToolCard
					title="Gamepad"
					description="Easy hand-held CNC control using pre-made or custom profiles"
					icon={FaGamepad}
				/>

				<ToolCard
					title={"SD Card Manager"}
					description={"Manage and view files on your SD card"}
					icon={FaSdCard}
				/>
				<ToolCard
					title={"Accessory Installation"}
					description={"Install various CNC Accessories"}
					icon={LuDrill}
				/>

				<ToolCard
					title="Plugins"
					description="Manage installed UI plugins"
					icon={PiPuzzlePiece}
				/>

				{toolsPagePlugins.map((plugin) => {
					const contribution = plugin.contributions.find(
						(c) => c.slot === "tools-page",
					);
					if (!contribution?.route) {
						return null;
					}

					return (
						<PluginToolCard
							key={plugin.id}
							title={contribution.label || plugin.name}
							description={`Plugin · v${plugin.version}`}
							blurb={plugin.description}
							icon={TbPuzzle}
							onClick={() => setActivePlugin(plugin)}
							official={plugin.id.startsWith("com.sienci.")}
						/>
					);
				})}
			</div>
		</div>
	);
}
