import { Routes, Route, Outlet } from 'react-router';
import Workspace from './workspace';
import { Config } from './features/Config';
import Firmware from './features/Firmware';
import KeyboardShortcuts from './features/Keyboard';
import MovementTuning from './features/MovementTuning';
import Squaring from './features/Squaring';
import { StatParent } from './features/Stats/StatParent';
import Surfacing from './features/Surfacing';
import Jointer from './features/Jointer';
import ToolCard from './components/ToolCard';
import { GiFlatPlatform } from 'react-icons/gi';
import { FaGamepad, FaKeyboard, FaMicrochip } from 'react-icons/fa';
import { TbRulerMeasure, TbVectorTriangle } from 'react-icons/tb';
import { MdSquareFoot } from 'react-icons/md';
import { Alarms } from './features/Stats/Alarms';
import { Stats } from './features/Stats';
import { Jobs } from './features/Stats/Jobs';
import { Maintenance } from './features/Stats/Maintenance';
import Page from './components/Page';
import { MachineInfoDisplay } from './features/MachineInfo/MachineInfoDisplay';
import { NotificationDisplay } from './features/NotificationsArea/NotificationDisplay';
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
import Gamepad from './features/Gamepad';
import { TopBar } from 'app/workspace/TopBar';
import Console from 'app/features/Console';
import Profile from './features/Gamepad/Profile';
import RotarySurfacing from './features/Rotary/RotarySurfacing';
import { BiSolidCylinder } from 'react-icons/bi';

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
                    <Route
                        index
                        element={
                            <div className="p-4 fixed-content-area no-scrollbar">
                                <p className="text-lg font-semibold mb-4 dark:text-white">
                                    Choose a tool to get started...
                                </p>

                                <div className="grid lg:grid-cols-3 grid-cols-2 gap-4 fixed-select-tool-area overflow-y-auto overflow-x-hidden">
                                    <ToolCard
                                        title="Surfacing"
                                        description="Flatten your wasteboard or other non-flat stock"
                                        icon={GiFlatPlatform}
                                        link="/tools/surfacing"
                                    />

                                    <ToolCard
                                        title="Jointer"
                                        description="Create perfect perpendicular edges on your material"
                                        icon={TbVectorTriangle}
                                        link="/tools/jointer"
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
                                        title="Old Firmware"
                                        description="This is depreciated and used to be used for updating firmware"
                                        icon={FaMicrochip}
                                        link="/tools/firmware"
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
                                withFullPadding
                            >
                                <KeyboardShortcuts />
                            </Page>
                        }
                    />
                    <Route
                        path="movement-tuning"
                        element={
                            <Page
                                title="Movement Tuning"
                                withGoBackButton
                                withFixedArea
                            >
                                <MovementTuning />
                            </Page>
                        }
                    />
                    <Route
                        path="squaring"
                        element={
                            <Page
                                title="XY Squaring"
                                withGoBackButton
                                withFixedArea
                            >
                                <Squaring />
                            </Page>
                        }
                    />
                    <Route
                        path="surfacing"
                        element={
                            <Page
                                title="Wasteboard Surfacing"
                                withGoBackButton
                                withFixedArea
                            >
                                <Surfacing />
                            </Page>
                        }
                    />
                    <Route
                        path="jointer"
                        element={
                            <Page
                                title="Jointer Tool"
                                withGoBackButton
                                withFixedArea
                            >
                                <Jointer />
                            </Page>
                        }
                    />
                    <Route
                        path="rotary-surfacing"
                        element={
                            <Page
                                title="Rotary Surfacing"
                                withGoBackButton
                                withFixedArea
                            >
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
                        path="gamepad/:gamepadProfileId"
                        element={<Profile />}
                    />
                    <Route
                        path="firmware"
                        element={
                            <Page
                                title="Firmware (Legacy)"
                                withGoBackButton
                                withFixedArea
                            >
                                <div className="flex justify-center items-center flex-col h-[599px] xl:h-[650px]">
                                    <Firmware />
                                </div>
                            </Page>
                        }
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
                element={<Console isActive={true} isChildWindow={true} />}
            ></Route>
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
                                    pinned={true}
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
