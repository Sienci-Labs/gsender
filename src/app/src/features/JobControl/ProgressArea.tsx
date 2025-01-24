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

import moment from 'moment';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';
import { Progress } from 'app/components/shadcn/Progress';
import { SenderStatus } from 'app/lib/definitions/sender_feeder';
import {
    convertMillisecondsToTimeStamp,
    convertSecondsToDHMS,
} from 'app/lib/datetime';
import Bit from './assets/Bit.svg';

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
        <>
            <div className="w-60 border-solid border border-gray-500 rounded-sm bg-gray-100 gap-2 flex flex-row justify-between items-center pr-1">
                {/* <img src={Bit} /> */}
                <div className="flex flex-col gap-0 w-full h-full -mt-6 pl-[34px]">
                    <div
                        className="flex flex-row justify-start items-end px-3 -mb-1 whitespace-nowrap"
                        style={{
                            transform: `translateX(${percentageValue > 50 ? percentageValue - 60 : percentageValue || 0}%)`,
                        }}
                    >
                        <span className="font-bold text-2xl">
                            {percentageValue.toFixed(0)}
                        </span>
                        <span>%</span>
                    </div>
                    {/* <div className="h-[35px] w-24 overflow-hidden border-yellow-700 border">
                        <img
                            src={texture}
                            className="bg-yellow-100 min-w-96 min-h-96 rounded-none"
                        />
                    </div> */}
                    <Progress
                        value={percentageValue}
                        Bit={Bit}
                        className="h-[35px] w-full border-yellow-700 border bg-yellow-100 rounded-none ![background-image:_url('texture.png')]"
                    />
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col text-black justify-center items-center">
                                {timeComponent}
                                <span>remaining</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                            {updateTime()}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-[50%_50%] gap-4 text-gray-500 text-sm whitespace-nowrap w-full">
                <span className="flex flex-row justify-end items-center">{`${received} / ${total} Lines`}</span>
                <span className="flex flex-row justify-start items-center">
                    {convertMillisecondsToTimeStamp(elapsedTime, true)} cutting
                </span>
            </div>
        </>
    );
};

export default ProgressArea;
