import OverrideFaders from './OverrideFaders';
import RapidPresets from './RapidPresets';

/** Live overrides for a running or paused job (panels 07, 11). */
export default function RunLeft() {
    return (
        <div className="flex flex-col flex-1 min-h-0 gap-[9px] px-2.5 pt-3 pb-[9px]">
            <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-content-primary mt-0.5">
                Overrides · live
            </p>
            <OverrideFaders />
            <RapidPresets />
        </div>
    );
}
