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

export function Stats() {
    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4">
            <div id="mainStats" className="col-span-4 row-span-6 px-8 mb-2 ">
                <h1 className="text-5xl">Your Machine</h1>
                <StatCard>
                    <div className="grid grid-cols-2">
                        <div>
                            <CardHeader>Stats</CardHeader>
                        </div>
                        <div>
                            <CardHeader>Recent Jobs</CardHeader>
                            <JobPreviewList />
                        </div>
                    </div>
                </StatCard>
                <div className="grid grid-cols-2">
                    <StatCard>
                        <CardHeader link={'/'} linkLabel="Manage">
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
                <h1 className="text-5xl">Get Help</h1>
                <StatCard>
                    <Diagnostic />
                </StatCard>
                <ExternalLink
                    title={'Resources'}
                    link={''}
                    icon={<FaBookBookmark />}
                >
                    Learn about starting with gSender and how to use specific
                    features
                </ExternalLink>
                <ExternalLink
                    title={'Community'}
                    link={''}
                    icon={<ImBubbles4 />}
                >
                    Have conversations with our friendly and helpful community
                </ExternalLink>
                <ExternalLink title={'Github'} link={''} icon={<FaGithub />}>
                    Submit issues or grab the latest version of gSender
                </ExternalLink>
                <AlarmPreview />
            </div>
        </div>
    );
}
