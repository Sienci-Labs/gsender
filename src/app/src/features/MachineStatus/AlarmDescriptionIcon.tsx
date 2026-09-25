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

import pubsub from 'pubsub-js';
import { FaQuestion } from 'react-icons/fa6';
import type { ALARM_CODE } from './definitions';

const ALARM_CODES_URL =
    'https://resources.sienci.com/view/gs-gsender-grbl-alarm-error-codes/#alarms';

const AlarmDescriptionIcon = ({ code = 1 }: { code: ALARM_CODE }) => {
    // Title and description are filled in from the controller's alarm list
    const sendAlarmDescription = () => {
        pubsub.publish('helper:info', {
            kind: 'alarm',
            code,
            raw: `ALARM:${code}`,
            resource: {
                label: 'Alarm & error codes',
                url: ALARM_CODES_URL,
            },
        });
    };

    return (
        <div className="bg-white opacity-90 rounded-full w-8 h-8 my-0 mx-4 flex items-center justify-center shadow-[rgba(0,0,0,0.35)_0px_5px_15px] [pointer-events:_all]">
            <FaQuestion
                className="text-xl text-gray-600 cursor-pointer"
                onClick={sendAlarmDescription}
            />
        </div>
    );
};

export default AlarmDescriptionIcon;
