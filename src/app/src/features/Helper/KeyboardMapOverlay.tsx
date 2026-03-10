import React from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { RootState } from 'app/store/redux';
import { useActiveShortcuts } from 'app/lib/shortcutRegistry';
import {
    GENERAL_CATEGORY,
    LOCATION_CATEGORY,
    JOGGING_CATEGORY,
    SPINDLE_LASER_CATEGORY,
    COOLANT_CATEGORY,
    TOOLBAR_CATEGORY,
    CARVING_CATEGORY,
    VISUALIZER_CATEGORY,
    MACRO_CATEGORY,
    OVERRIDES_CATEGORY,
    PROBING_CATEGORY
} from 'app/constants';

export const KeyboardMapOverlay: React.FC = () => {
    const { showKeyboardMap } = useTypedSelector(
        (state: RootState) => state.preferences.accessibility,
    );
    const activeEvents = useActiveShortcuts();
    const shortcuts = useTypedSelector(
        (state: RootState) => state.preferences.shortcuts.list,
    );

    if (!showKeyboardMap) return null;

    const categories = [
        GENERAL_CATEGORY,
        LOCATION_CATEGORY,
        JOGGING_CATEGORY,
        SPINDLE_LASER_CATEGORY,
        COOLANT_CATEGORY,
        CARVING_CATEGORY,
        TOOLBAR_CATEGORY,
        VISUALIZER_CATEGORY,
        MACRO_CATEGORY,
        OVERRIDES_CATEGORY,
        PROBING_CATEGORY
    ];

    const getShortcutsByCategory = (category: string) => {
        return activeEvents
            .filter((event) => event.category === category)
            .map((event) => ({
                title: event.title,
                keys: shortcuts[event.cmd]?.keys || event.keys,
            }))
            .filter(item => item.keys && item.keys.length > 0);
    };

    return (
        <div className="fixed inset-0 z-[10001] pointer-events-none flex items-end justify-center p-8">
            <div className="bg-black/90 backdrop-blur-md text-white p-6 rounded-xl border border-white/20 shadow-2xl max-w-5xl w-full grid grid-cols-3 gap-x-8 gap-y-6 pointer-events-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="col-span-3 flex justify-between items-center border-b border-white/20 pb-4 mb-2">
                    <div>
                        <h2 className="text-2xl font-bold">Active Keyboard Shortcuts</h2>
                        <p className="text-sm text-white/60">Dynamic map of currently available shortcuts</p>
                    </div>
                    <div className="text-xs bg-blue-600 px-2 py-1 rounded">Accessibility Overlay</div>
                </div>
                {categories.map(category => {
                    const items = getShortcutsByCategory(category);
                    if (items.length === 0) return null;
                    
                    return (
                        <div key={category} className="space-y-2">
                            <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                                {category}
                            </h3>
                            <ul className="space-y-1.5">
                                {items.map(item => (
                                    <li key={`${category}-${item.title}`} className="flex justify-between items-center text-sm">
                                        <span className="text-white/70 truncate mr-2" title={item.title}>{item.title}</span>
                                        <kbd className="flex-shrink-0 bg-white/10 px-2 py-0.5 rounded text-[11px] font-mono border border-white/20 shadow-sm text-blue-200">
                                            {Array.isArray(item.keys) ? item.keys.join('+') : item.keys}
                                        </kbd>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
