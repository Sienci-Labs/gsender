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
import { useSelector } from 'react-redux';
import cn from 'classnames';

const Loading = () => {
    const [progress, setProgress] = useState(70);
    const renderState = useSelector((state) => state.file.renderState);

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
        <div className="relative p-4 mt-24 max-w-sm mx-auto">
            <div className="flex mb-2 items-center justify-between">
                <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-robin-500 invisible">
                        Loading...
                    </span>
                </div>
                <div className="text-right bg-gray-500 bg-opacity-30 border border-gray-500 rounded-xl px-2 w-20 flex items-center justify-center">
                    <span className="text-3xl font-bold inline-block text-white">
                        {progress}%
                    </span>
                </div>
            </div>

            <div className="flex relative rounded-full h-6 bg-gray-200">
                <div className="absolute rounded-full inset-0 h-full flex shadow-[0px_0px_10px_0px_rgba(104,_154,_201,_1)] p-[2px] bg-red w-full ">
                    <div
                        style={{ width: `${progress}%` }}
                        className="rounded-full stripes bg-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default Loading;
