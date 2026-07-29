import ToolCard from "app/components/ToolCard";
import { usePlugins } from "app/features/Plugins/hooks/usePlugins";
import { BiSolidCylinder } from "react-icons/bi";
import { FaGamepad, FaKeyboard, FaSdCard } from "react-icons/fa";
import { GiFlatPlatform } from "react-icons/gi";
import { LuDrill } from "react-icons/lu";
import { MdSquareFoot } from "react-icons/md";
import { PiPuzzlePiece } from "react-icons/pi";
import { TbRulerMeasure } from "react-icons/tb";

const ToolsPage = () => {
	const { toolsPagePlugins } = usePlugins();

	return (
		<div className="py-4 px-16 max-xl:px-8 pb-12 fixed-content-area w-full flex flex-col overflow-y-auto">
			<h1 className="text-3xl font-bold dark:text-white mb-2">
				Tools
			</h1>
			<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
				Tools are plugins that can be installed and used to extend the functionality of gSender.
				Some are built in to gSender, some are third party plugins.
			</p>

			<div className="grid lg:grid-cols-3 grid-cols-2 gap-4">
				<ToolCard
					title="Surfacing"
					description="Flatten your wasteboard or other non-flat stock"
					icon={GiFlatPlatform}
					link="/tools/surfacing"
				/>

				<ToolCard
					title="Rotary Surfacing"
					description="Turn square material into round stock for rotary cutting"
					icon={BiSolidCylinder}
					link="/tools/rotary-surfacing"
				/>

				<ToolCard
					title="Movement Tuning"
					description="Ensure that each axis of your machine is moving accurately"
					icon={TbRulerMeasure}
					link="/tools/movement-tuning"
				/>

				<ToolCard
					title="XY Squaring"
					description="Get your CNC accurately aligned to make square cuts"
					icon={MdSquareFoot}
					link="/tools/squaring"
				/>

				<ToolCard
					title="Keyboard Shortcuts"
					description="Set up keyboard shortcuts for easy navigation and control"
					icon={FaKeyboard}
					link="/tools/keyboard-shortcuts"
				/>

				<ToolCard
					title="Gamepad"
					description="Easy hand-held CNC control using pre-made or custom profiles"
					icon={FaGamepad}
					link="/tools/gamepad"
				/>

				<ToolCard
					title={"SD Card Manager"}
					description={"Manage and view files on your SD card"}
					icon={FaSdCard}
					link={"/tools/sd"}
				/>
				<ToolCard
					title={"Accessory Installation"}
					description={"Install various CNC Accessories"}
					icon={LuDrill}
					link={"/tools/accessoryInstall"}
				/>

				<ToolCard
					title="Plugins"
					description="Manage installed UI plugins"
					icon={PiPuzzlePiece}
					link="/tools/plugins"
				/>

				{toolsPagePlugins.map((plugin) => {
					const contribution = plugin.contributions.find(
						(c) => c.slot === "tools-page",
					);
					if (!contribution?.route) {
						return null;
					}

					return (
						<ToolCard
							key={plugin.id}
							title={contribution.label || plugin.name}
							description={`Plugin · v${plugin.version}`}
							icon={PiPuzzlePiece}
							link={`/tools/plugin/${contribution.route}`}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default ToolsPage;