import GcodeEditor from 'app/features/Visualizer/GcodeEditor';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import { useState } from 'react';
import { GCODE_ACCEPT, useFileActions } from '../../hooks/useFileActions';
import { useAlarmMessage } from '../../hooks/useAlarmMessage';
import { isHomingAlarm } from './carveMode';
import type { CarveMode } from './carveMode';
import AlarmHelperCard from './locked/AlarmHelperCard';
import HoldCard from './locked/HoldCard';
import LockedNotice from './locked/LockedNotice';
import RunLeft from './run/RunLeft';
import RunRight from './run/RunRight';
import JogArea from './setup/JogArea';
import SetupTabs, { type SetupTab } from './setup/SetupTabs';
import TcLeft from './toolchange/TcLeft';
import TcRight from './toolchange/TcRight';
import VizStage from './viz/VizStage';

const LOCKED_TABS = 'File, Position, Tools, Prep, Console, Macros and jogging';

const firstSentence = (text: unknown): string | null => {
    if (typeof text !== 'string' || !text) return null;
    const match = text.match(/^.*?[.!?](\s|$)/);
    return (match ? match[0] : text).trim();
};

function AlarmReason() {
    const alarmCode = useTypedSelector(
        (s: RootState) => s.controller.state.status?.alarmCode ?? 0,
    );
    const message = useAlarmMessage();

    if (isHomingAlarm(alarmCode)) {
        return (
            <>
                Homing is required before any motion. {LOCKED_TABS} stay hidden
                until it's homed.
            </>
        );
    }
    if (Number(alarmCode) === 2) {
        return (
            <>
                The last jog crossed a soft limit. {LOCKED_TABS} stay hidden
                until the alarm clears.
            </>
        );
    }
    const reason = firstSentence(message?.description);
    return (
        <>
            {reason ? `${reason} ` : ''}
            {LOCKED_TABS} stay hidden until the alarm clears.
        </>
    );
}

/** The carve screen body: visualizer stage over a two-column area whose
 * contents follow the CarveMode (CARVE_REDESIGN_SPEC.md §3). */
export default function CarveScreen({ mode }: { mode: CarveMode }) {
    const fileActions = useFileActions();
    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const [activeTab, setActiveTab] = useState<SetupTab>(() =>
        fileLoaded ? 'Position' : 'File',
    );
    const [editorOpen, setEditorOpen] = useState(false);

    const isSetup = mode === 'setup' || mode === 'disconnected';
    const isRun = mode === 'running' || mode === 'holdJob';

    const handleLoadFromChip = () => {
        setActiveTab('File');
        void fileActions.handleLoadClick();
    };

    return (
        <div className="relative flex flex-1 flex-col min-h-0 bg-surface-base font-sans text-content-primary">
            <input
                ref={fileActions.fileInputRef}
                type="file"
                accept={GCODE_ACCEPT}
                className="hidden"
                onChange={fileActions.handleFileChange}
            />

            <VizStage
                mode={mode}
                onLoadFile={handleLoadFromChip}
                onCloseFile={fileActions.handleUnload}
            />

            <div className="relative flex flex-1 min-h-0">
                <div className="flex flex-col basis-[44%] shrink-0 min-h-0 border-r border-outline-subtle">
                    {/* Setup tabs stay mounted through a job so the chosen
                        tab and any tab state survive */}
                    <div
                        className={
                            isSetup ? 'flex flex-col flex-1 min-h-0' : 'hidden'
                        }
                    >
                        <SetupTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            fileActions={fileActions}
                            onOpenEditor={() => setEditorOpen(true)}
                        />
                    </div>
                    {isRun && <RunLeft />}
                    {mode === 'alarm' && (
                        <LockedNotice tone="alarm">
                            <AlarmReason />
                        </LockedNotice>
                    )}
                    {mode === 'holdIdle' && (
                        <LockedNotice tone="hold">
                            Feed hold is engaged with no job running.{' '}
                            {LOCKED_TABS} stay hidden until the hold clears.
                        </LockedNotice>
                    )}
                    {mode === 'toolchange' && <TcLeft />}
                </div>

                <div className="flex flex-col flex-1 min-w-0 min-h-0">
                    {isSetup && <JogArea className="flex-1 p-2.5" />}
                    {isRun && <RunRight />}
                    {mode === 'alarm' && (
                        <div className="flex flex-col flex-1 min-h-0 p-2.5">
                            <AlarmHelperCard />
                        </div>
                    )}
                    {mode === 'holdIdle' && (
                        <div className="flex flex-col flex-1 min-h-0 p-2.5">
                            <HoldCard />
                        </div>
                    )}
                    {mode === 'toolchange' && <TcRight />}
                </div>

                {editorOpen && fileLoaded && (
                    // Full-height sheet over both columns
                    <div className="absolute inset-0 z-30 flex flex-col p-2.5 bg-surface-base">
                        <div className="flex-1 min-h-0 rounded-lg border border-outline-subtle bg-surface-elevated overflow-hidden">
                            <GcodeEditor onClose={() => setEditorOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
