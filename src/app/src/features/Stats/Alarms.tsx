import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard';
import { AlarmListing } from 'app/features/Stats/components/AlarmListing.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';

export function Alarms() {
    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4">
            <div className="col-span-4 row-span-6 px-8 mb-2">
                <StatCard>
                    <CardHeader>Errors and Alarms</CardHeader>
                    <AlarmListing />
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 px-8 flex flex-col gap-4">
                <StatCard>
                    <Diagnostic />
                </StatCard>
            </div>
        </div>
    );
}
