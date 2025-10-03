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
import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';
import RemoteCameraPanel from 'app/features/RemoteCameraPanel';
import store from 'app/store';

/**
 * Component to conditionally render RemoteCameraPanel based on streaming settings.
 * Only shows camera panel when:
 * 1. This is a remote client
 * 2. Camera streaming is enabled on the server
 */
const ConditionalRemoteCameraPanel = () => {
    const [cameraEnabled, setCameraEnabled] = useState(false);

    useEffect(() => {
        // Check if this is a remote client
        const isRemoteClient = !(
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0'
        );

        if (!isRemoteClient) {
            // If running locally (main server), don't show the camera panel here
            setCameraEnabled(false);
            return;
        }

        // Check if camera is enabled in settings
        const cameraSettings = store.get('workspace.camera');
        const isCameraEnabled = cameraSettings?.enabled || false;

        setCameraEnabled(isCameraEnabled);

        // Listen for changes to camera settings
        const handleStoreChange = () => {
            const updatedSettings = store.get('workspace.camera');
            setCameraEnabled(updatedSettings?.enabled || false);
        };

        store.on('change', handleStoreChange);

        return () => {
            store.off('change', handleStoreChange);
        };
    }, []);

    if (!cameraEnabled) {
        return null;
    }

    return <RemoteCameraPanel />;
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

