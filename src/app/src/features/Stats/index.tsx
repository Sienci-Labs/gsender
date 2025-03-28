import { StatCard } from 'app/features/Stats/components/StatCard';
import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { ExternalLink } from 'app/features/Stats/components/ExternalLink.tsx';
import { FaBookBookmark } from 'react-icons/fa6';
import { ImBubbles4 } from 'react-icons/im';
import { FaGithub } from 'react-icons/fa';
import { AlarmPreview } from 'app/features/Stats/components/AlarmPreview.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import { JobPreviewList } from 'app/features/Stats/components/JobPreviewList.tsx';
import { MaintenancePreview } from 'app/features/Stats/components/MaintenancePreview.tsx';
import { Configuration } from 'app/features/Stats/components/Configuration.tsx';
import { JobResultsChart } from 'app/features/Stats/JobResultsChart.tsx';

export function Stats() {
    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4">
            <div
                id="mainStats"
                className="col-span-4 row-span-6 px-8 mb-2 gap-4 flex flex-col"
            >
                <h1 className="text-5xl dark:text-white">Your Machine</h1>
                <StatCard>
                    <div className="grid grid-cols-2">
                        <div className="p-4">
                            <CardHeader>Stats</CardHeader>
                            <JobResultsChart />
                        </div>
                        <div className="px-4">
                            <CardHeader link={'/stats/jobs'} linkLabel={'More'}>
                                Recent Jobs
                            </CardHeader>
                            <JobPreviewList />
                        </div>
                    </div>
                </StatCard>
                <div className="grid grid-cols-2 flex flex-row gap-4">
                    <StatCard>
                        <CardHeader
                            link={'/stats/maintenance'}
                            linkLabel="Manage"
                        >
                            Upcoming Maintenance
                        </CardHeader>
                        <MaintenancePreview />
                    </StatCard>
                    <StatCard>
                        <CardHeader link={'/configuration'} linkLabel="Change">
                            Configuration
                        </CardHeader>
                        <Configuration />
                    </StatCard>
                </div>
            </div>
            <div
                id="secondaryStats"
                className="col-span-2 row-span-6 col-start-5 px-8 flex flex-col gap-4"
            >
                <h1 className="text-5xl dark:text-white">Get Help</h1>
                <StatCard>
                    <Diagnostic />
                </StatCard>
                <ExternalLink
                    title={'Resources'}
                    link={'https://resources.sienci.com/view/gs-using-gsender/'}
                    icon={<FaBookBookmark />}
                >
                    Learn about starting with gSender and how to use specific
                    features
                </ExternalLink>
                <ExternalLink
                    title={'Community'}
                    link={'https://forum.sienci.com/c/gsender/14'}
                    icon={<ImBubbles4 />}
                >
                    Have conversations with our friendly and helpful community
                </ExternalLink>
                <ExternalLink
                    title={'Github'}
                    link={'https://github.com/Sienci-Labs/gsender'}
                    icon={<FaGithub />}
                >
                    Submit issues or grab the latest version of gSender
                </ExternalLink>
                <AlarmPreview />
            </div>
        </div>
    );
}
