import { Routes, Route } from 'react-router';
import Workspace from './workspace';
import { Config } from './features/Config';
import { UpdateAlert } from './components/UpdateAlert';
import Firmware from './features/Firmware';
import KeyboardShortcuts from './features/Keyboard';
import MovementTuning from './features/MovementTuning';
import Squaring from './features/Squaring';
import { StatParent } from './features/Stats/StatParent';
import Surfacing from './features/Surfacing';
import ToolCard from './components/ToolCard';
import { GiFlatPlatform } from 'react-icons/gi';
import { FaKeyboard, FaMicrochip } from 'react-icons/fa';
import { LuPencilRuler } from 'react-icons/lu';
import { AiFillTool } from 'react-icons/ai';
import { Alarms } from './features/Stats/Alarms';
import { Stats } from './features/Stats';
import { Jobs } from './features/Stats/Jobs';
import { Maintenance } from './features/Stats/Maintenance';

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
                    path="firmware"
                    element={
                        <div className="flex justify-center items-center flex-col">
                            <UpdateAlert />
                            <Firmware />
                        </div>
                    }
                />
                <Route
                    path="tools"
                    element={
                        <div className="p-4">
                            <p className="text-lg font-semibold mb-4">
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
                            </div>
                        </div>
                    }
                />
                <Route
                    path="keyboard-shortcuts"
                    element={
                        <div className="p-4">
                            <KeyboardShortcuts />
                        </div>
                    }
                />
                <Route
                    path="movement-tuning"
                    element={
                        <div className="p-4">
                            <MovementTuning />
                        </div>
                    }
                />
                <Route
                    path="squaring"
                    element={
                        <div className="p-4">
                            <Squaring />
                        </div>
                    }
                />
                <Route
                    path="surfacing"
                    element={
                        <div className="p-4">
                            <Surfacing />
                        </div>
                    }
                />
                <Route path="stats" element={<StatParent />}>
                    <Route index element={<Stats />} />
                    <Route path="alarms" element={<Alarms />} />
                    <Route path="jobs" element={<Jobs />} />
                    <Route path="maintenance" element={<Maintenance />} />
                </Route>
            </Route>
        </Routes>
    );
};
