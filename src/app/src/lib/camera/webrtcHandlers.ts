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

import controller from 'app/lib/controller';
import CameraService from 'app/services/CameraService';

// Global camera service instance
let cameraService: CameraService | null = null;

// Track active peer connections by client ID to prevent duplicates
const activePeerConnections = new Map<string, RTCPeerConnection>();

// WebRTC handlers that need to persist globally
const handleStreamRequest = async (data: { requesterId: string }) => {
  if (!cameraService) {
    console.warn('[MainCamera] No camera service available for stream request');
    return;
  }

  // Check if we already have an active connection for this client
  const existingPeer = activePeerConnections.get(data.requesterId);
  if (existingPeer) {
    // Always close and recreate connection for new requests
    // This ensures reconnections work as fast as first load
    existingPeer.close();
    activePeerConnections.delete(data.requesterId);
  }

  const freshStatus = cameraService.getStatus();

  if (!freshStatus.streaming) {
    console.warn('[MainCamera] Not streaming, ignoring stream request from', data.requesterId);
    return;
  }

  try {
    // Create peer connection for the requesting client
    const peerConnection = await cameraService.createPeerConnection();

    // Store the peer connection for this client
    activePeerConnections.set(data.requesterId, peerConnection);

    // Listen for ICE candidates on this specific peer connection, not the service
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && controller.socket?.connected) {
        controller.socket.emit('camera:ice', {
          candidate: event.candidate.toJSON(),
          clientId: data.requesterId
        });
      }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    if (controller.socket?.connected) {
      controller.socket.emit('camera:offer', {
        sdp: offer.sdp,
        clientId: data.requesterId
      });
    } else {
      console.error('[MainCamera] Socket not connected, cannot send offer');
    }
  } catch (error) {
    console.error('[MainCamera] Failed to create offer for stream request:', error);
  }
};

const handleCameraAnswer = async (data: { sdp: string; clientId: string }) => {
  if (!cameraService) {
    console.warn('[MainCamera] No camera service available for answer');
    return;
  }

  // Get the peer connection for this specific client
  const peerConnection = activePeerConnections.get(data.clientId);
  if (!peerConnection) {
    console.warn('[MainCamera] No peer connection found for client:', data.clientId);
    return;
  }

  try {
    const state = peerConnection.signalingState;

    // Only set remote description if we're expecting an answer
    if (state !== 'have-local-offer') {
      console.warn('[MainCamera] Cannot set answer - peer connection in wrong state:', state);
      return;
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: data.sdp
    }));
  } catch (error) {
    console.error('[MainCamera] Failed to handle camera answer:', error);
  }
};

const handleCameraIce = async (data: { candidate: RTCIceCandidateInit; clientId: string }) => {
  if (!cameraService) {
    console.warn('[MainCamera] No camera service available for ICE candidate');
    return;
  }

  // Get the peer connection for this specific client
  const peerConnection = activePeerConnections.get(data.clientId);
  if (!peerConnection) {
    console.warn('[MainCamera] No peer connection found for client:', data.clientId);
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } catch (error) {
    console.error('[MainCamera] Failed to add ICE candidate:', error);
  }
};

// Handle viewer disconnect - clean up peer connections for that viewer
const handleViewerDisconnect = (data: { viewerId: string }) => {
  const peerConnection = activePeerConnections.get(data.viewerId);
  if (peerConnection) {
    peerConnection.close();
    activePeerConnections.delete(data.viewerId);
  }
};

// Initialize global camera WebRTC handlers
export const initializeCameraWebRTC = (cameraServiceInstance: CameraService) => {
  cameraService = cameraServiceInstance;

  // Register socket event handlers that will persist globally
  if (controller.socket?.connected) {
    registerHandlers();
  }

  // Also register on future socket connections
  controller.addListener('connect', registerHandlers);
};

// Register the handlers with the socket
const registerHandlers = () => {
  if (!controller.socket?.connected) {
    return;
  }

  // Remove existing handlers first to avoid duplicates
  controller.socket.off('camera:streamRequest', handleStreamRequest);
  controller.socket.off('camera:answer', handleCameraAnswer);
  controller.socket.off('camera:ice', handleCameraIce);
  controller.socket.off('camera:viewerDisconnected', handleViewerDisconnect);

  // Register the handlers
  controller.socket.on('camera:streamRequest', handleStreamRequest);
  controller.socket.on('camera:answer', handleCameraAnswer);
  controller.socket.on('camera:ice', handleCameraIce);
  controller.socket.on('camera:viewerDisconnected', handleViewerDisconnect);
};

// Cleanup function (optional, for completeness)
export const cleanupCameraWebRTC = () => {
  if (controller.socket) {
    controller.socket.off('camera:streamRequest', handleStreamRequest);
    controller.socket.off('camera:answer', handleCameraAnswer);
    controller.socket.off('camera:ice', handleCameraIce);
  }

  controller.removeListener('connect', registerHandlers);
  cameraService = null;
};
