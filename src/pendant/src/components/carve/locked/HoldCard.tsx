import { useUnlock } from '../../../hooks/useUnlock';
import UnlockCard from './UnlockCard';

/** Hold outside a job (panel 10): resume where motion stopped, or reset. */
export default function HoldCard() {
    const { handleUnlock, handleReset, unlockActionable } = useUnlock();

    return (
        <UnlockCard
            actions={[
                {
                    label: 'Resume (~)',
                    tone: 'unlock',
                    // Hold branch of the unlock handler sends cyclestart
                    onClick: handleUnlock,
                    disabled: !unlockActionable,
                },
                { label: 'Reset', tone: 'secondary', onClick: handleReset },
            ]}
        >
            <h3 className="m-0 text-[13px] font-bold text-content-primary">
                Hold
            </h3>
            <p className="m-0 text-[10.5px] leading-normal text-content-disabled">
                Resume to continue from where motion stopped, or reset to drop
                the hold and return to Idle.
            </p>
        </UnlockCard>
    );
}
