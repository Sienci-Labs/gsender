import Instructions from 'app/features/Helper/components/Instructions';
import { useWizardContext } from 'app/features/Helper/context';
import cn from 'classnames';
import { useState } from 'react';
import JogArea from '../setup/JogArea';

type View = 'guide' | 'jog';

/** The current step's instructions and actions (desktop Instructions), with
 * a Jog view for clearing chips or checking clearance mid-change. */
export default function TcRight() {
    const [view, setView] = useState<View>('guide');
    const { steps, activeStep, visible } = useWizardContext();
    const hasWizard = visible && steps.length > 0 && !!steps[0]?.title;

    return (
        <div className="flex flex-1 flex-col gap-2 min-h-0 p-2.5">
            <div className="flex items-center justify-between gap-2 shrink-0">
                <span className="font-mono text-[8.5px] font-bold tracking-[0.08em] uppercase text-purple-300 truncate">
                    {hasWizard ? steps[activeStep]?.title : 'Tool change'}
                </span>
                <div className="flex gap-[3px] p-0.5 rounded-sm border border-outline-subtle bg-surface-raised shrink-0">
                    {(['guide', 'jog'] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={cn(
                                'font-mono text-[7.5px] font-bold tracking-[0.03em] uppercase px-[7px] py-[3px] rounded-[3px]',
                                view === v
                                    ? 'bg-robin-500/20 text-robin-400'
                                    : 'text-content-disabled',
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
            {view === 'guide' ? (
                <div className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-lg border border-outline-subtle">
                    {hasWizard ? (
                        <Instructions />
                    ) : (
                        <p className="m-0 p-3 text-[10.5px] leading-normal text-content-muted">
                            No tool-change guide was loaded on the pendant. Use
                            Jog to position the machine if you need to.
                        </p>
                    )}
                </div>
            ) : (
                <JogArea className="flex-1" />
            )}
        </div>
    );
}
