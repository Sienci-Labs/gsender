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

import { useAppTranslation } from 'app/i18n';
import cx from 'classnames';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface Props {
    probeActive: boolean;
    connected: boolean;
}

const ProbeCircuitStatus: React.FC<Props> = ({ probeActive, connected }) => {
    const { t } = useAppTranslation();
    const touchLabel = probeActive
        ? t('probe:circuit.touchDetected')
        : t('probe:circuit.noTouch');
    return (
        <div className="w-full flex flex-col justify-center items-center sm:mt-4">
            {connected && (
                <div className="w-full flex flex-col justify-center items-center sm:mt-4">
                    <div
                        aria-label={touchLabel}
                        title={touchLabel}
                        className={cx(
                            'w-8 h-8 rounded-full relative flex items-center justify-center',
                            {
                                'bg-red-500': !probeActive,
                                'bg-green-500': probeActive,
                            },
                        )}
                    >
                        <span className="text-white" aria-hidden="true">
                            {probeActive ? (
                                <FaCheck className="w-4 h-4" />
                            ) : (
                                <FaTimes className="w-4 h-4" />
                            )}
                        </span>
                    </div>
                    <span className="mt-3">
                        {connected && probeActive
                            ? t('probe:circuit.touchDetected')
                            : t('probe:circuit.noTouch')}
                    </span>
                </div>
            )}
            {!connected && t('probe:circuit.noDevice')}
        </div>
    );
};

export default ProbeCircuitStatus;
