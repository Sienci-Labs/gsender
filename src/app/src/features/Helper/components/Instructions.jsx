/*
 * Copyright (C) 2022 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useWizardContext } from 'app/features/Helper/context';
import Substep from 'app/features/Helper/components/Substep';

const Instructions = () => {
    const { steps, intro, activeStep, activeSubstep } = useWizardContext();
    const step = steps[activeStep];
    if (!step) return null;
    const substep = step.substeps[activeSubstep];
    if (!substep) return null;

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white dark:bg-[#18181f]">
            {intro && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-50 dark:bg-[#052e16] text-emerald-800 dark:text-[#6ee7b7] text-xs">
                    <CheckCircle size={13} className="shrink-0" />
                    {intro}
                </div>
            )}
            <Substep
                step={substep}
                index={activeSubstep}
                stepIndex={activeStep}
                firstRunOnly={step.firstRunOnly && activeSubstep === 0}
            />
        </div>
    );
};

export default Instructions;
