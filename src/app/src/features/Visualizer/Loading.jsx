/*
 * Copyright (C) 2021 Sienci Labs Inc.
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

import React, { useState, useEffect } from 'react';
import pubsub from 'pubsub-js';
import i18n from 'app/lib/i18n';

import styles from './loader.module.styl';

const Loading = () => {
    const [progress, setProgress] = useState(0);

    const subscribe = () => {
        const tokens = [
            pubsub.subscribe('toolpath:progress', (msg, progress) => {
                setProgress(progress);
            }),
        ];
        return tokens;
    };

    useEffect(() => {
        const token = subscribe();
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    return (
        <div className={styles.loader}>
            <div className={styles.loaderBar}>
                <div className="progress" style={{ marginBottom: '0px' }}>
                    <div
                        className="progress-bar progress-bar-info progress-bar-striped"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <strong className="justify-content-center d-flex position-absolute w-100">{`${progress}%`}</strong>
            </div>
            <div className={styles.loaderText}>{i18n._('Loading...')}</div>
        </div>
    );
};

export default Loading;
