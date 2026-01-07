import { Outlet } from 'react-router';
import { StatsProvider } from 'app/features/Stats/utils/StatContext.tsx';
import { StatMenu } from 'app/features/Stats/components/StatMenu.tsx';

export function StatParent() {
    return (
        <StatsProvider>
            <div className="py-4 pb-12 fixed-content-area w-full gap-4 flex flex-col justify-start items-start align-top fixed-content-area no-scrollbar">
                <Outlet />
                <StatMenu />
            </div>
        </StatsProvider>
    );
}
