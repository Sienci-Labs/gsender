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

import { GRBLHAL } from 'app/constants';
import { isBitSetInNumber } from 'app/features/DRO/utils/RapidPosition';
import store from 'app/store';
import type { RootState } from 'app/store/redux';
import _get from 'lodash/get';

import {
    computeSoftLimitViolations,
    type SoftLimitViolation,
} from './softLimitCheck';

export const SOFT_LIMIT_WARNING_KEY = 'widgets.visualizer.showSoftLimitWarning';

export function isSoftLimitWarningEnabled(): boolean {
    return !!store.get(SOFT_LIMIT_WARNING_KEY, false);
}

/**
 * Soft-limit violations for the loaded file at the current work zero, read from
 * live redux state. Returns an empty list whenever the check isn't meaningful:
 * the warning setting is off, no file or connection, soft limits ($20) or
 * homing ($22) disabled, or the machine hasn't homed (machine coordinates are
 * arbitrary until it has).
 */
export function selectSoftLimitViolations(
    state: RootState,
    enabled: boolean,
): SoftLimitViolation[] {
    if (!enabled) {
        return [];
    }
    if (
        !_get(state, 'connection.isConnected') ||
        !_get(state, 'file.fileLoaded')
    ) {
        return [];
    }
    if (!_get(state, 'controller.hasHomed')) {
        return [];
    }

    const settings = _get(state, 'controller.settings.settings', {}) as Record<
        string,
        string | undefined
    >;
    const { $20, $22, $23, $130, $131, $132 } = settings;
    if (Number($20) !== 1 || !isBitSetInNumber($22 ?? '0', 0)) {
        return [];
    }
    if ($130 === undefined || $131 === undefined || $132 === undefined) {
        return [];
    }

    const bbox = _get(state, 'file.bbox');
    if (!bbox?.min || !bbox?.max) {
        return [];
    }

    // Mirrors defaultToolChangePosition's zero-on-home detection.
    let forceSetOrigin = !!_get(state, 'controller.homingFlag', false);
    if (_get(state, 'controller.type') === GRBLHAL) {
        forceSetOrigin = isBitSetInNumber($22 ?? '0', 3);
    }

    const wco = _get(state, 'controller.wco', { x: 0, y: 0, z: 0 });

    return computeSoftLimitViolations({
        bbox,
        wco: {
            x: Number(wco.x) || 0,
            y: Number(wco.y) || 0,
            z: Number(wco.z) || 0,
        },
        maxTravel: {
            x: Number($130),
            y: Number($131),
            z: Number($132),
        },
        homingDirMask: Number($23) || 0,
        forceSetOrigin,
    });
}
