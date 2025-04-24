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

import styles from './index.module.styl';
import Instructions from 'app/features/Helper/components/Instructions';
import Stepper from 'app/features/Helper/components/Stepper';
import { useWizardContext } from 'app/features/Helper/context';
import cx from 'classnames';
import MinMaxButton from 'app/features/Helper/components/MinMaxButton';
import CancelButton from 'app/features/Helper/components/CancelButton';
import { CSSTransition } from 'react-transition-group';
import { FaHatWizard } from 'react-icons/fa';
import store from 'app/store';
import controller from 'app/lib/controller.ts';

// Fetch toolchange settings and send it to backend
export function updateToolchangeContext() {
    const hooks = store.get('workspace.toolChangeHooks', {});
    const options = store.get('workspace.toolChange', {});
    const toolChangeOption = store.get('workspace.toolChangeOption', 'Ignore');
    const context = {
        ...hooks,
        toolChangeOption,
        ...options,
    };
    controller.command('toolchange:context', context);
}

const Wizard = () => {
    const { title, visible, minimized, activeStep, overlay, steps } =
        useWizardContext();

    return (
        <>
            <div
                className={cx({
                    hidden: !visible,
                    [styles.overlay]: !minimized && overlay,
                })}
            />
            <div
                className={cx({
                    hidden: !visible,
                    'absolute top-1/2 left-4 w4/5 [transform:translate(0,-50%)] z-[9999] flex flex-col justify-between [transition:all_300ms_ease]':
                        !minimized,
                })}
            >
                <div
                    className={cx({
                        hidden: !visible || !overlay,
                        'px-1 py-4 flex flex-col justify-center items-center z-[9999] bg-amber-100 rounded content-start':
                            !minimized && overlay,
                    })}
                >
                    <div className="text-black text-center text-xl/relaxed font-bold z-[9999]">
                        Widgets are disabled
                    </div>
                    <div className="text-black text-center text-sm/relaxed z-[9999]">
                        Please use the button(s) in the wizard instead.
                    </div>
                </div>
                <div
                    className={cx({
                        hidden: !visible,
                        'absolute bg-white top-3 left-1/2 -translate-x-1/2 w-2/5 h-auto rounded [box-shadow:0px_20px_20px_-17px_rgba(255,159,16,0.73)] duration-300 ease-linear transition-all z-[9999]':
                            minimized,
                        'bg-white rounded flex h-[550px] flex-col content-end overflow-hidden z-[9999] duration-300 ease-linear transition-all':
                            !minimized,
                    })}
                >
                    <div className="border-b border-b-slate-400 p-2 flex flex-row justify-between items-center">
                        <h1 className="flex flex-row gap-2 items-center justify-center p-0 mr-4 text-slate-600 font-bold text-xl">
                            <FaHatWizard /> {title} - Step {activeStep + 1} of{' '}
                            {steps.length}
                        </h1>
                        <div className="flex">
                            <MinMaxButton />
                            <CancelButton />
                        </div>
                    </div>
                    <CSSTransition
                        key="wizContent"
                        timeout={350}
                        classNames={{
                            enterActive: styles.maximizeActive,
                            enterDone: styles.maximizeDone,
                            exitActive: styles.minimizeActive,
                            exitDone: styles.minimizeDone,
                        }}
                    >
                        <div
                            id="wizContent"
                            className={cx(
                                'flex flex-row h-[calc(100%-40px)] justify-items-stretch items-stretch justify-stretch flex-grow',
                                {
                                    hidden: minimized,
                                },
                            )}
                        >
                            <Stepper />
                            <Instructions />
                        </div>
                    </CSSTransition>
                </div>
            </div>
        </>
    );
};

export default Wizard;
