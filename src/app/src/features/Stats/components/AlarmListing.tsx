import { EmptyAlarmList } from 'app/features/Stats/components/EmptyAlarmList.tsx';
import {
    type FirmwareEvent,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import { TransKey, useAppTranslation } from 'app/i18n';
import cx from 'classnames';
import { useContext } from 'react';
import { IoIosWarning } from 'react-icons/io';
import { MdCancel } from 'react-icons/md';

// const colorCodes = {
//     ALARM: '#d75f5f',
//     ERROR: '#ff0000',
// };

type AlarmItemProps = {
    alarm: FirmwareEvent;
};

function AlarmItem({ alarm }: AlarmItemProps) {
    const { t } = useAppTranslation();
    const dateString = new Date(alarm.time).toLocaleString('en-US');

    const isAlarm = alarm.type === 'ALARM';
    return (
        <li
            className={cx('ms-16 my-4 bg-red-500 bg-opacity-5 px-2 rounded', {
                'border-l-2 border-red-500': isAlarm,
                'border-l-2 border-orange-500': !isAlarm,
            })}
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
                {t('stats:alarms.heading', {
                    type: isAlarm
                        ? t('stats:alarms.eventType.alarm')
                        : t('stats:alarms.eventType.error'),
                    code: alarm.CODE,
                    source: alarm.source,
                })}
            </h3>
            <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-content-muted">
                {t('stats:alarms.at', { date: dateString })}
            </time>
            <p className="text-base font-normal text-gray-600 dark:text-content-secondary">
                {alarm.MESSAGE || t('stats:alarms.noMessage')}
            </p>
            <p className="text-base font-normal text-gray-600">
                <TransKey
                    i18nKey="stats:alarms.line"
                    values={{ line: alarm.line }}
                    components={{ bold: <b /> }}
                />
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
        <div className="min-h-0">
            <ol className="relative">
                {alarms.map((alarm) => (
                    <AlarmItem key={alarm.id} alarm={alarm} />
                ))}
            </ol>
        </div>
    );
}
