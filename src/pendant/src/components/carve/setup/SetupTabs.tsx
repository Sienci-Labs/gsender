import Console from 'app/features/Console';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import { useEffect } from 'react';
import type { FileActions } from '../../../hooks/useFileActions';
import ATCPanel from '../../ATCPanel';
import MacrosPanel from '../../MacrosPanel';
import FileTab from './FileTab';
import PositionTab from './PositionTab';
import PrepTab from './PrepTab';

export const SETUP_TABS = [
    'File',
    'Position',
    'Tools',
    'Prep',
    'Console',
    'Macros',
] as const;
export type SetupTab = (typeof SETUP_TABS)[number];

const HINTS: Partial<Record<SetupTab, string>> = {
    File: 'Position, Tools, Prep, Console and Macros stay one tab away, no file required.',
};

/** The Setup-mode left column. Every body stays mounted (hidden when
 * inactive), as the old drawer did, so state survives tab switches. */
export default function SetupTabs({
    activeTab,
    onTabChange,
    fileActions,
    onOpenEditor,
}: {
    activeTab: SetupTab;
    onTabChange: (tab: SetupTab) => void;
    fileActions: FileActions;
    onOpenEditor: () => void;
}) {
    const { atcEnabled = false } = useWorkspaceState();
    const atcReport = useTypedSelector(
        (s: RootState) => (s.controller.settings.info as any)?.NEWOPT?.ATC,
    );
    // Same rule the drawer uses for its ATC tab
    const toolsVisible = atcEnabled || atcReport === '1';
    const tabs = SETUP_TABS.filter((t) => t !== 'Tools' || toolsVisible);

    useEffect(() => {
        if (!toolsVisible && activeTab === 'Tools') {
            onTabChange('Position');
        }
    }, [toolsVisible, activeTab]);

    const body = (tab: SetupTab) =>
        activeTab === tab ? 'flex flex-col flex-1 min-h-0' : 'hidden';

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div
                role="tablist"
                className="flex shrink-0 border-b border-outline-subtle"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            'flex-1 px-0.5 py-[9px] border-b-2 font-mono text-[9px] tracking-[0.04em] uppercase transition-colors',
                            activeTab === tab
                                ? 'text-content-primary border-robin-500 bg-robin-600/[0.12]'
                                : 'text-content-disabled border-transparent',
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className={body('File')}>
                <FileTab actions={fileActions} onOpenEditor={onOpenEditor} />
            </div>
            <div className={body('Position')}>
                <PositionTab />
            </div>
            {toolsVisible && (
                <div className={cn(body('Tools'), 'overflow-auto')}>
                    {/* Reused whole for now; the mockup's condensed ATC
                        layout is a follow-up (see CARVE_REDESIGN_SPEC §11) */}
                    <ATCPanel mode="expanded" />
                </div>
            )}
            <div className={body('Prep')}>
                <PrepTab />
            </div>
            {/* Desktop Console, positioned against this relative wrapper */}
            <div className={cn(body('Console'), 'relative p-2.5')}>
                <Console
                    isActive={activeTab === 'Console'}
                    isChildWindow={false}
                />
            </div>
            <div className={cn(body('Macros'), 'overflow-auto')}>
                <MacrosPanel mode="expanded" />
            </div>

            {HINTS[activeTab] && (
                <p className="m-0 px-2.5 pb-[9px] text-[10.5px] leading-snug text-content-disabled shrink-0">
                    {HINTS[activeTab]}
                </p>
            )}
        </div>
    );
}
