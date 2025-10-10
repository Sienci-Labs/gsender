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
import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';
import RemoteCameraPanel from 'app/features/RemoteCameraPanel';

/**
 * Component to conditionally render RemoteCameraPanel based on streaming settings.
 * Only shows camera panel when:
 * 1. This is a remote client
 * 2. Camera streaming is enabled on the server
 */
const ConditionalRemoteCameraPanel = () => {
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

        // Check server camera status via API
        const checkCameraStatus = async () => {
            try {
                const response = await fetch('/api/camera/status');
                if (response.ok) {
                    const status = await response.json();
                    // Show panel if camera is enabled and available for streaming
                    const isAvailable = status.enabled && status.available;
                    setCameraAvailable(isAvailable);
                    setIsCheckingInitialStatus(false);
                } else {
                    console.warn('[ConditionalRemoteCameraPanel] Failed to fetch camera status:', response.status);
                    setCameraAvailable(false);
                    setIsCheckingInitialStatus(false);
                }
            } catch (error) {
                console.warn('[ConditionalRemoteCameraPanel] Error fetching camera status:', error);
                setCameraAvailable(false);
                setIsCheckingInitialStatus(false);
            }
        };

        // Check immediately
        checkCameraStatus();

        // Poll every 5 seconds to detect when camera becomes available
        // Once available, keep rendering the panel (don't unmount it)
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/camera/status');
                if (response.ok) {
                    const status = await response.json();
                    const isAvailable = status.enabled && status.available;
                    // Only update if changing from unavailable to available
                    // Never unmount once mounted by not setting to false
                    if (isAvailable && !cameraAvailable) {
                        setCameraAvailable(true);
                    }
                }
            } catch (error) {
                // Silently ignore polling errors to keep component mounted
            }
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [cameraAvailable]);

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

/**
 * Remote Workflow page component.
 * Displays file control, job control, and conditionally shows camera panel for remote clients.
 */
export default function RemoteWorkflow() {
    return (
        <div className="flex flex-col gap-6 mt-6">
            <FileControl />
            <ConditionalRemoteCameraPanel />
            <JobControl />
        </div>
    );
}

