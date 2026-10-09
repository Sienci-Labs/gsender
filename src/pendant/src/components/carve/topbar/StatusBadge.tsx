import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_DOOR,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_HOME,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_SLEEP,
    GRBL_ACTIVE_STATE_TOOL,
} from 'app/constants';
import { useWizardContext } from 'app/features/Helper/context';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { isIPv4 } from 'app/lib/utils';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';
import {
    Check,
    ChevronDown,
    CircleCheck,
    DoorClosed,
    House,
    Moon,
    Move,
    Network,
    Pause,
    Play,
    TriangleAlert,
    Usb,
    Wrench,
} from 'lucide-react';
import type { ComponentType } from 'react';
import ConnectionWidget, {
    type ConnectedTriggerProps,
} from '../../ConnectionWidget';
import type { CarveMode } from '../carveMode';
import { useAlarmHeadline } from './useAlarmHeadline';

type Tone = 'idle' | 'run' | 'hold' | 'alarm' | 'tool';

// Labels follow PendantTopBar's map, with Running shortened to Run and the
// tool-change state spelled out to fit the wider badge.
const STATE_LABELS: Record<
    string,
    { label: string; icon: ComponentType<{ className?: string }> }
> = {
    [GRBL_ACTIVE_STATE_IDLE]: { label: 'Idle', icon: Check },
    [GRBL_ACTIVE_STATE_RUN]: { label: 'Run', icon: Play },
    [GRBL_ACTIVE_STATE_JOG]: { label: 'Jogging', icon: Move },
    [GRBL_ACTIVE_STATE_CHECK]: { label: 'Check', icon: CircleCheck },
    [GRBL_ACTIVE_STATE_HOME]: { label: 'Homing', icon: House },
    [GRBL_ACTIVE_STATE_HOLD]: { label: 'Hold', icon: Pause },
    [GRBL_ACTIVE_STATE_DOOR]: { label: 'Door', icon: DoorClosed },
    [GRBL_ACTIVE_STATE_ALARM]: { label: 'Alarm', icon: TriangleAlert },
    [GRBL_ACTIVE_STATE_TOOL]: { label: 'Tool change', icon: Wrench },
    [GRBL_ACTIVE_STATE_SLEEP]: { label: 'Sleep', icon: Moon },
};

const BADGE_TONE: Record<Tone, string> = {
    idle: 'border-outline-strong bg-surface-raised',
    run: 'border-state-run/50 bg-state-run/[0.08] badge-animate-run motion-reduce:animate-none',
    hold: 'border-state-hold/50 bg-state-hold/[0.08]',
    alarm: 'border-state-alarm/55 bg-state-alarm/10 badge-animate-alarm motion-reduce:animate-none',
    tool: 'border-state-tool/50 bg-state-tool/10',
};

const TILE_TONE: Record<Tone, string> = {
    idle: 'bg-state-idle text-white',
    run: 'bg-state-run text-white',
    hold: 'bg-state-hold text-content-inverse',
    alarm: 'bg-state-alarm text-white',
    tool: 'bg-state-tool text-white',
};

function toneFor(mode: CarveMode, activeState: string): Tone {
    switch (mode) {
        case 'toolchange':
            return 'tool';
        case 'alarm':
            return 'alarm';
        case 'holdJob':
        case 'holdIdle':
            return 'hold';
        case 'running':
            return 'run';
        default:
            return activeState === GRBL_ACTIVE_STATE_JOG ? 'run' : 'idle';
    }
}

const toolLabel = (tool: unknown): string | null => {
    const value = Array.isArray(tool) ? tool[0] : tool;
    if (value === undefined || value === null || value === '') return null;
    const text = String(value).trim();
    return text.toUpperCase().startsWith('T') ? text : `T${text}`;
};

function useBadgeText(mode: CarveMode) {
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );
    const currentTool = useTypedSelector(
        (s: RootState) =>
            (s.controller.state.status as any)?.currentTool ??
            (s.controller.state as any)?.parserstate?.modal?.tool,
    );
    const { toolchangeContext } = useWizardContext();
    const alarm = useAlarmHeadline(mode);

    const entry =
        mode === 'toolchange'
            ? STATE_LABELS[GRBL_ACTIVE_STATE_TOOL]
            : (STATE_LABELS[activeState] ??
              (mode === 'holdJob'
                  ? STATE_LABELS[GRBL_ACTIVE_STATE_HOLD]
                  : STATE_LABELS[GRBL_ACTIVE_STATE_IDLE]));

    // In alarm the badge just names the code; the description lives in the
    // centre slot (TopBarClock)
    let sub: string | null = null;
    if (mode === 'toolchange') {
        const from = toolLabel(currentTool);
        const to = toolLabel(
            toolchangeContext?.tool ??
                (toolchangeContext?.modal as Record<string, unknown>)?.tool,
        );
        if (from && to && from !== to) sub = `${from} → ${to}`;
        else if (to) sub = to;
    }

    return {
        tone: toneFor(mode, activeState),
        label: alarm?.label ?? entry.label,
        Icon: entry.icon,
        sub,
    };
}

function ConnectedBadge({
    mode,
    trigger,
}: {
    mode: CarveMode;
    trigger: ConnectedTriggerProps;
}) {
    const { tone, label, Icon, sub } = useBadgeText(mode);
    const PortIcon = isIPv4(trigger.displayPort) ? Network : Usb;

    return (
        <button
            type="button"
            onPointerDown={trigger.onPointerDown}
            onPointerUp={trigger.onPointerUp}
            onPointerLeave={trigger.onPointerLeave}
            onPointerCancel={trigger.onPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={`${trigger.firmware} on ${trigger.displayPort}, ${label}. Tap for details, hold to disconnect.`}
            className={cn(
                'relative flex items-center h-8 shrink-0 rounded-lg border-[1.5px] overflow-hidden touch-none select-none text-left',
                tone === 'tool' ? 'w-[206px]' : 'w-[178px]',
                BADGE_TONE[tone],
            )}
        >
            {trigger.holding && (
                <span
                    className="absolute inset-y-0 left-0 bg-action-stop/80"
                    style={{ width: `${trigger.progress * 100}%` }}
                />
            )}
            <span className="relative flex items-center gap-1 shrink-0 pl-2 pr-1.5 text-blue-500">
                <PortIcon className="w-3 h-3" aria-hidden />
                <span className="font-mono text-[10px] text-content-muted whitespace-nowrap max-w-[52px] truncate">
                    {trigger.displayPort}
                </span>
            </span>
            <span className="relative w-px h-[18px] bg-outline-subtle shrink-0" />
            <span className="relative flex items-center gap-1.5 flex-1 min-w-0 pl-[7px] pr-1">
                <span
                    className={cn(
                        'w-5 h-5 rounded-sm shrink-0 flex items-center justify-center',
                        TILE_TONE[tone],
                    )}
                >
                    <Icon className="w-3 h-3" />
                </span>
                <span className="flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-[14px] text-content-primary truncate">
                        {label}
                    </span>
                    {sub && (
                        <span className="text-[8px] leading-[9px] text-content-muted truncate">
                            {sub}
                        </span>
                    )}
                </span>
            </span>
            <ChevronDown
                className={cn(
                    'relative w-3 h-3 shrink-0 mr-[5px] text-content-muted transition-transform',
                    trigger.infoOpen && 'rotate-180',
                )}
                aria-hidden
            />
        </button>
    );
}

/** Connection + machine state in one badge. Connecting, hold-to-disconnect
 * and the port / info dropdowns all come from ConnectionWidget. */
export default function StatusBadge({ mode }: { mode: CarveMode }) {
    return (
        <ConnectionWidget
            compact
            renderConnected={(trigger) => (
                <ConnectedBadge mode={mode} trigger={trigger} />
            )}
        />
    );
}
