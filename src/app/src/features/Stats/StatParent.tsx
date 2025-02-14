import { Outlet } from '@tanstack/react-router';
import { StatsProvider } from 'app/features/Stats/utils/StatContext.tsx';
import { StatMenu } from 'app/features/Stats/components/StatMenu.tsx';

export function StatParent() {
    return (
        <StatsProvider>
            <div className="py-2 px-4 h-full w-full gap-4 flex flex-col justify-start items-start align-top">
                <Outlet />
                <StatMenu />
            </div>
        </StatsProvider>
    );
}
