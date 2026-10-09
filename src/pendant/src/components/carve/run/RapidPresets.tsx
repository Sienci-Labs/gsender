import controller from 'app/lib/controller';
import cn from 'classnames';
import { useOverrides } from '../../../hooks/useOverrides';

const PRESETS = [25, 50, 100] as const;

/** grbl's three rapid override steps; the active one comes from status.ov[1]. */
export default function RapidPresets() {
    const { isConnected, ovR } = useOverrides();
    const active = PRESETS.includes(ovR as (typeof PRESETS)[number])
        ? ovR
        : 100;

    return (
        <div className="shrink-0 mt-1">
            <p className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-content-disabled mt-0.5 mb-[5px]">
                Rapid
            </p>
            <div className="flex gap-[7px]">
                {PRESETS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        disabled={!isConnected}
                        onClick={() =>
                            controller.command('rapidOverride', value)
                        }
                        className={cn(
                            'flex-1 h-8 rounded-md border font-mono text-[11px] font-bold transition-colors disabled:opacity-50',
                            active === value
                                ? 'bg-blue-600 border-transparent text-white'
                                : 'border-outline-strong text-content-secondary active:bg-surface-hover',
                        )}
                    >
                        {value}%
                    </button>
                ))}
            </div>
        </div>
    );
}
