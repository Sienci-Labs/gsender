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

import Instructions from 'app/features/Helper/components/Instructions';
import Stepper from 'app/features/Helper/components/Stepper';
import Controls from 'app/features/Helper/components/Controls';
import { useWizardContext } from 'app/features/Helper/context';
import MinMaxButton from 'app/features/Helper/components/MinMaxButton';
import CancelButton from 'app/features/Helper/components/CancelButton';
import { Wrench } from 'lucide-react';
import store from 'app/store';
import controller from 'app/lib/controller.ts';

// Fetch toolchange settings and send it to backend
export function updateToolchangeContext(mappings = null) {
    const hooks = store.get('workspace.toolChangeHooks', {});
    const options = store.get('workspace.toolChange', {});
    const toolChangeOption = store.get('workspace.toolChangeOption', 'Ignore');
    const context = {
        ...hooks,
        toolChangeOption,
        ...options,
    };

    if (mappings) {
        const plainObject = Array.from(mappings).reduce(
            (obj, [key, value]) => {
                obj[key] = value;
                return obj;
            },
            {} as Record<number, number>,
        );

        context.mappings = plainObject;
    }

    controller.command('toolchange:context', context);
}

const Wizard = () => {
    const { title, visible, minimized, activeStep, steps } =
        useWizardContext();

    if (!visible) return null;

    return (
        <>
            {/* Backdrop — blocks jog controls / DRO widgets when modal is open */}
            {!minimized && (
                <div className="fixed inset-0 bg-black/55 z-[199] pointer-events-auto" />
            )}

            <div className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none">
                <div className="pointer-events-auto w-[640px] rounded-lg overflow-hidden shadow-2xl border border-gray-300/50 dark:border-[#2a2a35] bg-white dark:bg-[#18181f]">

                    {/* Titlebar */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-[#2a2a35] bg-gray-100 dark:bg-[#111116]">
                        <div className="flex items-center gap-2">
                            <Wrench size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-[#e5e5ea]">
                                {title}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                Step {activeStep + 1} of {steps.length}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <MinMaxButton />
                            <CancelButton />
                        </div>
                    </div>

                    {/* Body */}
                    {!minimized && (
                        <div className="flex h-[330px]">
                            <Stepper />
                            <Instructions />
                        </div>
                    )}

                    {/* Footer */}
                    {!minimized && <Controls />}
                </div>
            </div>
        </>
    );
};

export default Wizard;
