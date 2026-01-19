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

import { authorizeIPAddress } from '../../access-control';
import config from '../configstore';
import logger from '../../lib/logger';
import { updateStatus, getCameraState } from '../../api/api.camera';

const log = logger('camera:signaling');

/**
 * @typedef {Object} CameraOfferData
 * @property {string} sdp - Session Description Protocol offer
 * @property {string} clientId - ID of the target client
 */

/**
 * @typedef {Object} CameraAnswerData
 * @property {string} sdp - Session Description Protocol answer
 * @property {string} clientId - ID of the target client
 */

/**
 * @typedef {Object} CameraIceData
 * @property {RTCIceCandidateInit} candidate - ICE candidate
 * @property {string} clientId - ID of the target client
 */

/**
 * Camera signaling service for WebRTC connections between main client and remote viewers.
 * Handles offer/answer exchange and ICE candidate forwarding for camera streaming.
 */
class CameraSignaling {
    constructor() {
        /** @type {import('socket.io').Server | null} */
        this.io = null;

        /** @type {Map<string, import('socket.io').Socket>} clientId -> socket */
        this.activeConnections = new Map();
    }

    /**
     * Initializes the signaling service with a Socket.IO server instance.
     * @param {import('socket.io').Server} io - Socket.IO server instance
     */
    initialize(io) {
        this.io = io;
        this.setupSocketHandlers();
        log.info('Camera signaling service initialized');
    }

    /**
     * Sets up socket event handlers for incoming connections.
     * @private
     */
    setupSocketHandlers() {
        if (!this.io) {
            return;
        }

        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    /**
     * Handles new client connections and sets up camera event listeners.
     * @param {import('socket.io').Socket} socket - Connected socket
     * @private
     */
    handleConnection(socket) {
        const clientIP = socket.handshake.address;

        // Check if client is authorized for camera access
        if (!this.isClientAuthorized(clientIP)) {
            log.warn(`Unauthorized camera access attempt from ${clientIP}`);
            socket.disconnect();
            return;
        }

        this.activeConnections.set(socket.id, socket);

        // Set up camera-specific event handlers
        socket.on('camera:offer', (data) => this.handleOffer(socket, data));
        socket.on('camera:answer', (data) => this.handleAnswer(socket, data));
        socket.on('camera:ice', (data) => this.handleIceCandidate(socket, data));
        socket.on('camera:requestStream', (data) => this.handleStreamRequest(socket, data));
        socket.on('camera:requestStatus', () => this.handleStatusRequest(socket));
        socket.on('camera:viewerDisconnect', () => this.handleViewerDisconnect(socket));

        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });

        // Send current camera availability
        this.sendAvailability(socket);
    }

    /**
     * Handles explicit viewer disconnect event.
     * Notifies main client to clean up peer connection.
     * @param {import('socket.io').Socket} socket - Disconnecting socket
     * @private
     */
    handleViewerDisconnect(socket) {
        // Broadcast to all clients (especially main client) that this viewer disconnected
        this.io.emit('camera:viewerDisconnected', {
            viewerId: socket.id
        });
    }

    /**
     * Handles client disconnection and cleans up connection tracking.
     * @param {import('socket.io').Socket} socket - Disconnected socket
     * @private
     */
    handleDisconnection(socket) {
        this.activeConnections.delete(socket.id);
    }

    /**
     * Handles WebRTC offer from main client (camera source) to remote viewer.
     * Forwards the offer to the requesting client to establish peer connection.
     * @param {import('socket.io').Socket} socket - Socket of the main client sending the offer
     * @param {CameraOfferData} data - Offer data containing SDP and target client ID
     * @private
     */
    handleOffer(socket, data) {
        const { sdp, clientId } = data;

        // Forward offer to the specific remote client that requested the stream
        const targetSocket = this.activeConnections.get(clientId);
        if (targetSocket) {
            targetSocket.emit('camera:offer', { sdp, clientId: socket.id });
        } else {
            socket.emit('camera:error', { message: 'Target client not found' });
        }
    }

    /**
     * Handles WebRTC answer from remote viewer to main client.
     * Forwards the answer to complete peer connection establishment.
     * @param {import('socket.io').Socket} socket - Socket of the remote client sending the answer
     * @param {CameraAnswerData} data - Answer data containing SDP and target client ID
     * @private
     */
    handleAnswer(socket, data) {
        const { sdp, clientId } = data;

        log.debug(`Received camera answer for client ${clientId}`);

        // Forward answer to the specific client
        const targetSocket = this.activeConnections.get(clientId);
        if (targetSocket) {
            targetSocket.emit('camera:answer', { sdp, clientId: socket.id });
        }
    }

    /**
     * Handles ICE candidate exchange between peers.
     * Forwards ICE candidates to establish optimal peer connection.
     * @param {import('socket.io').Socket} socket - Socket sending the ICE candidate
     * @param {CameraIceData} data - ICE candidate data
     * @private
     */
    handleIceCandidate(socket, data) {
        const { candidate, clientId } = data;

        if (clientId) {
            // Forward ICE candidate to specific client
            const targetSocket = this.activeConnections.get(clientId);
            if (targetSocket) {
                targetSocket.emit('camera:ice', { candidate, clientId: socket.id });
            }
        } else {
            // Broadcast ICE candidate (for offers from main client)
            socket.broadcast.emit('camera:ice', { candidate, clientId: socket.id });
        }
    }

    /**
     * Handles camera status requests from clients.
     * @param {import('socket.io').Socket} socket - Requesting socket
     * @private
     */
    handleStatusRequest(socket) {
        const status = getCameraState();
        socket.emit('camera:status', status);
    }

    /**
     * Handles stream requests from remote viewers.
     * Broadcasts the request to all clients so the main client can respond with an offer.
     * @param {import('socket.io').Socket} socket - Requesting socket
     * @param {Object} data - Request data (currently unused)
     * @private
     */
    handleStreamRequest(socket, data) {
        // Check if camera is available
        const status = getCameraState();
        if (!status.available) {
            socket.emit('camera:error', { message: 'Camera not available' });
            return;
        }

        // Send the request to all clients (including the sender)
        // The main client (with camera) should respond with an offer
        this.io.emit('camera:streamRequest', {
            requesterId: socket.id
        });
    }

    /**
     * Broadcasts camera availability status to all connected clients.
     * @param {boolean} available - Whether camera is available for streaming
     */
    broadcastAvailability(available) {
        const status = { available, transport: 'webrtc' };
        this.io.emit('camera:availability', status);
        updateStatus({ available });
        log.debug(`Broadcasting camera availability: ${available}`);
    }

    /**
     * Sends camera availability status to a specific client.
     * @param {import('socket.io').Socket} socket - Target socket
     * @private
     */
    sendAvailability(socket) {
        const status = getCameraState();
        socket.emit('camera:availability', {
            available: status.available,
            transport: status.transport
        });
    }

    /**
     * Updates and broadcasts the current viewer count.
     * @param {number} count - Number of active viewers
     * @private
     */
    updateViewerCount(count) {
        updateStatus({ viewers: count });
        this.io.emit('camera:metrics', { viewers: count });
    }

    /**
     * Broadcasts camera streaming metrics to all clients.
     * @param {Object} metrics - Streaming metrics (fps, bitrate, etc.)
     */
    broadcastMetrics(metrics) {
        this.io.emit('camera:metrics', metrics);
        updateStatus({ ...getCameraState(), ...metrics });
    }

    /**
     * Checks if a client IP address is authorized for camera access.
     * Allows localhost and local network addresses by default.
     * @param {string} clientIP - Client IP address
     * @returns {boolean} Whether the client is authorized
     * @private
     */
    isClientAuthorized(clientIP) {
        // Always allow localhost
        if (clientIP === '127.0.0.1' || clientIP === '::1') {
            return true;
        }

        // Allow local network addresses
        const isLocalNetwork =
            clientIP.startsWith('192.168.') ||
            clientIP.startsWith('10.') ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clientIP);

        if (isLocalNetwork) {
            return true;
        }

        // For non-local networks, check remote access settings
        const remoteSettings = config.get('remoteSettings', {});
        if (!remoteSettings.headlessStatus) {
            return false;
        }

        // Allow configured remote IP
        const allowedIP = remoteSettings.ip;
        return clientIP === allowedIP || authorizeIPAddress(clientIP);
    }
}

export default CameraSignaling;
