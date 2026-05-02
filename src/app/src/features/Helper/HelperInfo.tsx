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
import cx from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';

const HelperInfo = ({ payload, infoVisible, onClose }) => {
    const { title, description } = payload;
    const [visible, setVisible] = useState(infoVisible);

    useEffect(() => {
        setVisible(infoVisible);
    }, [infoVisible]);

    return (
        <div
            className={cx(
                'absolute bottom-2/3 xl:left-20 left-16 w-1/3 bg-white rounded flex flex-col content-end overflow-hidden z-50 border-2 border-orange-600',
                {
                    hidden: !visible,
                },
            )}
        >
            <div className="border-b border-b-orange-600 p-2 flex flex-row justify-between items-center bg-amber-100/70">
                <h1 className="flex flex-row gap-2 items-center justify-center p-0 mr-4 text-orange-600 font-bold text-xl">
                    <FaInfoCircle className="text-2xl" /> {title}
                </h1>
                <div className="flex cursor-pointer bg-amber-200/20 p-1 border-orange-500 border">
                    <FaTimes onClick={() => onClose()} className="w-5 h-5" />
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
                    className="flex p-4 justify-stretch items-stretch flex-grow flex-col"
                >
                    <span>{description}</span>
                    {payload.content && (
                        <div className="mt-2 p-2">{payload.content}</div>
                    )}
                </div>
            </CSSTransition>
        </div>
    );
};

export default HelperInfo;
