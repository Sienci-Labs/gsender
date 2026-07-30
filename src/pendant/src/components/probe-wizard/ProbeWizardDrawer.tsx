import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, Play, Ruler, Move3D, Repeat } from 'lucide-react';

import { toast } from 'app/lib/toaster';
import ProbeDiameter from '@gsender/features/Probe/ProbeDiameter';
import { Actions, ProbeCommand, State } from '@gsender/features/Probe/definitions';

import { ContinuityCheck } from './ContinuityCheck';
import { ContinuityPhase } from './ContinuityIndicator';
import CornerSelector from './CornerSelector';

const CORNER_LABELS = ['Bottom left', 'Top left', 'Top right', 'Bottom right'];

const formatDiameter = (diameter: number, units: string, probeType?: string): string => {
    if (probeType === 'Auto' || probeType === 'Tip') return probeType;
    return `${diameter}${units}`;
};

interface ProbeWizardDrawerProps {
    step: number;
    onStepChange: (step: number) => void;
    maxReached: number;
    onMaxReachedChange: (maxReached: number) => void;
    direction: number;
    onDirectionChange: (direction: number) => void;
    toolDiameter: number;
    units: string;
    actions: Actions;
    state: State;
    probeCmd: ProbeCommand;
    skipContinuity: boolean;
    onRunComplete: (direction: number, diameter: number) => void;
}

export default function ProbeWizardDrawer({
    step,
    onStepChange,
    maxReached,
    onMaxReachedChange,
    direction,
    onDirectionChange,
    toolDiameter,
    units,
    actions,
    state,
    probeCmd,
    skipContinuity,
    onRunComplete,
}: ProbeWizardDrawerProps) {
    const [continuityPhase, setContinuityPhase] = useState<ContinuityPhase>(
        skipContinuity ? 'success' : 'checking-idle',
    );

    const goToStep = (target: number) => {
        if (target > maxReached) return;
        onStepChange(target);
    };

    const handleNext = () => {
        const next = step + 1;
        onStepChange(next);
        if (next > maxReached) onMaxReachedChange(next);
    };

    const handleBack = () => {
        onStepChange(Math.max(0, step - 1));
    };

    const handleContinuityComplete = () => {
        const next = 2;
        onStepChange(next);
        if (next > maxReached) onMaxReachedChange(next);
    };

    const handleStartProbe = () => {
        const commands = actions.generateProbeCommands();
        actions.runProbeCommands(commands);
        onRunComplete(direction, toolDiameter);
        const cornerLabel = CORNER_LABELS[direction] ?? 'Unknown';
        toast.info(
            `Probing cycle started: ${cornerLabel}, ${formatDiameter(toolDiameter, units, state.probeType)}, ${probeCmd?.id ?? ''}`,
            { position: 'bottom-right' },
        );
        onStepChange(0);
        onMaxReachedChange(0);
    };

    const cornerLabel = CORNER_LABELS[direction] ?? 'Unknown';
    const canProceedStep2 = continuityPhase === 'success';

    return (
        <div className="flex flex-col h-full rounded-xl border border-robin-200 dark:border-dark-lighter bg-white dark:bg-dark overflow-hidden">
            {/* Header */}
            <div className="shrink-0 px-4 pt-3 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-robin-600 dark:text-robin-400">
                    Step {step + 1} of 3
                </p>
                <div className="flex gap-1.5 mt-1.5">
                    {[0, 1, 2].map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goToStep(i)}
                            disabled={i > maxReached}
                            className={clsx(
                                'h-1.5 flex-1 rounded-full transition-colors',
                                i <= step
                                    ? 'bg-robin-500'
                                    : 'bg-gray-200 dark:bg-gray-700',
                                i > maxReached && 'cursor-default',
                            )}
                        />
                    ))}
                </div>
            </div>

                {/* Steps track */}
                <div className="flex-1 overflow-hidden">
                    <div
                        className="flex h-full"
                        style={{
                            width: '300%',
                            transform: `translateX(-${step * 33.3333}%)`,
                            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {/* Step 1 */}
                        <div className="w-1/3 h-full overflow-y-auto px-5 py-4 flex flex-col gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    Probe diameter
                                </p>
                                {probeCmd?.tool ? (
                                    <ProbeDiameter
                                        actions={actions}
                                        state={state}
                                        probeCommand={probeCmd}
                                    />
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        Not needed for the {probeCmd?.id ?? 'current'} routine. Choose XY, XYZ, X, or Y in the routine selector to set a diameter.
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    Corner
                                </p>
                                <CornerSelector
                                    direction={direction}
                                    onChange={onDirectionChange}
                                />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="w-1/3 h-full overflow-y-auto px-5 py-4">
                            <ContinuityCheck
                                onComplete={handleContinuityComplete}
                                onPhaseChange={setContinuityPhase}
                            />
                        </div>

                        {/* Step 3 */}
                        <div className="w-1/3 h-full overflow-y-auto px-5 py-4 flex flex-col gap-5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    Ready to run
                                </span>
                            </div>

                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => goToStep(0)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                >
                                    <Ruler size={18} className="text-gray-400 shrink-0" />
                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                        Probe diameter
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDiameter(toolDiameter, units, state.probeType)}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToStep(0)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                >
                                    <Move3D size={18} className="text-gray-400 shrink-0" />
                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                        Corner
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {cornerLabel}
                                    </span>
                                </button>
                                <div className="w-full flex items-center gap-3 px-4 py-3">
                                    <Repeat size={18} className="text-gray-400 shrink-0" />
                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                        Routine
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {probeCmd?.id ?? '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1" />

                            <div>
                                <button
                                    type="button"
                                    onClick={handleStartProbe}
                                    className="probe-start-btn w-full h-[104px] rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-2xl flex items-center justify-center gap-3"
                                >
                                    <Play size={26} fill="white" />
                                    Start probe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {step < 2 && (
                    <div className="shrink-0 px-5 py-3 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={step === 0}
                            className="w-11 h-11 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        {step === 0 && (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 h-11 rounded-lg bg-robin-600 hover:bg-robin-500 text-white font-semibold"
                            >
                                Next
                            </button>
                        )}
                        {step === 1 && (
                            <button
                                type="button"
                                disabled={!canProceedStep2}
                                className="flex-1 h-11 rounded-lg bg-robin-600 hover:bg-robin-500 text-white font-semibold disabled:opacity-40 disabled:cursor-default"
                            >
                                {canProceedStep2 ? 'Continue' : 'Waiting for continuity…'}
                            </button>
                        )}
                    </div>
                )}
                {step === 2 && (
                    <div className="shrink-0 px-5 py-3 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-11 h-11 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                )}

            <style>{`
                @keyframes probe-start-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.35); }
                    50% { box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
                }
                .probe-start-btn {
                    animation: probe-start-glow 2.4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
