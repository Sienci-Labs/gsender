import { useState } from 'react';
import { ChevronUp, ChevronDown, FolderOpen, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@gsender/ui/shadcn/Tabs';

const TABS = ['File', 'Probe', 'Spindle', 'Macros'] as const;

export default function BottomDrawer() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="shrink-0 border-t border-dark-lighter bg-dark-darker">
            {/* Collapsed header — always visible, tap to expand */}
            <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-lighter/30"
            >
                {expanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronUp size={16} className="text-gray-400 shrink-0" />}
                <div className="flex gap-3 flex-1">
                    {TABS.map((t) => (
                        <span key={t} className="text-xs text-gray-400 font-medium">{t}</span>
                    ))}
                </div>
            </button>

            {/* Expandable panel */}
            <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: expanded ? '22rem' : '0' }}
            >
                <Tabs defaultValue="File" className="flex flex-col">
                    {/* Tab list + action buttons */}
                    <div className="flex items-center border-b border-dark-lighter px-4">
                        <TabsList className="bg-transparent gap-0 h-10">
                            {TABS.map((t) => (
                                <TabsTrigger
                                    key={t}
                                    value={t}
                                    className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-robin-500 data-[state=active]:text-white rounded-none bg-transparent"
                                >
                                    {t}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="flex-1" />
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 text-sm border border-dark-lighter rounded-lg px-3 py-1.5 text-gray-300 hover:bg-dark-lighter">
                                <FolderOpen size={14} /> Browse
                            </button>
                            <button className="flex items-center gap-1.5 text-sm bg-robin-600 hover:bg-robin-500 rounded-lg px-3 py-1.5 text-white font-semibold">
                                <Upload size={14} /> Load File
                            </button>
                        </div>
                    </div>

                    {/* Tab content — all placeholder */}
                    <div className="overflow-y-auto max-h-64">
                        <TabsContent value="File" className="m-0 p-4 text-sm text-gray-500">
                            No file loaded. Use Browse or Load File to open a G-code file.
                        </TabsContent>
                        <TabsContent value="Probe" className="m-0 p-4 text-sm text-gray-500">
                            Probe routines — coming soon.
                        </TabsContent>
                        <TabsContent value="Spindle" className="m-0 p-4 text-sm text-gray-500">
                            Spindle controls — coming soon.
                        </TabsContent>
                        <TabsContent value="Macros" className="m-0 p-4 text-sm text-gray-500">
                            Macros — coming soon.
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
