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

import cx from 'classnames';

interface Props {
    probeActive: boolean;
    connected: boolean;
}

const ProbeCircuitStatus: React.FC<Props> = ({ probeActive, connected }) => {
    return (
        <div className="w-full flex flex-col justify-center items-center sm:mt-4">
            {connected && (
                <div className="w-full flex flex-col justify-center items-center sm:mt-4">
                    <div
                        className={cx('w-8 h-8 rounded-full', {
                            'bg-red-500': !probeActive,
                            'bg-green-500': probeActive,
                        })}
                    />
                    <span className="mt-3">
                        {connected && probeActive
                            ? 'Touch detected'
                            : 'No Touch'}
                    </span>
                </div>
            )}
            {!connected && 'No device connected'}
        </div>
    );
};

export default ProbeCircuitStatus;
