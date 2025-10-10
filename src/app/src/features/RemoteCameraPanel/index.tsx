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
import { FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import cx from 'classnames';
import controller from 'app/lib/controller';

interface CameraStatus {
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

interface ConnectionState {
    state: 'disconnected' | 'connecting' | 'connected' | 'failed';
    error?: string;
}

const RemoteCameraPanel: React.FC = () => {
    
    const [cameraStatus, setCameraStatus] = useState<CameraStatus | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>({ state: 'disconnected' });
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Keep ref in sync with state
    useEffect(() => {
        peerConnectionRef.current = peerConnection;
    }, [peerConnection]);

    /**
     * Sets up unmute event handlers for initially muted video tracks.
     * This handles cases where tracks are muted at connection time and need
     * a video element reload when they become unmuted.
     */
    const setupUnmuteHandlers = (stream: MediaStream) => {
        const videoTracks = stream.getVideoTracks();
        const UNMUTE_TIMEOUT = 10000; // Stop waiting after 10 seconds
        
        videoTracks.forEach((track) => {
            if (!track.muted) return;

            const handleUnmute = () => {
                // Reload video element to display newly unmuted track
                if (videoRef.current && streamRef.current) {
                    const currentStream = streamRef.current;
                    videoRef.current.srcObject = null;
                    videoRef.current.load();
                    
                    // Restore stream and play after brief delay
                    setTimeout(() => {
                        if (videoRef.current) {
                            videoRef.current.srcObject = currentStream;
                            videoRef.current.play().catch((error) => {
                                console.debug('RemoteCameraPanel: Play after unmute failed:', error.message);
                            });
                        }
                    }, 100);
                }
                
                track.removeEventListener('unmute', handleUnmute);
            };
            
            track.addEventListener('unmute', handleUnmute);
            
            // Clean up listener if track doesn't unmute within timeout
            setTimeout(() => {
                track.removeEventListener('unmute', handleUnmute);
            }, UNMUTE_TIMEOUT);
        });
    };

    useEffect(() => {
        // Check camera status on mount with retry for socket connection
        const checkWithRetry = async (attempts = 3) => {
            await checkCameraStatus();
            
            // If socket is not connected and we have attempts left, retry after a delay
            if (!controller.socket?.connected && attempts > 1) {
                setTimeout(() => checkWithRetry(attempts - 1), 1000);
            }
        };
        
        checkWithRetry();

        // Set up periodic auto-connect check
        const autoConnectInterval = setInterval(() => {
            // Check connection state using refs to avoid stale closures
            const currentPeer = peerConnectionRef.current;
            const shouldConnect = !currentPeer || currentPeer.connectionState === 'closed' || currentPeer.connectionState === 'failed';
            
            // Try to connect if we don't have an active connection and camera is available
            if (shouldConnect && controller.socket?.connected) {
                // Check camera status first
                checkCameraStatus();
            }
        }, 2000); // Check every 2 seconds

        // Set up socket listeners
        const handleCameraAvailability = (data: { available: boolean; transport: string }) => {
            setCameraStatus(prev => prev ? { ...prev, available: data.available } : null);
            
            if (data.available && controller.socket?.connected) {
                const currentPeer = peerConnectionRef.current;
                const shouldConnect = !currentPeer || currentPeer.connectionState === 'closed' || currentPeer.connectionState === 'failed';
                if (shouldConnect) {
                    connectToCamera();
                }
            } else if (!data.available) {
                disconnectFromCamera();
            }
        };

            const handleCameraOffer = async (data: { sdp: string; clientId: string }) => {
                // data.clientId is the MAIN client's socket ID (who we send answer/ICE candidates to)
                const mainClientId = data.clientId;
                
                // If we already have a peer connection, check its state
                const currentPeer = peerConnectionRef.current;
                if (currentPeer) {
                    const state = currentPeer.signalingState;
                    const iceState = currentPeer.iceConnectionState;
                    
                    // If connection is active and working, ignore new offers
                    if ((state === 'stable' && (iceState === 'connected' || iceState === 'completed')) ||
                        (state !== 'closed' && state !== 'stable')) {
                        return;
                    }
                    
                    // Only close if connection is failed or closed
                    if (state !== 'closed') {
                        currentPeer.close();
                    }
                    setPeerConnection(null);
                }
                
                try {
                    // Create a new peer connection
                    const pc = new RTCPeerConnection({ iceServers: [] });
                    
                    // Set up handlers
                    pc.ontrack = (event) => {
                        if (videoRef.current && event.streams[0]) {
                            const stream = event.streams[0];
                            
                            // Set video element properties and stream
                            videoRef.current.muted = true;
                            videoRef.current.volume = 1.0;
                            videoRef.current.srcObject = stream;
                            streamRef.current = stream;
                            
                            setConnectionState({ state: 'connected' });
                            
                            // Attempt to auto-play
                            if (videoRef.current) {
                                videoRef.current.play().catch((error) => {
                                    console.warn('[RemoteCamera] Video play failed:', error);
                                });
                            }
                        } else {
                            console.warn('[RemoteCamera] ontrack event but no video ref or stream');
                        }
                    };
                    
                    pc.onicecandidate = (event) => {
                        if (event.candidate && controller.socket) {
                            controller.socket.emit('camera:ice', {
                                candidate: event.candidate.toJSON(),
                                clientId: mainClientId  // Send to MAIN client
                            });
                        }
                    };
                    
                    pc.oniceconnectionstatechange = () => {
                        const state = pc.iceConnectionState;
                        if (state === 'failed' || state === 'disconnected') {
                            setConnectionState({ state: 'failed', error: `Connection ${state}` });
                        }
                    };
                    
                    // Update state with new peer connection
                    setPeerConnection(pc);
                    
                    // Handle the offer
                    await pc.setRemoteDescription(new RTCSessionDescription({
                        type: 'offer',
                        sdp: data.sdp
                    }));

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    controller.socket.emit('camera:answer', {
                        sdp: answer.sdp,
                        clientId: mainClientId  // Send to MAIN client
                    });
                } catch (error) {
                    console.error('RemoteCameraPanel: Failed to handle camera offer:', error);
                    setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
                }
            };

        const handleCameraAnswer = async (data: { sdp: string; clientId: string }) => {
            const currentPeer = peerConnectionRef.current;
            if (!currentPeer) return;
            
            try {
                await currentPeer.setRemoteDescription(new RTCSessionDescription({
                    type: 'answer',
                    sdp: data.sdp
                }));
            } catch (error) {
                console.error('Failed to handle camera answer:', error);
                setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
            }
        };

        const handleCameraIce = async (data: { candidate: RTCIceCandidateInit; clientId: string }) => {
            const currentPeer = peerConnectionRef.current;
            if (!currentPeer) {
                console.warn('[RemoteCamera] No peer connection available for ICE candidate');
                return;
            }
            
            // Check if peer connection is in a valid state for ICE candidates
            const state = currentPeer.signalingState;
            if (state === 'closed' || currentPeer.remoteDescription === null) {
                // Silently ignore ICE candidates that arrive before the connection is ready
                return;
            }
            
            try {
                await currentPeer.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('[RemoteCamera] Failed to add ICE candidate:', error);
            }
        };

        const handleCameraError = (data: { message: string }) => {
            setConnectionState({ state: 'failed', error: data.message });
        };

        const handleSocketConnect = () => {
            // Reset connection state when socket reconnects
            setConnectionState({ state: 'disconnected' });
            
            // Check camera status after reconnection
            checkCameraStatus();
        };

        controller.socket.on('camera:availability', handleCameraAvailability);
        controller.socket.on('camera:offer', handleCameraOffer);
        controller.socket.on('camera:answer', handleCameraAnswer);
        controller.socket.on('camera:ice', handleCameraIce);
        controller.socket.on('camera:error', handleCameraError);
        controller.socket.on('connect', handleSocketConnect);

        return () => {
            clearInterval(autoConnectInterval);
            
            controller.socket.off('camera:availability', handleCameraAvailability);
            controller.socket.off('camera:offer', handleCameraOffer);
            controller.socket.off('camera:answer', handleCameraAnswer);
            controller.socket.off('camera:ice', handleCameraIce);
            controller.socket.off('camera:error', handleCameraError);
            controller.socket.off('connect', handleSocketConnect);
            
            // Clean up peer connection on unmount
            const currentPeer = peerConnectionRef.current;
            if (currentPeer && currentPeer.connectionState !== 'closed') {
                currentPeer.close();
                setPeerConnection(null);
                
                // Notify server that we're disconnecting
                if (controller.socket?.connected) {
                    controller.socket.emit('camera:viewerDisconnect');
                }
            }
            
            // Clean up video element
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            streamRef.current = null;
        };
        }, []);

    const checkCameraStatus = async () => {
        try {
            const response = await fetch('/api/camera/status');
            if (response.ok) {
                const status = await response.json();
                setCameraStatus(status);
                
                // Check if we should initiate connection
                if (status.available && controller.socket?.connected) {
                    const currentPeer = peerConnectionRef.current;
                    const shouldConnect = !currentPeer || currentPeer.connectionState === 'closed' || currentPeer.connectionState === 'failed';
                    
                    if (shouldConnect) {
                        connectToCamera();
                    }
                }
            } else {
                console.warn('RemoteCameraPanel: Failed to fetch camera status:', response.status);
            }
        } catch (error) {
            console.warn('RemoteCameraPanel: Failed to check camera status:', error);
        }
    };

    const connectToCamera = async () => {        
        // Use refs to check current state instead of closure values
        const currentPeer = peerConnectionRef.current;
        
        // Prevent multiple simultaneous connection attempts
        if (currentPeer && currentPeer.connectionState !== 'closed' && currentPeer.connectionState !== 'failed') {
            return;
        }
        
        // Check socket connection first
        if (!controller.socket?.connected) {
            console.error('[RemoteCamera] Cannot request stream - socket not connected');
            setConnectionState({ state: 'failed', error: 'Socket not connected' });
            return;
        }
        
        setConnectionState({ state: 'connecting' });

        try {
            // Remote client requests to join the stream
            // The peer connection will be created when we receive the offer from the main client
            controller.socket.emit('camera:requestStream', {
                clientId: controller.socket.id
            });

        } catch (error) {
            console.error('[RemoteCamera] Error in connectToCamera:', error);
            setConnectionState({ state: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
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
        setConnectionState({ state: 'disconnected' });
    };

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
