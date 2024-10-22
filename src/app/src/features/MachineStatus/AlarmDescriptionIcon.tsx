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

import get from 'lodash/get';
import { FaQuestion } from 'react-icons/fa6';
import { store as reduxStore } from '../../store/redux';
import { GRBLHAL } from 'app/constants';
import { GRBL_HAL_ALARMS } from '../../../../server/controllers/Grblhal/constants';
import { GRBL_ALARMS } from '../../../../server/controllers/Grbl/constants';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';
import { ALARM_CODE } from './definitions';

const getCodeDescription = (code: number | 'Homing' = 1): string => {
    const controllerType: string = get(
        reduxStore.getState(),
        'controller.type',
    );
    const ALARMS = controllerType === GRBLHAL ? GRBL_HAL_ALARMS : GRBL_ALARMS;
    const alarm = ALARMS.find((alarm) => alarm.code === code);
    if (alarm) {
        return alarm.description;
    }
    return 'Invalid alarm code - no matching description found';
};

const AlarmDescriptionIcon = ({ code = 1 }: { code: ALARM_CODE }) => {
    const alarmDescription = getCodeDescription(code);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="bg-white opacity-90 rounded-full w-8 h-8 my-0 mx-4 flex items-center justify-center shadow-[rgba(0,0,0,0.35)_0px_5px_15px] [pointer-events:_all]">
                        <FaQuestion className="text-xl text-gray-600" />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                    {alarmDescription}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default AlarmDescriptionIcon;
