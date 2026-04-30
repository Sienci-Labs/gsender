import { useState } from 'react';
import { ChevronUp, ChevronDown, Upload, X, Minimize2, Maximize2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@gsender/ui/shadcn/Tabs';

const TABS = ['File', 'Probe', 'Spindle', 'Macros'] as const;
type DrawerTab = (typeof TABS)[number];
type DrawerMode = 'closed' | 'minimal' | 'expanded';

const PREVIEW_TEXT: Record<DrawerTab, string> = {
    File: 'No file loaded',
    Probe: 'Probe routines — coming soon',
    Spindle: 'Spindle controls — coming soon',
    Macros: 'Macros — coming soon',
};

export default function BottomDrawer() {
    const [mode, setMode] = useState<DrawerMode>('minimal');
    const [activeTab, setActiveTab] = useState<DrawerTab>('File');

    const panelHeight = mode === 'expanded' ? '60vh' : mode === 'minimal' ? '6.75rem' : '0';
    const panelIcon = mode === 'closed'
        ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
        : mode === 'expanded'
            ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
            : <ChevronUp size={16} className="text-gray-400 shrink-0" />;

    return (
        <div className="relative shrink-0 border-t border-gray-200 dark:border-dark-lighter bg-white dark:bg-dark-darker overflow-visible">
            {/* Drawer mode bar */}
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-darker">
                <button
                    onClick={() => {
                        if (mode === 'closed') setMode('minimal');
                        else if (mode === 'minimal') setMode('expanded');
                        else setMode('minimal');
                    }}
                    className="p-1 rounded hover:bg-gray-50 dark:hover:bg-dark-lighter/30"
                    aria-label="Toggle drawer view"
                >
                    {panelIcon}
                </button>
                <div className="flex gap-3 flex-1">
                    {TABS.map((t) => (
                        <span key={t} className="text-xs text-gray-400 dark:text-gray-400 font-medium">{t}</span>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMode('minimal')}
                        className={`p-1.5 rounded border ${mode === 'minimal' ? 'border-robin-500 text-robin-600 dark:text-robin-400' : 'border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400'} hover:bg-gray-50 dark:hover:bg-dark-lighter`}
                        aria-label="Minimal preview"
                    >
                        <Minimize2 size={14} />
                    </button>
                    <button
                        onClick={() => setMode('expanded')}
                        className={`p-1.5 rounded border ${mode === 'expanded' ? 'border-robin-500 text-robin-600 dark:text-robin-400' : 'border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400'} hover:bg-gray-50 dark:hover:bg-dark-lighter`}
                        aria-label="Full expand"
                    >
                        <Maximize2 size={14} />
                    </button>
                    <button
                        onClick={() => setMode('closed')}
                        className="p-1.5 rounded border border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-lighter"
                        aria-label="Close drawer"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* 3-state panel */}
            <div
                className="absolute left-0 right-0 bottom-full z-30 overflow-hidden transition-all duration-300 bg-white dark:bg-dark-darker border-t border-x border-gray-200 dark:border-dark-lighter shadow-2xl"
                style={{ height: panelHeight }}
            >
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as DrawerTab)}
                    className="flex flex-col h-full"
                >
                    {mode === 'expanded' && (
                        <div className="h-12 flex items-center justify-end px-3 border-b border-gray-200 dark:border-dark-lighter">
                            <button
                                onClick={() => setMode('minimal')}
                                className="p-2 rounded border border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-lighter"
                                aria-label="Minimize tools drawer"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                className="ml-2 p-2 rounded border border-gray-200 dark:border-dark-lighter text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-lighter"
                                aria-label="Close tools drawer"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center border-b border-gray-200 dark:border-dark-lighter px-3">
                        <TabsList className="bg-transparent gap-0 h-9">
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

                    {mode === 'minimal' && (
                        <div className="flex-1 px-4 py-3">
                            <div className="h-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-dark-lighter bg-gray-50 dark:bg-dark px-3">
                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {activeTab}: {PREVIEW_TEXT[activeTab]}
                                </span>
                                {activeTab === 'File' && (
                                    <button className="flex items-center gap-1.5 text-xs bg-robin-600 hover:bg-robin-500 rounded-lg px-3 py-1.5 text-white font-semibold shrink-0">
                                        <Upload size={14} /> Load File
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {mode === 'expanded' && (
                        <div className="overflow-y-auto flex-1 min-h-0 p-4 text-sm text-gray-400 dark:text-gray-500">
                            {activeTab === 'File' && (
                                <div className="flex flex-col items-start gap-4">
                                    <button className="flex items-center gap-2 text-base bg-robin-600 hover:bg-robin-500 rounded-lg px-5 py-3 text-white font-semibold">
                                        <Upload size={18} /> Load File
                                    </button>
                                    <span>No file loaded. Use Load File to open a G-code file.</span>
                                </div>
                            )}
                            {activeTab === 'Probe' && <span>Probe routines — coming soon.</span>}
                            {activeTab === 'Spindle' && <span>Spindle controls — coming soon.</span>}
                            {activeTab === 'Macros' && <span>Macros — coming soon.</span>}
                        </div>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
