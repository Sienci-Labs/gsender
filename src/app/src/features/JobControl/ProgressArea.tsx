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
import { JSX } from 'react';
import moment from 'moment';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';
import { SenderStatus } from 'app/lib/definitions/sender_feeder';
import {
    convertMillisecondsToTimeStamp,
    convertSecondsToDHMS,
} from 'app/lib/datetime';

import WoodcuttingProgress from './WoodcuttingProgress';

interface Props {
    senderStatus: SenderStatus;
}

/**
 * Progress Area component to display running job information
 * @prop {Object} state Default state given from parent component
 *
 */
const ProgressArea: React.FC<Props> = ({ senderStatus }) => {
    const { total, received, elapsedTime, remainingTime, startTime } =
        senderStatus || {};

    const getFinishTime = (givenTime: number): string => {
        if (startTime === 0 || !givenTime || givenTime < 0) {
            return '-';
        }

        const now = moment();

        now.add(remainingTime, 'seconds');

        const formattedTime = now.format('h:mma');
        return formattedTime;
    };

    const updateTime = (): string => {
        return getFinishTime(Number(remainingTime));
    };

    const getTimesHTML = (
        timeSplit: [number, number, number, number],
    ): JSX.Element => {
        let time1 = 0;
        let time2 = 0;
        let text1 = '';
        let text2 = '';
        if (timeSplit[0] !== 0) {
            time1 = timeSplit[0];
            text1 = 'd';
            time2 = timeSplit[1];
            text2 = 'hr';
        } else if (timeSplit[1] !== 0) {
            time1 = timeSplit[1];
            text1 = 'hr';
            time2 = timeSplit[2];
            text2 = 'm';
        } else {
            time1 = timeSplit[2];
            text1 = 'm';
            time2 = timeSplit[3];
            text2 = 's';
        }
        return (
            <div className="flex flex-row justify-center items-end">
                <span className="text-2xl font-bold">{time1}</span>
                <span className="text-lg">{text1}</span>
                <span className="text-2xl font-bold">{time2}</span>
                <span className="text-lg">{text2}</span>
            </div>
        );
    };

    const percentageValue = Number.isNaN((received / total) * 100)
        ? 0
        : (received / total) * 100;

    const timeSplit = convertSecondsToDHMS(Number(remainingTime));
    const timeComponent = getTimesHTML(timeSplit);

    return (
        <div className="w-64">
            <div className="border-solid border border-gray-500 dark:border-gray-700 rounded-sm bg-gray-100 dark:bg-dark gap-2 flex flex-row justify-between items-center pr-1 pt-1 text-gray-900 dark:text-gray-200">
                <div className="flex flex-col gap-0 w-full h-full -mt-6">
                    <div
                        className="flex flex-row justify-start items-end px-3 -mb-1 whitespace-nowrap transition-transform duration-200"
                        style={{
                            transform: `translate(${percentageValue > 50 ? percentageValue - 48 : percentageValue || 0}%, 16px)`,
                        }}
                    >
                        <span className="font-bold text-2xl">
                            {percentageValue.toFixed(0)}
                        </span>
                        <span>%</span>
                    </div>

                    <WoodcuttingProgress percentage={percentageValue} />
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col  justify-center items-center w-32">
                                {timeComponent}
                                <span className="text-sm">remaining</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                            {updateTime()}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="w-full flex flex-row justify-between gap-2 text-gray-500 text-sm whitespace-nowrap">
                <span>{`${received} / ${total} Lines`}</span>
                <span>
                    {convertMillisecondsToTimeStamp(elapsedTime, true)} cutting
                </span>
            </div>
        </div>
    );
};

export default ProgressArea;
