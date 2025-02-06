import { Outlet } from '@tanstack/react-router';
import { StatsProvider } from 'app/features/Stats/utils/StatContext.tsx';
import { StatMenu } from 'app/features/Stats/components/StatMenu.tsx';

export function StatParent() {
    return (
        <StatsProvider>
            <div className="p-4 h-full w-full gap-4 flex flex-col">
                <StatMenu />
                <Outlet />
            </div>
        </StatsProvider>
    );
}
