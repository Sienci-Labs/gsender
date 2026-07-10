import { AccessoryInstaller } from "app/features/AccessoryInstaller";
import Console from "app/features/Console";
import { PluginManager, PluginPage } from "app/features/Plugins";
import SDCard from "app/features/SDCard";
import { TopBar } from "app/workspace/TopBar";
import noop from "lodash/noop";
import { Outlet, Route, Routes } from "react-router";
import ConfirmationDialog from "./components/ConfirmationDialog/ConfirmationDialog";
import Page from "./components/Page";
import { RemoteWidget } from "./components/RemoteWidget";
import { Config } from "./features/Config";
import Coolant from "./features/Coolant";
import DRO from "./features/DRO";
import FileControl from "./features/FileControl";
import Gamepad from "./features/Gamepad";
import JobControl from "./features/JobControl";
import { Jogging } from "./features/Jogging";
import KeyboardShortcuts from "./features/Keyboard";
import { MachineInfoDisplay } from "./features/MachineInfo/MachineInfoDisplay";
import Macros from "./features/Macros";
import MovementTuning from "./features/MovementTuning";
import { NotificationDisplay } from "./features/NotificationsArea/NotificationDisplay";
import Probe from "./features/Probe";
import { BottomNav } from "./features/RemoteMode/components/BottomNav";
import Rotary from "./features/Rotary";
import RotarySurfacing from "./features/Rotary/RotarySurfacing";
import Spindle from "./features/Spindle";
import Squaring from "./features/Squaring";
import { Stats } from "./features/Stats";
import About from "./features/Stats/About";
import { Alarms } from "./features/Stats/Alarms";
import { Jobs } from "./features/Stats/Jobs";
import { Maintenance } from "./features/Stats/Maintenance";
import { StatParent } from "./features/Stats/StatParent";
import Surfacing from "./features/Surfacing";
import { WorkspaceSelector } from "./features/WorkspaceSelector";
import ToolsPage from "./routes/tools";
import Workspace from "./workspace";

export const ReactRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<Workspace />}>
				<Route index element={<></>} />
				<Route
					path="configuration"
					element={
						<div className="flex max-h-4/5 overflow-y-clip items-center justify-center no-scrollbar">
							<Config />
						</div>
					}
				/>
				<Route
					path="tools"
					element={
						<>
							<Outlet />
						</>
					}
				>
					<Route index element={<ToolsPage />} />
					<Route path="plugins" element={<PluginManager />} />
					<Route path="plugin/:pluginRoute" element={<PluginPage />} />
					<Route
						path="keyboard-shortcuts"
						element={
							<Page
								title="Keyboard Shortcuts"
								description="Configure your keyboard shortcuts for various actions"
								withGoBackButton
								withFullPadding
							>
								<KeyboardShortcuts />
							</Page>
						}
					/>
					<Route
						path="movement-tuning"
						element={
							<Page title="Movement Tuning" withGoBackButton withFixedArea>
								<MovementTuning />
							</Page>
						}
					/>
					<Route
						path="squaring"
						element={
							<Page title="XY Squaring" withGoBackButton withFixedArea>
								<Squaring />
							</Page>
						}
					/>
					<Route
						path="surfacing"
						element={
							<Page title="Wasteboard Surfacing" withGoBackButton withFixedArea>
								<Surfacing />
							</Page>
						}
					/>
					<Route
						path="rotary-surfacing"
						element={
							<Page title="Rotary Surfacing" withGoBackButton withFixedArea>
								<RotarySurfacing />
							</Page>
						}
					/>
					<Route
						path="gamepad"
						element={
							<Page
								title="Gamepad"
								description="Manage your gamepad profiles here"
								withGoBackButton
								withFixedArea
							>
								<Gamepad />
							</Page>
						}
					/>
					<Route
						path={"sd"}
						element={
							<Page title="SD Card Manager" withGoBackButton withFixedArea>
								<SDCard />
							</Page>
						}
					/>
					<Route path={"accessoryInstall"} element={<AccessoryInstaller />} />
					<Route
						path={"accessoryInstall/:wizardId"}
						element={<AccessoryInstaller />}
					/>
					<Route
						path={"accessoryInstall/:wizardId/:subWizardId"}
						element={<AccessoryInstaller />}
					/>
				</Route>
				<Route path="stats" element={<StatParent />}>
					<Route index element={<Stats />} />
					<Route path="alarms" element={<Alarms />} />
					<Route path="jobs" element={<Jobs />} />
					<Route path="maintenance" element={<Maintenance />} />
					<Route path="about" element={<About />} />
				</Route>
			</Route>
			<Route
				path="console"
				element={<Console isActive isChildWindow />}
			></Route>
			<Route
				path="remote"
				element={
					<div className="flex flex-col gap-2">
						<TopBar isRemoteWindow />
						<ConfirmationDialog />
						<div className="flex flex-col gap-8 min-h-screen p-4">
							<Outlet />
						</div>

						<BottomNav />
					</div>
				}
			>
				<Route
					index
					element={
						<>
							<div className="relative mb-6">
								<WorkspaceSelector />
							</div>
							<DRO isRemote />
							<Jogging />
						</>
					}
				/>
				<Route
					path="info"
					element={
						<div className="flex flex-col justify-center gap-8 p-4">
							<div>
								<MachineInfoDisplay pinned setPinned={noop} />
							</div>

							<div>
								<NotificationDisplay />
							</div>
						</div>
					}
				/>
				<Route
					path="tools"
					element={
						<>
							<RemoteWidget label="Probe">
								<Probe />
							</RemoteWidget>
							<RemoteWidget label="Macros">
								<Macros isRemote />
							</RemoteWidget>
							<RemoteWidget label="Spindle">
								<Spindle />
							</RemoteWidget>
							<RemoteWidget label="Coolant">
								<Coolant />
							</RemoteWidget>
							<RemoteWidget label="Rotary">
								<Rotary />
							</RemoteWidget>
						</>
					}
				/>
				<Route
					path="workflow"
					element={
						<div className="flex flex-col gap-48 mt-12 relative">
							<FileControl />
							<JobControl />
						</div>
					}
				/>
				<Route
					path="config"
					element={
						<div className="flex max-h-4/5 overflow-y-clip items-center justify-center no-scrollbar">
							<Config />
						</div>
					}
				/>
			</Route>
		</Routes>
	);
};
