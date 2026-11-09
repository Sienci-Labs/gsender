import { GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import CancelButton from 'app/features/Helper/components/CancelButton';
import { useWizardAPI, useWizardContext } from 'app/features/Helper/context';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import cn from 'classnames';

type ActiveValues = { activeStep: number; activeSubstep: number };
import { Check } from 'lucide-react';

/** Step list plus Back / dots / Next, on the desktop wizard's handlers and
 * disable rules (Stepper.tsx, Controls.tsx), re-skinned. */
export default function TcLeft() {
    const {
        completeSubStep,
        decrementStep,
        scrollToActiveStep,
        hasIncompleteActions,
        updateSubstepOverlay,
    } = useWizardAPI();
    const { steps, activeStep, activeSubstep, visible, title } =
        useWizardContext();
    const activeState = useTypedSelector(
        (s: RootState) => s.controller.state.status?.activeState ?? '',
    );

    if (!visible || steps.length === 0 || !steps[0]?.title) {
        return (
            <div className="flex flex-1 flex-col justify-center gap-2 p-3.5">
                <span className="text-[12.5px] font-bold text-purple-200">
                    Tool change
                </span>
                <p className="m-0 text-[11px] leading-normal text-content-disabled">
                    The controller is waiting on a tool change. Follow the steps
                    on gSender, then resume the job.
                </p>
            </div>
        );
    }

    const isNotIdle = activeState !== GRBL_ACTIVE_STATE_IDLE;
    const isFirst = activeStep === 0 && activeSubstep === 0;
    const isLastSubstep =
        activeStep === steps.length - 1 &&
        activeSubstep === (steps[activeStep]?.substeps?.length ?? 1) - 1;
    const allSubsteps = steps.flatMap((s, si) =>
        s.substeps.map((_: unknown, ssi: number) => ({ si, ssi })),
    );
    const flatCurrent = allSubsteps.findIndex(
        ({ si, ssi }) => si === activeStep && ssi === activeSubstep,
    );

    return (
        <div className="flex flex-1 flex-col min-h-0 p-2.5">
            <div className="flex items-center justify-between gap-2 pb-1.5 shrink-0">
                <span className="font-mono text-[8.5px] font-bold tracking-[0.08em] uppercase text-purple-300 truncate">
                    {title}
                </span>
                <CancelButton />
            </div>
            <div className="flex flex-1 flex-col gap-[3px] overflow-auto min-h-0">
                {steps.map((step, si) => {
                    const done = si < activeStep;
                    const active = si === activeStep;
                    return (
                        <div
                            key={si}
                            className="flex items-center gap-[7px] py-1"
                        >
                            <span
                                className={cn(
                                    'w-4 h-4 shrink-0 rounded-full flex items-center justify-center font-mono text-[8.5px] font-bold',
                                    done && 'bg-state-run/20 text-state-run',
                                    active &&
                                        'bg-state-tool/30 text-purple-200',
                                    !done &&
                                        !active &&
                                        'bg-surface-elevated text-content-disabled',
                                )}
                            >
                                {done ? (
                                    <Check className="w-2.5 h-2.5" />
                                ) : (
                                    si + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-[10.5px] font-semibold',
                                    done && 'text-content-muted',
                                    active && 'text-purple-200 font-bold',
                                    !done && !active && 'text-content-disabled',
                                )}
                            >
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center justify-between gap-1.5 pt-2 mt-2 border-t border-outline-subtle shrink-0">
                <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => {
                        const activeValues = decrementStep() as ActiveValues;
                        updateSubstepOverlay(activeValues);
                        scrollToActiveStep(activeValues);
                    }}
                    className="font-mono text-[8.5px] font-bold tracking-[0.03em] uppercase px-[9px] py-[5px] rounded-sm border border-outline-strong text-content-disabled disabled:opacity-35"
                >
                    Back
                </button>
                <span className="flex gap-[3px] min-w-0 overflow-hidden">
                    {allSubsteps.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                'w-[11px] h-[3px] rounded-sm shrink-0',
                                i === flatCurrent
                                    ? 'bg-purple-300'
                                    : 'bg-outline-subtle',
                            )}
                        />
                    ))}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        const activeValues = completeSubStep() as ActiveValues;
                        updateSubstepOverlay(activeValues);
                        scrollToActiveStep(activeValues);
                    }}
                    disabled={hasIncompleteActions() || isNotIdle}
                    className="font-mono text-[8.5px] font-bold tracking-[0.03em] uppercase px-2.5 py-[5px] rounded-sm bg-state-tool text-white disabled:opacity-35"
                >
                    {isLastSubstep ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
}
