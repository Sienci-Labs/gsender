import { homeMachine } from 'app/features/DRO/utils/DRO';
import cn from 'classnames';
import { House } from 'lucide-react';
import { useDroGating } from '../hooks/useDroGating';
import HoldButton from './carve/setup/HoldButton';

/** "Home machine" call to action. Renders nothing once the controller
 * reports the machine as homed (or homing is disabled). Hold to activate so
 * a stray tap can't start motion. */
export default function HomeCTA({
    className,
    iconClassName = 'w-[18px] h-[18px]',
}: {
    className?: string;
    iconClassName?: string;
}) {
    const { needsHoming, canHome } = useDroGating();
    if (!needsHoming) return null;

    return (
        <HoldButton
            onActivate={homeMachine}
            disabled={!canHome}
            aria-label="Hold to home machine"
            fillClassName="bg-white/40"
            holdingClassName="ring-2 ring-amber-200"
            className={cn(
                'gap-2 rounded-md border border-transparent font-mono font-bold tracking-[0.06em] uppercase',
                canHome
                    ? 'bg-amber-500 text-gray-950 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]'
                    : 'bg-surface-disabled text-content-disabled',
                className,
            )}
        >
            <House
                className={cn('shrink-0', iconClassName)}
                strokeWidth={2.5}
            />
            Home
        </HoldButton>
    );
}
