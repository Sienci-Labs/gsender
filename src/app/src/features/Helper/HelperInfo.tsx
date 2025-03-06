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
import { useWizardContext, useWizardAPI } from 'app/features/Helper/context';
import cx from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';
import reduxStore from 'app/store/redux';
import { disableHelper } from 'app/store/redux/slices/helper.slice.ts';

const HelperInfo = ({ payload }) => {
    const { visible, minimized } = useWizardContext();
    const { setVisible } = useWizardAPI();
    const { title, description } = payload;

    const closeHelper = () => {
        setVisible(false);
        reduxStore.dispatch(disableHelper());
    };

    return (
        <>
            <div
                className={cx({
                    [styles.hidden]: !visible,
                    'absolute top-1/3 left-4 w-1/2 -translate-y-2/3 z-50 flex flex-col justify-between':
                        !minimized,
                })}
            >
                <div
                    className={cx({
                        [styles.hidden]: !visible,
                        [styles.minimizedWrapper]: minimized,
                        'bg-white rounded flex flex-col content-end overflow-hidden z-50':
                            !minimized,
                    })}
                >
                    <div className={styles.wizardTitle}>
                        <h1 className="flex flex-row gap-2 items-center justify-center">
                            <FaInfoCircle /> {title}
                        </h1>
                        <div className="flex cursor-pointer">
                            <FaTimes onClick={() => closeHelper()} />
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
                                'flex p-4 justify-stretch items-stretch flex-grow',
                                {
                                    [styles.hidden]: minimized,
                                },
                            )}
                        >
                            <span>{description}</span>
                        </div>
                    </CSSTransition>
                </div>
            </div>
        </>
    );
};

export default HelperInfo;
