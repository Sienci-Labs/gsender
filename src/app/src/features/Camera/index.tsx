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

import React, { useEffect } from 'react';
import { FaCamera, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'app/lib/toaster';

import { Switch } from 'app/components/shadcn/Switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select';
import store from 'app/store';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import { getGlobalCameraService } from 'app/lib/camera/globalCameraService';
import { useCameraFeatureState } from './hooks/useCameraFeatureState';

const RESOLUTION_OPTIONS = [
    { value: 'low', label: '640×480 (Low)' },
    { value: 'medium', label: '1280×720 (Medium)' },
    { value: 'high', label: '1920×1080 (High)' },
];

const FRAME_RATE_OPTIONS = [
    { value: 15, label: '15 FPS' },
    { value: 30, label: '30 FPS' },
];

const Camera: React.FC = () => {
    // Helper function to safely send controller commands
    const sendControllerCommand = (command: string, ...args: unknown[]) => {
        if (controller.socket && controller.socket.connected) {
            controller.command(command, ...args);
        } else {
            log.warn(`[Camera] Cannot send ${command}: socket not connected`);
        }
    };

    const {
        cameraService,
        devices,
        isCheckingHeadless,
        isHeadlessMode,
        settings,
        setSettings,
        setCameraState,
        status,
        videoRef,
    } = useCameraFeatureState({ sendControllerCommand });
    
    // Helper function to safely use camera service
    const withCameraService = <T extends unknown[]>(fn: (service: NonNullable<typeof cameraService>, ...args: T) => void | Promise<void>) => {
        return async (...args: T) => {
            let service = getGlobalCameraService();
            
            // If no service, wait a bit and try again
            if (!service) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                service = getGlobalCameraService();
            }
            
            if (!service) {
                toast.error('Camera service not available. Please wait for initialization or refresh the page.');
                return;
            }
            return fn(service, ...args);
        };
    };

    const handleToggleStreaming = withCameraService(async (service, enabled: boolean) => {
        try {
            const currentSettings = service.getSettings();
            
            if (enabled) {
                // Validate device is selected before starting
                if (!currentSettings.deviceId) {
                    toast.error('Please select a camera device first');
                    return;
                }
                
                // Start the stream first
                await service.startStream();
                
                // Update settings with enabled=true
                const newSettings = { ...currentSettings, enabled: true };
                service.updateSettings(newSettings);
                
                // Persist to store
                store.set('workspace.camera', newSettings);
                setCameraState(newSettings);
                setSettings(newSettings);
                
                // Notify server
                sendControllerCommand('camera:startStream');
                sendControllerCommand('camera:updateSettings', newSettings);
                
                toast.success('Camera streaming started');
            } else {
                // Stop the stream first
                await service.stopStream();
                
                // Update settings with enabled=false
                const newSettings = { ...currentSettings, enabled: false };
                service.updateSettings(newSettings);
                
                // Persist to store
                store.set('workspace.camera', newSettings);
                setCameraState(newSettings);
                setSettings(newSettings);
                
                // Notify server
                sendControllerCommand('camera:stopStream');
                sendControllerCommand('camera:updateSettings', newSettings);
                
                toast.success('Camera streaming stopped');
            }
        } catch (error) {
            log.error('[Camera] Failed to toggle streaming:', error);
            toast.error(`Failed to ${enabled ? 'start' : 'stop'} streaming`);
        }
    });

    const handleDeviceChange = withCameraService((service, deviceId: string | number) => {
        const newSettings = { ...settings, deviceId: String(deviceId) };
        service.updateSettings(newSettings);
        
        // Update store and notify server
        store.set('workspace.camera', newSettings);
        setCameraState(newSettings);
        sendControllerCommand('camera:updateSettings', newSettings);
    });

    const handleQualityChange = withCameraService((service, qualityPreset: string | number) => {
        const newSettings = { ...settings, qualityPreset: qualityPreset as 'low' | 'medium' | 'high' };
        service.updateSettings(newSettings);
        
        // Update store and notify server
        store.set('workspace.camera', newSettings);
        setCameraState(newSettings);
        sendControllerCommand('camera:updateSettings', newSettings);
    });

    const handleFrameRateChange = withCameraService((service, frameRate: string | number) => {
        const constraints = { ...settings.constraints, frameRate: Number(frameRate) };
        const newSettings = { ...settings, constraints };
        service.updateSettings(newSettings);
        
        // Update store and notify server
        store.set('workspace.camera', newSettings);
        setCameraState(newSettings);
        sendControllerCommand('camera:updateSettings', newSettings);
    });

    const deviceOptions = devices.map(device => ({
        value: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`,
    }));

    const hasDevices = devices.length > 0;
    const canStream = hasDevices && settings.deviceId;

    useEffect(() => {
        if (!canStream || !status.streaming || !videoRef.current || videoRef.current.srcObject) {
            return;
        }

        const service = getGlobalCameraService();
        const stream = service?.getStream();
        if (stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => {
                log.warn('[Camera] Late preview attach failed:', err);
            });
        }
    }, [canStream, status.streaming, videoRef]);

    // Show loading state while checking headless mode
    if (isCheckingHeadless) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="text-gray-600 dark:text-gray-400">Loading camera settings...</div>
                </div>
            </div>
        );
    }

    // Show message if in headless mode
    if (isHeadlessMode) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Camera streaming is managed by the main server
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                                Remote Client Mode
                            </h3>
                            <p className="text-blue-800 dark:text-blue-200 mb-3">
                                This device is running in Remote Client mode and is connected to an external gSender server. 
                                Camera streaming can only be configured on the main server device.
                            </p>
                            <p className="text-blue-700 dark:text-blue-300">
                                If you want to control camera settings, please access the Camera page on the main server device 
                                (the one physically connected to your CNC machine).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Stream your camera to remote clients for workflow monitoring
                    </p>
                </div>
            </div>

            {status.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <FaExclamationTriangle />
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-1 text-red-600 dark:text-red-300">{status.error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-lg font-medium">Enable Camera Streaming</label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                When enabled, streaming starts automatically on app launch
                            </p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onChange={handleToggleStreaming}
                            disabled={!canStream}
                            id="camera-streaming-toggle"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Camera Device</label>
                        {!hasDevices ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                No camera devices detected. Please connect a camera and refresh the page.
                            </div>
                        ) : (
                            <Select value={settings.deviceId} onValueChange={handleDeviceChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a camera..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    {deviceOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Resolution & Quality</label>
                            <Select value={settings.qualityPreset} onValueChange={handleQualityChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    {RESOLUTION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Frame Rate</label>
                            <Select value={String(settings.constraints.frameRate)} onValueChange={handleFrameRateChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    {FRAME_RATE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={String(option.value)}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {canStream && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted

                            className="w-full h-full object-contain"
                        />
                        {!status.streaming && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <div className="text-center">
                                    <FaCamera className="text-4xl mb-2 opacity-50" />
                                    <p>Camera preview will appear here when streaming</p>
                                </div>
                            </div>
                        )}
                        {status.streaming && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                                LIVE
                            </div>
                        )}
                    </div>
                </div>
            )}

            {status.streaming && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-medium mb-4">Streaming Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">{status.metrics.fps}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">FPS</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-500">{status.metrics.bitrateKbps}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">kbps</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-500">{status.metrics.viewers}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Viewers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-500">{status.metrics.droppedFrames}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Dropped</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-blue-500 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Getting Started</p>
                        <ul className="text-blue-600 dark:text-blue-400 space-y-1">
                            <li>• Select a camera device and enable streaming</li>
                            <li>• Remote clients on your network can view the stream on their workflow page</li>
                            <li>• First-time access may require accepting a security certificate</li>
                            <li>• Streaming automatically starts when you launch the app (if enabled)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Camera;
