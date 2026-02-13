import { useEffect, useRef, useState } from 'react';
import isElectron from 'is-electron';

import { toast } from 'app/lib/toaster';
import log from 'app/lib/log';
import store from 'app/store';
import {
    getGlobalCameraService,
    initializeGlobalCameraService,
} from 'app/lib/camera/globalCameraService';
import { CameraSettings, CameraStatus } from 'app/services/CameraService';

type SendControllerCommand = (command: string, ...args: unknown[]) => void;

interface UseCameraFeatureStateParams {
    sendControllerCommand: SendControllerCommand;
}

export const useCameraFeatureState = ({ sendControllerCommand }: UseCameraFeatureStateParams) => {
    const [isHeadlessMode, setIsHeadlessMode] = useState(false);
    const [isCheckingHeadless, setIsCheckingHeadless] = useState(true);
    const cameraService = !isHeadlessMode ? getGlobalCameraService() : null;

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const settingsRef = useRef(settings);
    const statusRef = useRef(status);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        const checkHeadlessMode = async () => {
            try {
                const isMainClient = isElectron() ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '0.0.0.0';
                setIsHeadlessMode(!isMainClient);
            } catch (error) {
                log.error('[Camera] Failed to check headless mode:', error);
                setIsHeadlessMode(false);
            } finally {
                setIsCheckingHeadless(false);
            }
        };

        checkHeadlessMode();
    }, []);

    useEffect(() => {
        const service = getGlobalCameraService();
        if (!service || !videoRef.current) {
            return;
        }

        if (status.streaming) {
            const stream = service.getStream();
            log.debug('[Camera] Attaching stream to video element, stream:', stream, 'tracks:', stream?.getTracks().length);
            if (stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((err) => {
                    log.error('[Camera] Preview video play failed:', err);
                });
            }
        } else {
            log.debug('[Camera] Clearing video element srcObject');
            videoRef.current.srcObject = null;
        }
    }, [status.streaming]);

    useEffect(() => {
        const initializeCameraComponent = async () => {
            let service = cameraService;

            if (!service) {
                for (let attempt = 0; attempt < 10; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 500 + 500));
                    service = getGlobalCameraService();
                    if (service) {
                        break;
                    }
                }

                if (!service) {
                    try {
                        service = await initializeGlobalCameraService();
                    } catch (error) {
                        log.error('[Camera] Failed to initialize camera service:', error);
                        return;
                    }
                }
            }

            if (service) {
                await new Promise(resolve => setTimeout(resolve, 100));

                const currentSettings = service.getSettings();
                const currentStatus = service.getStatus();
                setSettings(currentSettings);
                setStatus(currentStatus);
                setIsInitialized(true);

                try {
                    await service.enumerateDevices();
                    const currentDevices = service.getDevices();
                    if (currentDevices.length > 0) {
                        setDevices(currentDevices);
                    }
                } catch (error) {
                    log.error('[Camera] Failed to enumerate camera devices:', error);
                }

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

                const handleMetricsUpdated = (metrics: CameraStatus['metrics']) => {
                    setStatus(prev => ({ ...prev, metrics }));
                    if (statusRef.current.streaming && settingsRef.current.enabled) {
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

        let cleanupFunction: (() => void) | undefined;
        initializeCameraComponent().then(cleanup => {
            cleanupFunction = cleanup;
        });

        return () => {
            if (cleanupFunction) {
                cleanupFunction();
            }
        };
    }, []);

    useEffect(() => {
        if (isInitialized && status.streaming && videoRef.current && !videoRef.current.srcObject) {
            const service = getGlobalCameraService();
            if (service) {
                const stream = service.getStream();
                if (stream) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch((err) => {
                        log.warn('[Camera] Late-bind preview video play failed:', err);
                    });
                }
            }
        }
    }, [isInitialized, status.streaming]);

    useEffect(() => {
        if (isInitialized && cameraService) {
            cameraService.enumerateDevices();
        }
    }, [isInitialized, cameraService]);

    return {
        cameraService,
        devices,
        isCheckingHeadless,
        isHeadlessMode,
        settings,
        setSettings,
        setCameraState,
        status,
        videoRef,
    };
};
