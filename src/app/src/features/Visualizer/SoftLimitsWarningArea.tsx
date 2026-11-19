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

import { IMPERIAL_UNITS } from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { useAppTranslation } from 'app/i18n';
import { selectSoftLimitViolations } from 'app/lib/softLimitState';
import isEqual from 'lodash/isEqual';

/**
 * Overlay warning shown when the loaded file, placed at the current work zero,
 * would travel past the machine's soft limits. Lists each offending axis and
 * direction with how far past the limit it goes.
 */
const SoftLimitsWarningArea = () => {
    const { t } = useAppTranslation();
    const visualizer = useWidgetState('visualizer');
    const enabled = !!visualizer?.showSoftLimitWarning;
    const { units } = useWorkspaceState();

    // Deep-compare so live position ticks don't re-render unless the
    // violation list actually changes.
    const violations = useTypedSelector(
        (state) => selectSoftLimitViolations(state, enabled),
        isEqual,
    );

    if (violations.length === 0) {
        return null;
    }

    const isImperial = units === IMPERIAL_UNITS;
    const unitLabel = isImperial ? 'in' : 'mm';
    const formatDistance = (mm: number) =>
        (isImperial ? mm / 25.4 : mm).toFixed(isImperial ? 3 : 2);

    return (
        <div
            role="alert"
            className="pointer-events-none absolute left-1/2 top-2 z-[8997] -translate-x-1/2 rounded-md border border-red-500 bg-red-600/90 px-3 py-1.5 text-sm text-white shadow-lg"
        >
            <div className="font-semibold">
                {t('workspace:visualizer.softLimitsWarning')}
            </div>
            <ul className="mt-0.5">
                {violations.map((v) => (
                    <li key={`${v.axis}${v.direction}`}>
                        {t('workspace:visualizer.softLimitsAxisExceeded', {
                            axis: v.axis,
                            direction: v.direction === '+' ? '+' : '−',
                            distance: formatDistance(v.overBy),
                            units: unitLabel,
                        })}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SoftLimitsWarningArea;
