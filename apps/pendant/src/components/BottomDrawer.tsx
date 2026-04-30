import { useState } from 'react';
import { ChevronUp, ChevronDown, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@gsender/ui/shadcn/Tabs';

const TABS = ['File', 'Probe', 'Spindle', 'Macros'] as const;

export default function BottomDrawer() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="relative shrink-0 border-t border-gray-200 dark:border-dark-lighter bg-white dark:bg-dark-darker overflow-visible">
            {/* Collapsed header */}
            <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-lighter/30"
            >
                {expanded
                    ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
                    : <ChevronUp size={16} className="text-gray-400 shrink-0" />}
                <div className="flex gap-3 flex-1">
                    {TABS.map((t) => (
                        <span key={t} className="text-xs text-gray-400 dark:text-gray-400 font-medium">{t}</span>
                    ))}
                </div>
            </button>

            {/* Expandable panel */}
            <div
                className="absolute left-0 right-0 bottom-full z-30 overflow-hidden transition-all duration-300 bg-white dark:bg-dark-darker border-t border-x border-gray-200 dark:border-dark-lighter shadow-2xl"
                style={{ height: expanded ? '60vh' : '0' }}
            >
                <Tabs defaultValue="File" className="flex flex-col h-full">
                    <div className="h-12 flex items-center justify-end px-3 border-b border-gray-200 dark:border-dark-lighter">
                        <button
                            onClick={() => setExpanded(false)}
                            className="p-2 rounded border border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-lighter"
                            aria-label="Close tools drawer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex items-center border-b border-gray-200 dark:border-dark-lighter px-4">
                        <TabsList className="bg-transparent gap-0 h-10">
                            {TABS.map((t) => (
                                <TabsTrigger
                                    key={t}
                                    value={t}
                                    className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-robin-500 data-[state=active]:text-robin-600 dark:data-[state=active]:text-white rounded-none bg-transparent text-gray-500 dark:text-gray-400"
                                >
                                    {t}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="overflow-y-auto flex-1 min-h-0">
                        <TabsContent value="File" className="m-0 p-4 text-sm text-gray-400 dark:text-gray-500">
                            <div className="flex flex-col items-start gap-4">
                                <button className="flex items-center gap-2 text-base bg-robin-600 hover:bg-robin-500 rounded-lg px-5 py-3 text-white font-semibold">
                                    <Upload size={18} /> Load File
                                </button>
                                <span>No file loaded. Use Load File to open a G-code file.</span>
                            </div>
                        </TabsContent>
                        <TabsContent value="Probe" className="m-0 p-4 text-sm text-gray-400 dark:text-gray-500">
                            Probe routines — coming soon.
                        </TabsContent>
                        <TabsContent value="Spindle" className="m-0 p-4 text-sm text-gray-400 dark:text-gray-500">
                            Spindle controls — coming soon.
                        </TabsContent>
                        <TabsContent value="Macros" className="m-0 p-4 text-sm text-gray-400 dark:text-gray-500">
                            Macros — coming soon.
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
