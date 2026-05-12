import React from 'react';
import cx from 'classnames';
import { Check } from 'lucide-react';
import { useWizardContext } from 'app/features/Helper/context';

const Stepper = () => {
    const { steps, activeStep, activeSubstep } = useWizardContext();

    return (
        <div className="w-[230px] shrink-0 border-r border-gray-200 dark:border-[#2a2a35] bg-gray-50 dark:bg-[#141418] overflow-y-auto">
            {steps.map((step, si) => {
                const stepDone   = si < activeStep;
                const stepActive = si === activeStep;

                return (
                    <div key={si}>
                        {/* Step group header */}
                        <div className="flex items-start gap-1.5 px-3 pt-2.5 pb-1.5">
                            <div className={cx(
                                'w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 mt-px',
                                stepDone
                                    ? 'bg-emerald-100 dark:bg-[#052e16] text-emerald-700 dark:text-[#6ee7b7]'
                                    : stepActive
                                        ? 'bg-blue-100 dark:bg-[#1e2a4a] text-blue-700 dark:text-blue-400'
                                        : 'bg-gray-200 dark:bg-[#23232d] text-gray-500 dark:text-[#4b5563]'
                            )}>
                                {stepDone ? <Check size={9} /> : si + 1}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className={cx(
                                    'text-xs font-medium leading-snug',
                                    stepDone
                                        ? 'text-emerald-600 dark:text-[#9ca3af]'
                                        : stepActive
                                            ? 'text-blue-700 dark:text-blue-400'
                                            : 'text-gray-400 dark:text-[#9ca3af]'
                                )}>
                                    {step.title}
                                </span>
                                {step.firstRunOnly && (
                                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-[#2a1e00] text-amber-800 dark:text-amber-400">
                                        First run only
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Substep rows — only when there are multiple substeps */}
                        {step.substeps.length > 1 && step.substeps.map((sub, ssi) => {
                            const subActive = si === activeStep && ssi === activeSubstep;
                            const subDone   = si < activeStep || (si === activeStep && ssi < activeSubstep);

                            return (
                                <div key={ssi} className={cx(
                                    'flex items-center gap-2 px-3 py-1.5 pl-3.5 border-l-2 cursor-default select-none',
                                    subActive
                                        ? 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50 dark:bg-[#1a1f30]'
                                        : 'border-l-transparent'
                                )}>
                                    <div className={cx(
                                        'w-1.5 h-1.5 rounded-full shrink-0 ml-1',
                                        subDone
                                            ? 'bg-emerald-500'
                                            : subActive
                                                ? 'bg-blue-500 dark:bg-blue-400'
                                                : 'bg-gray-300 dark:bg-[#2a2a35]'
                                    )} />
                                    <span className={cx(
                                        'text-xs leading-snug',
                                        subDone
                                            ? 'text-gray-500 dark:text-[#9ca3af]'
                                            : subActive
                                                ? 'font-medium text-blue-700 dark:text-blue-300'
                                                : 'text-gray-400 dark:text-[#9ca3af]'
                                    )}>
                                        {sub.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default Stepper;
