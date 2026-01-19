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

import store from 'app/store';
import { CameraSettings } from 'app/services/CameraService';

export const updateCameraSettings = (settings: Partial<CameraSettings>) => {
  const currentSettings = store.get('workspace.camera', {});
  const newSettings = { ...currentSettings, ...settings };

  store.set('workspace.camera', newSettings);

  return newSettings;
};

export const getCameraSettings = (): CameraSettings => {
  return store.get('workspace.camera', {
    enabled: false,
    deviceId: '',
    constraints: {
      width: 1280,
      height: 720,
      frameRate: 30,
    },
    qualityPreset: 'medium' as const,
  });
};

