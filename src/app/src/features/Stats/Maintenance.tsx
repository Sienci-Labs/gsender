import { StatCard } from 'app/features/Stats/components/StatCard.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import { MaintenancePreview } from 'app/features/Stats/components/MaintenancePreview.tsx';
import { MaintenanceList } from 'app/features/Stats/components/MaintenanceList.tsx';

export function Maintenance() {
    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4 max-xl:gap-2 w-full h-full overflow-y-auto">
            <div className="col-span-4 row-span-6 px-8 max-xl:px-0 mb-2">
                <StatCard>
                    <CardHeader>Maintenance</CardHeader>
                    <div className="w-full flex flex-col">
                        <MaintenanceList />
                    </div>
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 px-8 max-xl:px-0 flex flex-col gap-4">
                <StatCard>
                    <CardHeader>Upcoming Maintenance</CardHeader>
                    <MaintenancePreview limit={6} />
                </StatCard>
            </div>
        </div>
    );
}
