import {
    FirmwareEvent,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';

import { IoIosWarning } from 'react-icons/io';
import { MdCancel } from 'react-icons/md';
import cx from 'classnames';
import { convertISOStringToDateAndTime } from 'app/lib/datetime.ts';
import { EmptyAlarmList } from 'app/features/Stats/components/EmptyAlarmList.tsx';

// const colorCodes = {
//     ALARM: '#d75f5f',
//     ERROR: '#ff0000',
// };

function AlarmItem({ alarm, key }: { alarm: FirmwareEvent; key: string }) {
    const time = convertISOStringToDateAndTime(alarm.time);
    const isAlarm = alarm.type === 'ALARM';
    return (
        <li
            className={cx('ms-16 my-4 bg-red-500 bg-opacity-5 px-2 rounded', {
                'border-l-2 border-red-500': isAlarm,
                'border-l-2 border-orange-500': !isAlarm,
            })}
            key={key}
        >
            <span
                className={cx(
                    {
                        'text-red-500 ring-red-500': isAlarm,
                        'text-orange-500 ring-orange-500': !isAlarm,
                    },
                    'absolute left-1 flex items-center justify-center w-12 h-12 text-4xl bg-white border-orange-500 rounded-full ring-2',
                )}
            >
                {isAlarm ? <MdCancel /> : <IoIosWarning />}
            </span>
            <h3
                className={cx('mb-1 text-lg font-semibold text-gray-900', {
                    'text-red-500': isAlarm,
                    'text-orange-500': !isAlarm,
                })}
            >
                {alarm.type} {alarm.CODE} - {alarm.source}
            </h3>
            <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                at {time}
            </time>
            <p className="text-base font-normal text-gray-500 dark:text-gray-300">
                {alarm.MESSAGE || 'No associated message'}
            </p>
            <p className="text-base font-normal text-gray-500">
                Line: <b>{alarm.line}</b>
            </p>
        </li>
    );
}

export function AlarmListing() {
    const { alarms } = useContext(StatContext);

    if (!alarms || alarms.length === 0) {
        return <EmptyAlarmList />;
    }

    return (
        <div className="">
            <ol className="relative  h-[500px]  overflow-y-scroll no-scrollbar">
                {alarms.map((alarm) => (
                    <AlarmItem key={alarm.id} alarm={alarm} />
                ))}
            </ol>
        </div>
    );
}
