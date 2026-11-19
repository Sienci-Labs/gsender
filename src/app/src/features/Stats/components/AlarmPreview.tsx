import { EmptyAlarmList } from 'app/features/Stats/components/EmptyAlarmList.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard.tsx';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { useAppTranslation } from 'app/i18n';
import { useContext } from 'react';
import { tv } from 'tailwind-variants';
import { CardHeader } from './CardHeader.tsx';

const eventRow = tv({
    base: 'flex flex-row items-center justify-between p-2 rounded border-l-4',
    variants: {
        color: {
            ALARM: 'text-red-500 bg-red-500 bg-opacity-10 border-red-500',
            ERROR: 'text-yellow-500 bg-yellow-500 bg-opacity-10 border-yellow-500',
        },
    },
});

export function AlarmPreview() {
    const { t } = useAppTranslation();
    const { alarms = [] } = useContext(StatContext);
    const shortlist = alarms.slice(0, 4);

    return (
        <StatCard>
            <CardHeader
                link={'/stats/alarms'}
                linkLabel={t('stats:alarms.viewAll')}
            >
                {t('stats:alarms.title')}
            </CardHeader>
            <div className="flex flex-col gap-2 justify-around">
                {shortlist.length == 0 && <EmptyAlarmList />}
                {shortlist.map((event, index) => (
                    <div
                        className={eventRow({ color: event.type })}
                        key={index}
                    >
                        <span className="font-2xl">
                            {t('stats:alarms.preview', {
                                type:
                                    event.type === 'ALARM'
                                        ? t('stats:alarms.eventType.alarm')
                                        : t('stats:alarms.eventType.error'),
                                code: event.CODE,
                            })}
                        </span>
                        <span>
                            {t('stats:alarms.on', { time: event.time })}
                        </span>
                    </div>
                ))}
            </div>
        </StatCard>
    );
}
