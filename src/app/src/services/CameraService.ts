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

import { EventEmitter } from 'events';

export interface CameraConstraints {
  width: number;
  height: number;
  frameRate: number;
}

export interface CameraSettings {
  enabled: boolean;
  deviceId: string;
  constraints: CameraConstraints;
  qualityPreset: 'low' | 'medium' | 'high';
}

export interface CameraMetrics {
  fps: number;
  bitrateKbps: number;
  viewers: number;
  droppedFrames: number;
}

export interface CameraStatus {
  enabled: boolean;
  available: boolean;
  streaming: boolean;
  error: string | null;
  metrics: CameraMetrics;
}

export const QUALITY_PRESETS = {
  low: { width: 640, height: 480, frameRate: 15, bitrate: 500 },
  medium: { width: 1280, height: 720, frameRate: 30, bitrate: 1500 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 3000 },
};

class CameraService extends EventEmitter {
  private stream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private settings: CameraSettings;
  private status: CameraStatus;
  private devices: MediaDeviceInfo[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private lastBytesReceived = 0;
  private lastTimestamp = 0;

  constructor() {
    super();
    this.settings = {
      enabled: false,
      deviceId: '',
      constraints: QUALITY_PRESETS.medium,
      qualityPreset: 'medium',
    };
    this.status = {
      enabled: false,
      available: false,
      streaming: false,
      error: null,
      metrics: {
        fps: 0,
        bitrateKbps: 0,
        viewers: 0,
        droppedFrames: 0,
      },
    };
  }

  /**
   * Initializes the camera service by requesting permissions and enumerating devices.
   * This method should be called once before attempting to start streaming.
   * 
   * @throws Will set an error status if initialization fails
   * @emits initialized - When initialization completes successfully
   * @emits devicesChanged - When camera devices are enumerated
   */
  async initialize(): Promise<void> {
    try {
      // Request temporary camera access to trigger permission prompt
      // This allows enumerateDevices() to return device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // Immediately stop the temporary stream
        tempStream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.warn('[CameraService] Camera permission not granted, device labels may be unavailable:', permissionError);
        // Continue anyway - devices will be enumerated but may have generic labels
      }

      await this.enumerateDevices();
      this.emit('initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.setError(`Failed to initialize camera service: ${message}`);
    }
  }

  /**
   * Enumerates all available video input devices (cameras).
   * 
   * @returns Promise resolving to array of available camera devices
   * @emits devicesChanged - When the device list is updated
   */
  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      this.emit('devicesChanged', this.devices);
      return this.devices;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.setError(`Failed to enumerate devices: ${message}`);
      return [];
    }
  }

  /**
   * Gets the list of available camera devices.
   * @returns Array of video input device info
   */
  getDevices(): MediaDeviceInfo[] {
    return this.devices;
  }

  /**
   * Gets the current camera settings.
   * @returns Copy of current settings object
   */
  getSettings(): CameraSettings {
    return { ...this.settings };
  }

  /**
   * Gets the current camera status including streaming state and metrics.
   * @returns Copy of current status object
   */
  getStatus(): CameraStatus {
    return { ...this.status };
  }

  /**
   * Updates camera settings. If streaming is active and device/constraints change, 
   * automatically restarts the stream with new settings.
   * 
   * @param newSettings - Partial settings object to merge with current settings
   * @emits settingsChanged - When settings are updated
   * @emits statusChanged - When enabled state changes
   */
  updateSettings(newSettings: Partial<CameraSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Apply quality preset if changed
    if (newSettings.qualityPreset && newSettings.qualityPreset !== oldSettings.qualityPreset) {
      this.settings.constraints = { ...QUALITY_PRESETS[newSettings.qualityPreset] };
    }

    // Update status to match settings
    if (newSettings.enabled !== undefined) {
      this.status.enabled = newSettings.enabled;
    }

    this.emit('settingsChanged', this.settings);
    this.emit('statusChanged', this.status);

    // Restart streaming if device or constraints changed while streaming
    if (this.status.streaming && (
      newSettings.deviceId !== oldSettings.deviceId ||
      JSON.stringify(newSettings.constraints) !== JSON.stringify(oldSettings.constraints)
    )) {
      this.restartStream();
    }
  }

  /**
   * Starts camera streaming with the currently configured device and settings.
   * Acquires camera access and begins broadcasting to connected viewers.
   * 
   * @throws Error if camera cannot be accessed or constraints cannot be satisfied
   * @emits streamStarted - When stream starts successfully
   * @emits statusChanged - When streaming status changes
   */
  async startStream(): Promise<void> {
    if (this.status.streaming) {
      return;
    }

    try {
      this.clearError();

      if (!this.settings.deviceId) {
        throw new Error('No camera device selected');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: this.settings.deviceId },
          width: { ideal: this.settings.constraints.width },
          height: { ideal: this.settings.constraints.height },
          frameRate: { ideal: this.settings.constraints.frameRate },
        },
        audio: false,
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError: any) {
        // Try fallback device if specific device constraint fails
        this.stream = await this.tryFallbackDevice(constraintError);
      }

      this.status.streaming = true;
      this.status.available = true;

      this.startMetricsCollection();
      this.emit('streamStarted', this.stream);
      this.emit('statusChanged', this.status);
    } catch (error) {
      // Better error message extraction with user-friendly messages
      let message = 'Unknown error';
      let userFriendlyMessage = '';

      if (error instanceof Error) {
        message = error.message;

        // Provide helpful messages for common errors
        if (error.name === 'NotReadableError') {
          userFriendlyMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (error.name === 'NotAllowedError') {
          userFriendlyMessage = 'Camera access denied. Please grant camera permission in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          userFriendlyMessage = 'Camera device not found. Please check that your camera is connected.';
        } else if (error.name === 'OverconstrainedError') {
          userFriendlyMessage = 'Camera does not support the requested settings. Try a different resolution or frame rate.';
        }
      } else if (error && typeof error === 'object' && 'name' in error) {
        const errorWithMessage = error as { name: unknown; message?: string };
        message = `${errorWithMessage.name}: ${errorWithMessage.message || 'No message'}`;
      } else if (typeof error === 'string') {
        message = error;
      }

      console.error('[CameraService] Failed to start stream:', error);
      const errorMessage = userFriendlyMessage || `Failed to start camera stream: ${message}`;
      this.setError(errorMessage);
      throw error;
    }
  }

  /**
   * Stops camera streaming and releases all camera resources.
   * Closes peer connections and stops all media tracks.
   * 
   * @emits streamStopped - When stream stops successfully
   * @emits statusChanged - When streaming status changes
   */
  async stopStream(): Promise<void> {
    if (!this.status.streaming) {
      return;
    }

    try {
      this.stopMetricsCollection();

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      this.status.streaming = false;
      this.status.available = false;
      this.status.metrics = {
        fps: 0,
        bitrateKbps: 0,
        viewers: 0,
        droppedFrames: 0,
      };

      this.emit('streamStopped');
      this.emit('statusChanged', this.status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.setError(`Failed to stop camera stream: ${message}`);
    }
  }

  /**
   * Restarts the camera stream (stops then starts).
   * Useful when settings change that require re-initialization.
   */
  async restartStream(): Promise<void> {
    await this.stopStream();
    await this.startStream();
  }

  /**
   * Gets the current MediaStream object.
   * @returns Current camera stream or null if not streaming
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Creates a new RTCPeerConnection for streaming to a remote viewer.
   * Adds the current camera stream tracks to the connection.
   * 
   * @param iceServers - Optional ICE servers for peer connection (defaults to LAN-only)
   * @returns Promise resolving to configured RTCPeerConnection
   * @emits iceCandidate - When a new ICE candidate is generated
   * @emits iceConnectionStateChange - When ICE connection state changes
   */
  async createPeerConnection(iceServers: RTCIceServer[] = []): Promise<RTCPeerConnection> {
    const newPeerConnection = new RTCPeerConnection({
      iceServers,
    });

    // Add stream to peer connection
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        newPeerConnection.addTrack(track, this.stream!);
      });
    } else {
      console.warn('CameraService: No stream available when creating peer connection');
    }

    // Configure sender encodings for quality control
    const sender = newPeerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      const params = sender.getParameters();

      if (params.encodings.length === 0) {
        params.encodings.push({});
      }

      const preset = QUALITY_PRESETS[this.settings.qualityPreset];
      params.encodings[0].maxBitrate = preset.bitrate * 1000; // Convert to bps

      await sender.setParameters(params);
    }

    // Handle ICE candidates - send them to remote client via signaling server
    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', event.candidate);
      }
    };

    newPeerConnection.oniceconnectionstatechange = () => {
      const state = newPeerConnection.iceConnectionState;
      this.emit('iceConnectionStateChange', state);

      if (state === 'connected' || state === 'completed') {
        this.status.metrics.viewers = 1;
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.status.metrics.viewers = 0;
      }

      this.emit('statusChanged', this.status);
    };

    // Store reference to the main peer connection (for metrics)
    if (!this.peerConnection) {
      this.peerConnection = newPeerConnection;
    }

    return newPeerConnection;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  private startMetricsCollection(): void {
    this.stopMetricsCollection();

    this.metricsInterval = setInterval(async () => {
      await this.updateMetrics();
    }, 1000);
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private async updateMetrics(): Promise<void> {
    if (!this.stream || !this.status.streaming || !this.settings.enabled) {
      return;
    }

    try {
      let fps = 0;
      let bitrateKbps = 0;
      let droppedFrames = 0;
      let viewers = 0;

      // If we have a peer connection, get WebRTC stats
      if (this.peerConnection) {
        const stats = await this.peerConnection.getStats();
        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
            fps = report.framesPerSecond || 0;

            // Calculate bitrate from bytes sent
            const currentTime = Date.now();
            const currentBytes = report.bytesSent || 0;

            if (this.lastTimestamp > 0) {
              const timeDiff = (currentTime - this.lastTimestamp) / 1000; // seconds
              const bytesDiff = currentBytes - this.lastBytesReceived;
              bitrateKbps = Math.round((bytesDiff * 8) / (timeDiff * 1000)); // kbps
            }

            this.lastBytesReceived = currentBytes;
            this.lastTimestamp = currentTime;
            droppedFrames = report.framesDropped || 0;
          }
        });

        viewers = this.peerConnection.connectionState === 'connected' ? 1 : 0;
      } else {
        // No peer connection, but we can still show basic stream info
        const videoTrack = this.stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          fps = settings.frameRate || this.settings.constraints.frameRate;

          // Estimate bitrate based on quality preset
          const preset = QUALITY_PRESETS[this.settings.qualityPreset];
          bitrateKbps = preset.bitrate;
        }
        viewers = 0;
      }

      this.status.metrics = {
        fps,
        bitrateKbps,
        viewers,
        droppedFrames,
      };

      this.emit('metricsUpdated', this.status.metrics);
    } catch (error) {
      console.error('CameraService: Failed to update camera metrics:', error);
    }
  }

  private setError(message: string): void {
    this.status.error = message;
    this.status.available = false;
    this.emit('error', message);
    this.emit('statusChanged', this.status);
  }

  private clearError(): void {
    this.status.error = null;
    this.emit('statusChanged', this.status);
  }

  /**
   * Attempts to acquire camera stream using fallback constraints when specific device fails.
   * This handles cases where the requested device is no longer available.
   * 
   * @param constraintError - The error thrown by getUserMedia with exact device constraints
   * @returns Promise resolving to a MediaStream from any available camera
   * @throws The original error if it's not a device availability issue
   */
  private async tryFallbackDevice(constraintError: any): Promise<MediaStream> {
    const canFallback = constraintError.name === 'OverconstrainedError' ||
      constraintError.name === 'NotFoundError';

    if (!canFallback) {
      throw constraintError;
    }

    console.warn('[CameraService] Exact device constraint failed, trying with any available camera');

    const fallbackConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: this.settings.constraints.width },
        height: { ideal: this.settings.constraints.height },
        frameRate: { ideal: this.settings.constraints.frameRate },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);

    // Update the deviceId to the one actually being used
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const actualDeviceId = videoTrack.getSettings().deviceId;
      if (actualDeviceId && actualDeviceId !== this.settings.deviceId) {
        this.settings.deviceId = actualDeviceId;
      }
    }

    return stream;
  }

  async cleanup(): Promise<void> {
    await this.stopStream();
    this.removeAllListeners();
  }
}

export default CameraService;
