import { ResourceBlock } from 'app/features/Helper/components/message/ResourceBlock';
import { SeverityBadge } from 'app/features/Helper/components/message/SeverityBadge';
import { StepsList } from 'app/features/Helper/components/message/StepsList';
import { getEyebrow } from 'app/features/Helper/messages/normalize';
import type { NormalizedHelperMessage } from 'app/features/Helper/messages/types';
import { useAlarmMessage } from '../../../hooks/useAlarmMessage';
import { useUnlock } from '../../../hooks/useUnlock';
import UnlockCard, { type UnlockAction } from './UnlockCard';

/** The helper registry's alarm message, inline rather than as a popup. The
 * header is re-skinned because MessageHeader needs a Dialog around it. */
function AlarmMessage({ message }: { message: NormalizedHelperMessage }) {
    return (
        <>
            <div className="flex items-center gap-2.5">
                <SeverityBadge kind={message.kind} size="md" />
                <div className="flex flex-col gap-px min-w-0">
                    <span className="font-mono text-[8.5px] font-bold tracking-[0.08em] uppercase text-state-alarm">
                        {getEyebrow(message)}
                    </span>
                    <span className="text-[14.5px] font-bold text-content-primary">
                        {message.title}
                    </span>
                </div>
            </div>
            {message.description && (
                <div className="m-0 text-[11px] leading-[1.55] text-content-muted">
                    {message.description}
                </div>
            )}
            {message.steps && message.steps.length > 0 && (
                <StepsList steps={message.steps} />
            )}
        </>
    );
}

/** The alarm's guide (QR + Open guide), shown under the left-column lock
 * notice so the right-hand card doesn't have to scroll. */
export function AlarmResource() {
    const message = useAlarmMessage();
    if (!message?.resource) return null;
    return <ResourceBlock resource={message.resource} variant="column" />;
}

export default function AlarmHelperCard() {
    const message = useAlarmMessage();
    const { isHomingAlarm, handleUnlock, handleReset } = useUnlock();

    // Same handler as the old top-bar Unlock: on the homing alarm it homes
    const actions: UnlockAction[] = [
        isHomingAlarm
            ? { label: 'Home ($H)', tone: 'home', onClick: handleUnlock }
            : { label: 'Unlock ($X)', tone: 'unlock', onClick: handleUnlock },
        { label: 'Reset', tone: 'secondary', onClick: handleReset },
    ];

    return (
        <UnlockCard actions={actions}>
            {message ? (
                <AlarmMessage message={message} />
            ) : (
                <>
                    <h3 className="m-0 text-[13px] font-bold text-content-primary">
                        Alarm
                    </h3>
                    <p className="m-0 text-[10.5px] leading-normal text-content-disabled">
                        The controller is in an alarm state. Unlock to clear it,
                        or reset the controller.
                    </p>
                </>
            )}
        </UnlockCard>
    );
}
