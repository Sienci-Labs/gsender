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

import React from 'react';
import { FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import cx from 'classnames';
import { useRemoteCameraConnection } from './hooks/useRemoteCameraConnection';

const RemoteCameraPanel: React.FC = () => {
    const { cameraStatus, connectionState, videoRef } = useRemoteCameraConnection();

    // Always render the panel to show status
    const renderConnectionStatus = () => {
        // If camera status is not available
        if (!cameraStatus?.available) {
            return (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Waiting for stream
                </span>
            );
        }

        switch (connectionState.state) {
            case 'connecting':
                return (
                    <span className="flex items-center gap-2 text-sm text-blue-500">
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        Connecting...
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-2 text-sm text-red-500">
                        <FaExclamationTriangle />
                        Failed
                    </span>
                );
            case 'disconnected':
                return (
                    <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                        Initializing...
                    </span>
                );
            default:
                return null;
        }
    };

        return (
            <div className="mb-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <FaCamera className="text-blue-500" />
                        <span className="font-medium">Camera Stream</span>
                        {connectionState.state === 'connected' ? (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                                LIVE
                            </span>
                        ) : (
                            renderConnectionStatus()
                        )}
                    </div>
                </div>

                <div className="flex relative" style={{ aspectRatio: '16/9' }}>
                    <video
                        ref={videoRef}
                        playsInline
                        muted={true}
                        controls={false}
                        onClick={() => {
                            // Simple fallback: if user clicks video and it's paused, try to play
                            if (videoRef.current?.paused) {
                                videoRef.current.play().catch(() => {
                                    // Ignore play errors
                                });
                            }
                        }}
                        className={cx(
                            "inset-0 w-full h-full object-contain cursor-pointer",
                            {
                                "bg-black": connectionState.state === 'connected',
                                "bg-gray-100 dark:bg-gray-900": connectionState.state !== 'connected'
                            }
                        )}
                    />
                </div>
        </div>
    );
};

export default RemoteCameraPanel;
