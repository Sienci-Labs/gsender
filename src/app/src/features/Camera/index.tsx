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

import React, { useState, useEffect, useRef } from 'react';
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
import { CameraSettings, CameraStatus } from 'app/services/CameraService';
import store from 'app/store';
import controller from 'app/lib/controller';
import { getGlobalCameraService } from 'app/lib/camera/globalCameraService';

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
    // Removed spam logs that were causing re-render loop detection issues
    
    // Check if we're in headless mode (remote client)
    const [isHeadlessMode, setIsHeadlessMode] = useState(false);
    const [isCheckingHeadless, setIsCheckingHeadless] = useState(true);
    
    useEffect(() => {
        // Check if we're in headless mode (remote client connecting to external server)
        // We need to detect if this app is connecting to an EXTERNAL server, not if it's SERVING to remote clients
        const checkHeadlessMode = async () => {
            try {
                // Check if we're running our own server or connecting to an external one
                // If window.location is NOT localhost/127.0.0.1, we're a remote client
                const isLocalhost = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' ||
                                   window.location.hostname === '0.0.0.0';
                
                // Only consider it headless mode if we're NOT on localhost
                // (i.e., we're accessing a remote server from another device)
                setIsHeadlessMode(!isLocalhost);
            } catch (error) {
                console.error('[Camera] Failed to check headless mode:', error);
                setIsHeadlessMode(false);
            } finally {
                setIsCheckingHeadless(false);
            }
        };
        
        checkHeadlessMode();
    }, []);
    
    // Helper function to safely send controller commands
    const sendControllerCommand = (command: string, ...args: any[]) => {
        if (controller.socket && controller.socket.connected) {
            controller.command(command, ...args);
        } else {
            console.warn(`Cannot send ${command}: socket not connected`);
        }
    };
    
    // Get the global camera service instance (only if not in headless mode)
    const cameraService = !isHeadlessMode ? getGlobalCameraService() : null;
    
    // Helper function to safely use camera service
    const withCameraService = <T extends any[]>(fn: (service: NonNullable<typeof cameraService>, ...args: T) => void | Promise<void>) => {
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
    
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [settings, setSettings] = useState<CameraSettings>(() => {
        if (cameraService) {
            return cameraService.getSettings();
        }
        return store.get('workspace.camera', {
            enabled: false,
            deviceId: '',
            constraints: { width: 1280, height: 720, frameRate: 30 },
            qualityPreset: 'medium' as const,
        });
    });
    const [status, setStatus] = useState<CameraStatus>(() => {
        if (cameraService) {
            return cameraService.getStatus();
        }
        return {
            enabled: false,
            available: false,
            streaming: false,
            error: null,
            metrics: { fps: 0, bitrateKbps: 0, viewers: 0, droppedFrames: 0 },
        };
    });
    const [isInitialized, setIsInitialized] = useState(!!cameraService);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [, setCameraState] = useState(() => store.get('workspace.camera', {
        enabled: false,
        deviceId: '',
        constraints: {
            width: 1280,
            height: 720,
            frameRate: 30,
        },
        qualityPreset: 'medium' as const,
    }));

    // Effect to attach stream to video element when streaming status changes
    useEffect(() => {
        const service = getGlobalCameraService();
        if (!service || !videoRef.current) {
            return;
        }

        if (status.streaming) {
            const stream = service.getStream();
            console.log('[Camera] Attaching stream to video element, stream:', stream, 'tracks:', stream?.getTracks().length);
            if (stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((err) => {
                    console.error('[Camera] Preview video play failed:', err);
                });
            }
        } else {
            console.log('[Camera] Clearing video element srcObject');
            videoRef.current.srcObject = null;
        }
    }, [status.streaming]);

    useEffect(() => {
        // Camera service is now initialized globally, just set up event listeners
        const initializeCameraComponent = async () => {
            let service = cameraService;
            
            // If service not available, wait for it or try to initialize
            if (!service) {
                // Try to get the service multiple times with increasing delays
                for (let attempt = 0; attempt < 10; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 500 + 500));
                    service = getGlobalCameraService();
                    if (service) {
                        break;
                    }
                }
                
                // If still no service, try to trigger global initialization
                if (!service) {
                    try {
                        const { initializeGlobalCameraService } = await import('app/lib/camera/globalCameraService');
                        service = await initializeGlobalCameraService();
                    } catch (error) {
                        console.error('Failed to initialize camera service:', error);
                        return;
                    }
                }
            }
            
            if (service) {
                // Wait a bit to ensure service has loaded settings from store
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Get current settings and status
                const currentSettings = service.getSettings();
                const currentStatus = service.getStatus();
                
                // Update local state with current service state
                setSettings(currentSettings);
                setStatus(currentStatus);
                setIsInitialized(true);
                
                // Initialize the service if not already done (requests permission)
                // This only happens when user opens Camera page for the first time
                try {
                    if (service.getDevices().length === 0) {
                        console.log('[Camera] Initializing camera service and requesting permission...');
                        await service.initialize();
                    }
                } catch (error) {
                    console.error('[Camera] Failed to initialize camera service:', error);
                }
                
                // Enumerate devices immediately
                try {
                    await service.enumerateDevices();
                    // Also directly get devices in case event hasn't fired yet
                    const currentDevices = service.getDevices();
                    if (currentDevices.length > 0) {
                        setDevices(currentDevices);
                    }
                } catch (error) {
                    console.error('Failed to enumerate camera devices:', error);
                }
                
                // Set up event listeners
                const handleDevicesChanged = (newDevices: MediaDeviceInfo[]) => {
                    setDevices(newDevices);
                };

                const handleSettingsChanged = (newSettings: CameraSettings) => {
                    setSettings(newSettings);
                };

                const handleStatusChanged = (newStatus: CameraStatus) => {
                    setStatus(newStatus);
                };

                const handleStreamStarted = (stream: MediaStream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                };

                const handleStreamStopped = () => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                };

                const handleError = (error: string) => {
                    toast.error(error);
                };

                const handleMetricsUpdated = (metrics: any) => {
                    setStatus(prev => ({ ...prev, metrics }));
                    // Only send metrics to server if streaming is enabled
                    if (status.streaming && settings.enabled) {
                        sendControllerCommand('camera:metrics', metrics);
                    }
                };

                service.on('devicesChanged', handleDevicesChanged);
                service.on('settingsChanged', handleSettingsChanged);
                service.on('statusChanged', handleStatusChanged);
                service.on('streamStarted', handleStreamStarted);
                service.on('streamStopped', handleStreamStopped);
                service.on('metricsUpdated', handleMetricsUpdated);
                service.on('error', handleError);

                // Store cleanup function
                return () => {
                    service.off('devicesChanged', handleDevicesChanged);
                    service.off('settingsChanged', handleSettingsChanged);
                    service.off('statusChanged', handleStatusChanged);
                    service.off('streamStarted', handleStreamStarted);
                    service.off('streamStopped', handleStreamStopped);
                    service.off('metricsUpdated', handleMetricsUpdated);
                    service.off('error', handleError);
                };
            }
        };
        
        // Call the async function and handle cleanup
        let cleanupFunction: (() => void) | undefined;
        
        initializeCameraComponent().then(cleanup => {
            cleanupFunction = cleanup;
        });
        
        // Return cleanup function for useEffect
        return () => {
            if (cleanupFunction) {
                cleanupFunction();
            }
        };
    }, []);

    // Separate effect to connect video element when it becomes available and stream is already active
    useEffect(() => {
        if (isInitialized && status.streaming && videoRef.current && !videoRef.current.srcObject) {
            const service = getGlobalCameraService();
            if (service) {
                const stream = service.getStream();
                if (stream) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch((err) => {
                        console.warn('[Camera] Late-bind preview video play failed:', err);
                    });
                }
            }
        }
    }, [isInitialized, status.streaming]);

    // Additional effect to connect video on render when streaming is active
    // This runs every render to catch the case where videoRef becomes available
    useEffect(() => {
        if (isInitialized && status.streaming && videoRef.current && !videoRef.current.srcObject) {
            const service = getGlobalCameraService();
            if (service) {
                const stream = service.getStream();
                if (stream) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch((err) => {
                        console.warn('[Camera] Video play on render failed:', err);
                    });
                }
            }
        }
    });

    useEffect(() => {
        if (isInitialized && cameraService) {
            cameraService.enumerateDevices();
        }
    }, [isInitialized, cameraService]);

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
            console.error('Failed to toggle streaming:', error);
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
