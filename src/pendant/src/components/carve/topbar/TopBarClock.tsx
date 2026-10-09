import { useClock } from '../../../hooks/useClock';

export default function TopBarClock() {
    const time = useClock();
    return (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-semibold tracking-[0.03em] text-content-secondary pointer-events-none tabular-nums">
            {time}
        </span>
    );
}
