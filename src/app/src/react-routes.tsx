import { Routes, Route, Outlet } from 'react-router';
import Workspace from './workspace';
import { Config } from './features/Config';
import Firmware from './features/Firmware';
// import KeyboardShortcuts from './features/Keyboard';
import KeyboardShortcuts from './features/Keyboard_new';
import MovementTuning from './features/MovementTuning';
import Squaring from './features/Squaring';
import { StatParent } from './features/Stats/StatParent';
import Surfacing from './features/Surfacing';
import ToolCard from './components/ToolCard';
import { GiFlatPlatform } from 'react-icons/gi';
import { FaGamepad, FaKeyboard, FaMicrochip } from 'react-icons/fa';
import { LuPencilRuler } from 'react-icons/lu';
import { AiFillTool } from 'react-icons/ai';
import { Alarms } from './features/Stats/Alarms';
import { Stats } from './features/Stats';
import { Jobs } from './features/Stats/Jobs';
import { Maintenance } from './features/Stats/Maintenance';
import Page from './components/Page';
import { MachineInfoDisplay } from './features/MachineInfo/MachineInfoDisplay';
import { NotificationDisplay } from './workspace/TopBar/NotificationsArea/NotificationDisplay';
import { WorkspaceSelector } from './features/WorkspaceSelector';
import DRO from './features/DRO';
import { RemoteWidget } from './components/RemoteWidget';
import Coolant from './features/Coolant';
import FileControl from './features/FileControl';
import JobControl from './features/JobControl';
import { Jogging } from './features/Jogging';
import Macros from './features/Macros';
import Probe from './features/Probe';
import Rotary from './features/Rotary';
import Spindle from './features/Spindle';
import About from './features/Stats/About';
import { BottomNav } from './features/RemoteMode/components/BottomNav';
import { noop } from 'lodash';
import Gamepad from './features/Gamepad_new';
import GamepadProfilePage from './features/Gamepad/ProfilePage';
import { TopBar } from 'app/workspace/TopBar';
import Console from 'app/features/Console';
import Profile from './features/Gamepad_new/Profile';

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
                        <div className="p-4">
                            <p className="text-lg font-semibold mb-4 dark:text-white">
                                Choose a tool to get started...
                            </p>

                            <div className="grid grid-cols-3 sm:grid-cols-2 gap-4">
                                <ToolCard
                                    title="Surfacing"
                                    description="Generate toolpaths to surface and level your material"
                                    icon={GiFlatPlatform}
                                    link="/surfacing"
                                />

                                <ToolCard
                                    title="Firmware"
                                    description="Update the firmware on your machine"
                                    icon={FaMicrochip}
                                    link="/firmware"
                                />

                                <ToolCard
                                    title="XY Squaring"
                                    description="Use this tool to ensure your machine is squared correctly"
                                    icon={LuPencilRuler}
                                    link="/squaring"
                                />

                                <ToolCard
                                    title="Movement Tuning"
                                    description="Use this tool adjust the movement of your machine"
                                    icon={AiFillTool}
                                    link="/movement-tuning"
                                />

                                <ToolCard
                                    title="Keyboard Shortcuts"
                                    description="Use this tool to adjust the keyboard shortcuts of your machine"
                                    icon={FaKeyboard}
                                    link="/keyboard-shortcuts"
                                />

                                <ToolCard
                                    title="Gamepad"
                                    description="Use this tool to adjust the keyboard shortcuts of your machine"
                                    icon={FaGamepad}
                                    link="/gamepad"
                                />
                            </div>
                        </div>
                    }
                />
                <Route
                    path="keyboard-shortcuts"
                    element={
                        <Page
                            title="Keyboard Shortcuts"
                            description="Configure your keyboard shortcuts for various actions"
                            withGoBackButton
                        >
                            <KeyboardShortcuts />
                        </Page>
                    }
                />
                <Route
                    path="movement-tuning"
                    element={
                        <Page title="Movement Tuning" withGoBackButton>
                            <MovementTuning />
                        </Page>
                    }
                />
                <Route
                    path="squaring"
                    element={
                        <Page title="XY Squaring" withGoBackButton>
                            <Squaring />
                        </Page>
                    }
                />
                <Route
                    path="surfacing"
                    element={
                        <Page title="Wasteboard Surfacing" withGoBackButton>
                            <Surfacing />
                        </Page>
                    }
                />
                <Route
                    path="gamepad"
                    element={
                        <Page
                            title="Gamepad"
                            description="Manage your gamepad profiles here"
                        >
                            <Gamepad />
                        </Page>
                    }
                />
                <Route path="gamepad/:gamepadProfileId" element={<Profile />} />
                <Route
                    path="firmware"
                    element={
                        <Page title="Firmware (Legacy)" withGoBackButton>
                            <div className="flex justify-center items-center flex-col">
                                <Firmware />
                            </div>
                        </Page>
                    }
                />
                <Route path="stats" element={<StatParent />}>
                    <Route index element={<Stats />} />
                    <Route path="alarms" element={<Alarms />} />
                    <Route path="jobs" element={<Jobs />} />
                    <Route path="maintenance" element={<Maintenance />} />
                    <Route path="about" element={<About />} />
                </Route>
            </Route>
            <Route path="console" element={<Console isActive={true} />}></Route>
            <Route
                path="remote"
                element={
                    <div className="flex flex-col gap-2">
                        <TopBar />
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
                            <WorkspaceSelector />
                            <DRO />
                            <Jogging />
                        </>
                    }
                />
                <Route
                    path="info"
                    element={
                        <div className="flex flex-col justify-center gap-8 p-4">
                            <div>
                                <MachineInfoDisplay
                                    open={true}
                                    pinned={true}
                                    onClose={noop}
                                    setPinned={noop}
                                />
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
                                <Macros />
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
                        <div className="flex flex-col gap-48 mt-6">
                            <FileControl />
                            <JobControl />
                        </div>
                    }
                />
            </Route>
        </Routes>
    );
};
