import { StatCard } from 'app/features/Stats/components/StatCard.tsx';
import { useContext } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { tv } from 'tailwind-variants';
import { CardHeader } from './CardHeader.tsx';
import { EmptyAlarmList } from 'app/features/Stats/components/EmptyAlarmList.tsx';

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
    const { alarms = [] } = useContext(StatContext);
    const shortlist = alarms.slice(0, 4);

    return (
        <StatCard>
            <CardHeader link={'/stats/alarms'} linkLabel={'View all'}>
                Alarms & Errors
            </CardHeader>
            <div className="flex flex-col gap-2 justify-around">
                {shortlist.length == 0 && <EmptyAlarmList />}
                {shortlist.map((event, index) => (
                    <div
                        className={eventRow({ color: event.type })}
                        key={index}
                    >
                        <span className="font-2xl">
                            {event.type} {event.CODE}
                        </span>
                        <span>on {event.time}</span>
                    </div>
                ))}
            </div>
        </StatCard>
    );
}
