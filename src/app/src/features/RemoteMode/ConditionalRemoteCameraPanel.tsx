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

import { useState, useEffect } from 'react';
import isElectron from 'is-electron';
import RemoteCameraPanel from 'app/features/RemoteCameraPanel';
import controller from 'app/lib/controller';
import log from 'app/lib/log';

/**
 * Component to conditionally render RemoteCameraPanel based on streaming settings.
 * Only shows camera panel when:
 * 1. This is a remote client
 * 2. Camera streaming is enabled on the server
 */
export const ConditionalRemoteCameraPanel = () => {
    const [cameraAvailable, setCameraAvailable] = useState(false);
    const [isRemoteClient, setIsRemoteClient] = useState(false);
    const [isCheckingInitialStatus, setIsCheckingInitialStatus] = useState(true);

    useEffect(() => {
        // Check if this is a remote client
        // Main client = Electron app OR localhost browser
        // Remote client = browser accessing external server (non-localhost)
        const isMainClient = isElectron() ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname === '0.0.0.0';
        
        const isRemote = !isMainClient;

        setIsRemoteClient(isRemote);

        if (!isRemote) {
            // If running locally (main server), don't show the camera panel here
            setCameraAvailable(false);
            setIsCheckingInitialStatus(false);
            return;
        }

        // Check server camera status via API.
        // Keep panel mounted once available to avoid tearing down active video.
        const checkCameraStatus = async () => {
            try {
                const response = await fetch('/api/camera/status');
                if (response.ok) {
                    const status = await response.json();
                    // Show panel if camera is enabled and available for streaming
                    const isAvailable = status.enabled && status.available;
                    if (isAvailable) {
                        setCameraAvailable(true);
                    }
                    setIsCheckingInitialStatus(false);
                } else {
                    log.warn('[ConditionalRemoteCameraPanel] Failed to fetch camera status:', response.status);
                    setIsCheckingInitialStatus(false);
                }
            } catch (error) {
                log.warn('[ConditionalRemoteCameraPanel] Error fetching camera status:', error);
                setIsCheckingInitialStatus(false);
            }
        };

        // Check immediately
        checkCameraStatus();

        const handleCameraAvailability = (data: { available: boolean }) => {
            if (data.available) {
                setCameraAvailable(true);
            }
        };

        const handleSocketConnect = () => {
            checkCameraStatus();
        };

        let socketListenersBound = false;
        let socketBindingTimer: ReturnType<typeof setInterval> | null = null;

        const bindSocketListeners = () => {
            const socket = controller.socket;
            if (!socket || socketListenersBound) {
                return;
            }
            socket.on('camera:availability', handleCameraAvailability);
            socket.on('connect', handleSocketConnect);
            socketListenersBound = true;
        };

        bindSocketListeners();
        if (!socketListenersBound) {
            socketBindingTimer = setInterval(() => {
                bindSocketListeners();
                if (socketListenersBound && socketBindingTimer) {
                    clearInterval(socketBindingTimer);
                    socketBindingTimer = null;
                }
            }, 250);
        }

        return () => {
            if (socketBindingTimer) {
                clearInterval(socketBindingTimer);
            }
            const socket = controller.socket;
            if (socket) {
                socket.off('camera:availability', handleCameraAvailability);
                socket.off('connect', handleSocketConnect);
            }
        };
    }, []);

    if (!isRemoteClient) {
        return null;
    }

    // Once camera is available, always render the panel (don't unmount it)
    // The panel itself will handle connection states
    if (!cameraAvailable && !isCheckingInitialStatus) {
        return null;
    }

    if (cameraAvailable) {
        return <RemoteCameraPanel key="camera-panel" />;
    }

    return null;
};
