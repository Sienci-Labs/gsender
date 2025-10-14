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

import { authorizeIPAddress } from '../access-control';
import config from '../services/configstore';
import logger from '../lib/logger';

const log = logger('api:camera');

// Camera streaming state
let cameraState = {
    enabled: false,
    available: false,
    transport: 'webrtc',
    viewers: 0,
    constraints: {
        width: 1280,
        height: 720,
        frameRate: 30,
    },
};

const isRemoteAccessAllowed = (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;

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

    const allowedIP = remoteSettings.ip;
    return clientIP === allowedIP || authorizeIPAddress(clientIP);
};

const checkOriginAndHost = (req) => {
    const remoteSettings = config.get('remoteSettings', {});
    const allowedIP = remoteSettings.ip;

    const origin = req.get('Origin');

    // Allow localhost for development
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    // Check if origin matches allowed remote access configuration
    if (origin) {
        const originUrl = new URL(origin);
        const isAllowedOrigin = originUrl.hostname === allowedIP ||
                               originUrl.hostname === 'localhost' ||
                               originUrl.hostname === '127.0.0.1';

        if (!isAllowedOrigin) {
            return false;
        }
    }

    return true;
};

export const getStatus = (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress;
        // Reduced logging to prevent spam - only log non-localhost requests
        if (clientIP !== '127.0.0.1' && clientIP !== '::1') {
            // Only log every 10th request to reduce spam
            if (!global.cameraStatusLogCounter) {
                global.cameraStatusLogCounter = 0;
            }
            global.cameraStatusLogCounter++;
            if (global.cameraStatusLogCounter % 10 === 0) {
                log.debug(`Camera status request from IP: ${clientIP} (${global.cameraStatusLogCounter} total)`);
            }
        }

        // Check access control
        if (!isRemoteAccessAllowed(req)) {
            log.warn(`Camera status access denied for IP: ${clientIP}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check origin and host headers
        if (!checkOriginAndHost(req)) {
            log.warn(`Camera status invalid origin for IP: ${clientIP}`);
            return res.status(403).json({ error: 'Invalid origin' });
        }

        return res.json(cameraState);
    } catch (error) {
        log.error('Error getting camera status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateStatus = (newState) => {
    cameraState = { ...cameraState, ...newState };
    log.debug('Camera state updated:', cameraState);
};

export const getCameraState = () => cameraState;
