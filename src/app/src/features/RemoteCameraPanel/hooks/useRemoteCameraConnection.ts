import { useEffect, useRef, useState } from 'react';

import controller from 'app/lib/controller';
import log from 'app/lib/log';

export interface CameraStatus {
    enabled: boolean;
    available: boolean;
    transport: string;
    viewers: number;
    constraints: {
        width: number;
        height: number;
        frameRate: number;
    };
}

export interface ConnectionState {
    state: 'disconnected' | 'connecting' | 'connected' | 'failed';
    error?: string;
}

const CONNECTING_TIMEOUT_MS = 10000;
const STREAM_REQUEST_TIMEOUT_MS = 4000;
const AUTO_RETRY_BASE_DELAY_MS = 2000;
const AUTO_RETRY_MAX_DELAY_MS = 15000;

export const useRemoteCameraConnection = () => {
    const [cameraStatus, setCameraStatus] = useState<CameraStatus | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>({ state: 'disconnected' });
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const connectingSinceRef = useRef<number>(0);
    const streamRequestSentAtRef = useRef<number>(0);
    const autoRetryDelayRef = useRef<number>(AUTO_RETRY_BASE_DELAY_MS);

    useEffect(() => {
        peerConnectionRef.current = peerConnection;
    }, [peerConnection]);

    const flushPendingIceCandidates = async (pc: RTCPeerConnection) => {
        if (pendingIceCandidatesRef.current.length === 0) {
            return;
        }

        const queuedCandidates = [...pendingIceCandidatesRef.current];
        pendingIceCandidatesRef.current = [];

        for (const candidate of queuedCandidates) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                log.error('[RemoteCamera] Failed to apply queued ICE candidate:', error);
            }
        }
    };

    const disconnectFromCamera = () => {
        const currentPeer = peerConnectionRef.current;

        if (currentPeer && currentPeer.connectionState !== 'closed') {
            currentPeer.close();
            setPeerConnection(null);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        streamRef.current = null;
        pendingIceCandidatesRef.current = [];
        connectingSinceRef.current = 0;
        streamRequestSentAtRef.current = 0;
        autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
        setConnectionState({ state: 'disconnected' });
    };

    const connectToCamera = async () => {
        const currentPeer = peerConnectionRef.current;

        if (currentPeer && currentPeer.connectionState !== 'closed' && currentPeer.connectionState !== 'failed') {
            return;
        }

        if (!controller.socket?.connected) {
            log.error('[RemoteCamera] Cannot request stream - socket not connected');
            setConnectionState({ state: 'failed', error: 'Socket not connected' });
            return;
        }

        try {
            const now = Date.now();
            const hasPendingStreamRequest =
                streamRequestSentAtRef.current > 0 &&
                now - streamRequestSentAtRef.current < STREAM_REQUEST_TIMEOUT_MS;
            if (hasPendingStreamRequest) {
                return;
            }

            setConnectionState({ state: 'connecting' });
            connectingSinceRef.current = now;
            streamRequestSentAtRef.current = now;
            controller.socket.emit('camera:requestStream', {
                clientId: controller.socket.id
            });
        } catch (error) {
            streamRequestSentAtRef.current = 0;
            log.error('[RemoteCamera] Error in connectToCamera:', error);
            setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    const checkCameraStatus = async () => {
        try {
            const response = await fetch('/api/camera/status');
            if (response.ok) {
                const status = await response.json();
                setCameraStatus(status);

                if (status.available && controller.socket?.connected) {
                    const currentPeer = peerConnectionRef.current;
                    const shouldConnect = !currentPeer ||
                        currentPeer.connectionState === 'closed' ||
                        currentPeer.connectionState === 'failed';
                    if (shouldConnect) {
                        connectToCamera();
                    }
                }
            } else {
                log.warn('[RemoteCameraPanel] Failed to fetch camera status:', response.status);
            }
        } catch (error) {
            log.warn('[RemoteCameraPanel] Failed to check camera status:', error);
        }
    };

    useEffect(() => {
        const checkWithRetry = async (attempts = 3) => {
            await checkCameraStatus();
            if (!controller.socket?.connected && attempts > 1) {
                setTimeout(() => checkWithRetry(attempts - 1), 1000);
            }
        };

        checkWithRetry();

        let autoConnectTimer: ReturnType<typeof setTimeout> | null = null;
        let autoConnectStopped = false;
        const runAutoConnectCheck = () => {
            if (autoConnectStopped) {
                return;
            }

            const currentPeer = peerConnectionRef.current;
            const isPeerRecoverableState = !currentPeer ||
                currentPeer.connectionState === 'closed' ||
                currentPeer.connectionState === 'failed' ||
                currentPeer.connectionState === 'disconnected';
            const isStuckConnecting = connectingSinceRef.current > 0 &&
                Date.now() - connectingSinceRef.current > CONNECTING_TIMEOUT_MS;

            if (isStuckConnecting) {
                log.warn('[RemoteCamera] Connection attempt timed out, retrying');
                if (currentPeer && currentPeer.connectionState !== 'closed') {
                    currentPeer.close();
                    setPeerConnection(null);
                }
                connectingSinceRef.current = 0;
                setConnectionState({ state: 'failed', error: 'Connection timeout' });
            }
            const shouldConnect = isPeerRecoverableState || isStuckConnecting;

            if (shouldConnect && controller.socket?.connected) {
                checkCameraStatus();
                autoRetryDelayRef.current = Math.min(
                    autoRetryDelayRef.current * 2,
                    AUTO_RETRY_MAX_DELAY_MS
                );
            } else {
                autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
            }

            autoConnectTimer = setTimeout(runAutoConnectCheck, autoRetryDelayRef.current);
        };
        autoConnectTimer = setTimeout(runAutoConnectCheck, autoRetryDelayRef.current);

        const handleCameraAvailability = (data: { available: boolean; transport: string }) => {
            setCameraStatus(prev => prev ? { ...prev, available: data.available } : null);

            if (data.available && controller.socket?.connected) {
                autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
                const currentPeer = peerConnectionRef.current;
                const shouldConnect = !currentPeer ||
                    currentPeer.connectionState === 'closed' ||
                    currentPeer.connectionState === 'failed';
                if (shouldConnect) {
                    connectToCamera();
                }
            } else if (!data.available) {
                disconnectFromCamera();
            }
        };

        const handleCameraOffer = async (data: { sdp: string; clientId: string }) => {
            streamRequestSentAtRef.current = 0;
            const mainClientId = data.clientId;

            const currentPeer = peerConnectionRef.current;
            if (currentPeer) {
                const state = currentPeer.signalingState;
                const iceState = currentPeer.iceConnectionState;

                if ((state === 'stable' && (iceState === 'connected' || iceState === 'completed')) ||
                    (state !== 'closed' && state !== 'stable')) {
                    return;
                }

                if (state !== 'closed') {
                    currentPeer.close();
                }
                setPeerConnection(null);
            }

            let pc: RTCPeerConnection | null = null;
            try {
                pc = new RTCPeerConnection({ iceServers: [] });
                pc.ontrack = (event) => {
                    if (videoRef.current && event.streams[0]) {
                        const stream = event.streams[0];
                        videoRef.current.muted = true;
                        videoRef.current.volume = 1.0;
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;

                        setConnectionState({ state: 'connected' });
                        autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
                        streamRequestSentAtRef.current = 0;

                        videoRef.current.play().catch((error) => {
                            log.warn('[RemoteCamera] Video play failed:', error);
                        });
                    } else {
                        log.warn('[RemoteCamera] ontrack event but no video ref or stream');
                    }
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate && controller.socket) {
                        controller.socket.emit('camera:ice', {
                            candidate: event.candidate.toJSON(),
                            clientId: mainClientId
                        });
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    const state = pc.iceConnectionState;
                    if (state === 'connected' || state === 'completed') {
                        connectingSinceRef.current = 0;
                        autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
                    }
                    if (state === 'failed' || state === 'disconnected') {
                        setConnectionState({ state: 'failed', error: `Connection ${state}` });
                    }
                };

                setPeerConnection(pc);

                await pc.setRemoteDescription(new RTCSessionDescription({
                    type: 'offer',
                    sdp: data.sdp
                }));
                await flushPendingIceCandidates(pc);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                controller.socket.emit('camera:answer', {
                    sdp: answer.sdp,
                    clientId: mainClientId
                });
            } catch (error) {
                log.error('[RemoteCameraPanel] Failed to handle camera offer:', error);
                if (pc && pc.connectionState !== 'closed') {
                    pc.close();
                }
                setPeerConnection(null);
                connectingSinceRef.current = 0;
                streamRequestSentAtRef.current = 0;
                setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
            }
        };

        const handleCameraAnswer = async (data: { sdp: string; clientId: string }) => {
            const currentPeer = peerConnectionRef.current;
            if (!currentPeer) {
                return;
            }

            try {
                await currentPeer.setRemoteDescription(new RTCSessionDescription({
                    type: 'answer',
                    sdp: data.sdp
                }));
            } catch (error) {
                log.error('[RemoteCameraPanel] Failed to handle camera answer:', error);
                setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
            }
        };

        const handleCameraIce = async (data: { candidate: RTCIceCandidateInit; clientId: string }) => {
            const currentPeer = peerConnectionRef.current;
            if (!currentPeer) {
                pendingIceCandidatesRef.current.push(data.candidate);
                if (pendingIceCandidatesRef.current.length > 100) {
                    pendingIceCandidatesRef.current.shift();
                }
                return;
            }

            const state = currentPeer.signalingState;
            if (state === 'closed' || currentPeer.remoteDescription === null) {
                pendingIceCandidatesRef.current.push(data.candidate);
                if (pendingIceCandidatesRef.current.length > 100) {
                    pendingIceCandidatesRef.current.shift();
                }
                return;
            }

            try {
                await currentPeer.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                log.error('[RemoteCamera] Failed to add ICE candidate:', error);
            }
        };

        const handleCameraError = (data: { message: string }) => {
            autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
            streamRequestSentAtRef.current = 0;
            setConnectionState({ state: 'failed', error: data.message });
        };

        const handleSocketConnect = () => {
            setConnectionState({ state: 'disconnected' });
            autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
            checkCameraStatus();
        };

        const handleSocketDisconnect = () => {
            disconnectFromCamera();
            autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
        };

        let socketListenersBound = false;
        let socketBindingTimer: ReturnType<typeof setInterval> | null = null;
        const bindSocketListeners = () => {
            const socket = controller.socket;
            if (!socket || socketListenersBound) {
                return;
            }

            socket.on('camera:availability', handleCameraAvailability);
            socket.on('camera:offer', handleCameraOffer);
            socket.on('camera:answer', handleCameraAnswer);
            socket.on('camera:ice', handleCameraIce);
            socket.on('camera:error', handleCameraError);
            socket.on('connect', handleSocketConnect);
            socket.on('disconnect', handleSocketDisconnect);
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
            autoConnectStopped = true;
            if (autoConnectTimer) {
                clearTimeout(autoConnectTimer);
            }
            if (socketBindingTimer) {
                clearInterval(socketBindingTimer);
            }

            const socket = controller.socket;
            if (socket) {
                socket.off('camera:availability', handleCameraAvailability);
                socket.off('camera:offer', handleCameraOffer);
                socket.off('camera:answer', handleCameraAnswer);
                socket.off('camera:ice', handleCameraIce);
                socket.off('camera:error', handleCameraError);
                socket.off('connect', handleSocketConnect);
                socket.off('disconnect', handleSocketDisconnect);
            }

            const currentPeer = peerConnectionRef.current;
            if (currentPeer && currentPeer.connectionState !== 'closed') {
                currentPeer.close();
                setPeerConnection(null);
                if (controller.socket?.connected) {
                    controller.socket.emit('camera:viewerDisconnect');
                }
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            streamRef.current = null;
            pendingIceCandidatesRef.current = [];
            connectingSinceRef.current = 0;
            streamRequestSentAtRef.current = 0;
            autoRetryDelayRef.current = AUTO_RETRY_BASE_DELAY_MS;
        };
    }, []);

    return {
        cameraStatus,
        connectionState,
        videoRef,
    };
};
