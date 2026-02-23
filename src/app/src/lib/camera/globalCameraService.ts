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

import CameraService from 'app/services/CameraService';
import store from 'app/store';
import controller from 'app/lib/controller';
import log from 'app/lib/log';
import { initializeCameraWebRTC } from './webrtcHandlers';

// Global camera service instance
let globalCameraService: CameraService | null = null;
let hasRegisteredCameraSocketSync = false;

const syncCameraStateToServer = (): void => {
  if (!globalCameraService || !controller.socket?.connected) {
    return;
  }

  const settings = globalCameraService.getSettings();
  const status = globalCameraService.getStatus();

  log.debug('[GlobalCameraService] Syncing camera state to server:', {
    streaming: status.streaming,
    enabled: settings.enabled,
    hasDeviceId: Boolean(settings.deviceId),
    socketId: controller.socket.id
  });
  controller.socket.emit('camera:updateSettings', settings);
  controller.socket.emit(status.streaming ? 'camera:startStream' : 'camera:stopStream');
};

// Initialize the global camera service
export const initializeGlobalCameraService = async (): Promise<CameraService> => {
  if (globalCameraService) {
    return globalCameraService;
  }

  globalCameraService = new CameraService();

  try {
    // Load settings from store FIRST to check if camera is enabled
    const storedSettings = store.get('workspace.camera');

    if (storedSettings) {
      globalCameraService.updateSettings(storedSettings);
    }

    // Only initialize (request permission) if camera is enabled
    // This prevents requesting permission on first launch when feature is disabled
    if (storedSettings?.enabled) {
      // Initialize the camera service (enumerate devices and request permission)
      await globalCameraService.initialize();
    }

    // Initialize WebRTC handlers AFTER settings are loaded
    initializeCameraWebRTC(globalCameraService);
    if (!hasRegisteredCameraSocketSync) {
      controller.addListener('connect', syncCameraStateToServer);
      hasRegisteredCameraSocketSync = true;
    }

    // Auto-start streaming if enabled and device is selected
    if (storedSettings?.enabled && storedSettings?.deviceId) {
      try {
        // Re-enumerate devices to ensure we have current device IDs
        await globalCameraService.enumerateDevices();
        const availableDevices = globalCameraService.getDevices();

        // Check if the stored deviceId still exists
        const deviceExists = availableDevices.some(device => device.deviceId === storedSettings.deviceId);

        if (!deviceExists && availableDevices.length > 0) {
          log.warn('[GlobalCameraService] Stored device no longer available, using first available device');
          // Update to first available device
          const firstDevice = availableDevices[0];
          const updatedSettings = {
            ...storedSettings,
            deviceId: firstDevice.deviceId,
          };
          globalCameraService.updateSettings(updatedSettings);
          store.set('workspace.camera', updatedSettings);
        } else if (!deviceExists) {
          log.warn('[GlobalCameraService] No camera devices available, skipping auto-start');
          return globalCameraService;
        }

        log.debug('[GlobalCameraService] Attempting to auto-start camera streaming with device:', globalCameraService.getSettings().deviceId);
        await globalCameraService.startStream();
        log.info('[GlobalCameraService] Camera streaming auto-started successfully');

        // Notify server about the streaming status
        if (controller.socket?.connected) {
          syncCameraStateToServer();
        } else {
          log.warn('[GlobalCameraService] Socket not connected, will notify server when connection is established');
        }
      } catch (error) {
        log.error('[GlobalCameraService] Failed to auto-start camera streaming:', error);

        // Extract user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Disable camera streaming in settings since auto-start failed
        globalCameraService.updateSettings({ ...globalCameraService.getSettings(), enabled: false });
        store.set('workspace.camera.enabled', false);

        // Log warning to help user understand what happened
        log.warn(
          '[GlobalCameraService] Camera streaming disabled due to auto-start failure.',
          'You can manually enable it from the Camera page.',
          'Error details:', errorMessage
        );
      }
    }

    return globalCameraService;
  } catch (error) {
    log.error('[GlobalCameraService] Failed to initialize:', error);
    throw error;
  }
};

// Get the global camera service instance
export const getGlobalCameraService = (): CameraService | null => {
  return globalCameraService;
};

// Cleanup function (for completeness)
export const cleanupGlobalCameraService = (): void => {
  if (globalCameraService) {
    globalCameraService.stopStream();
    globalCameraService = null;
  }
  if (hasRegisteredCameraSocketSync) {
    controller.removeListener('connect', syncCameraStateToServer);
    hasRegisteredCameraSocketSync = false;
  }
};
