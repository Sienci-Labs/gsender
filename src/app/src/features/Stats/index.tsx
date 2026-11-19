import { AlarmPreview } from 'app/features/Stats/components/AlarmPreview.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import { Configuration } from 'app/features/Stats/components/Configuration.tsx';
import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { ExternalLink } from 'app/features/Stats/components/ExternalLink.tsx';
import { JobPreviewList } from 'app/features/Stats/components/JobPreviewList.tsx';
import { MaintenancePreview } from 'app/features/Stats/components/MaintenancePreview.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard';
import { StatTable } from 'app/features/Stats/components/StatTable.tsx';
import { JobResultsChart } from 'app/features/Stats/JobResultsChart.tsx';
import { useAppTranslation } from 'app/i18n';
import { FaGithub } from 'react-icons/fa';
import { FaBookBookmark } from 'react-icons/fa6';
import { ImBubbles4 } from 'react-icons/im';

export function Stats() {
    const { t } = useAppTranslation();
    return (
        <div className="fixed-content-area overflow-y-auto">
            <div className="grid grid-cols-6 grid-rows-6 gap-4 mr-5">
                <div
                    id="mainStats"
                    className="col-span-4 max-xl:col-span-6 row-span-6 pr-8 max-xl:pr-0 mb-2 gap-4 flex flex-col"
                >
                    <h1 className="text-3xl font-bold dark:text-content-primary">
                        {t('stats:overview.yourMachine')}
                    </h1>
                    <StatCard>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-2">
                                <CardHeader>
                                    {t('stats:overview.stats')}
                                </CardHeader>
                                <JobResultsChart />
                                <StatTable />
                            </div>
                            <div className="flex flex-col gap-2">
                                <CardHeader
                                    link={'/stats/jobs'}
                                    linkLabel={t('stats:overview.more')}
                                >
                                    {t('stats:overview.recentJobs')}
                                </CardHeader>
                                <JobPreviewList />
                            </div>
                        </div>
                    </StatCard>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard>
                            <CardHeader
                                link={'/stats/maintenance'}
                                linkLabel={t('stats:overview.manage')}
                            >
                                {t('stats:maintenance.upcoming')}
                            </CardHeader>
                            <MaintenancePreview />
                        </StatCard>
                        <StatCard>
                            <CardHeader
                                link={'/configuration'}
                                linkLabel={t('stats:overview.change')}
                            >
                                {t('stats:overview.configuration')}
                            </CardHeader>
                            <Configuration />
                        </StatCard>
                    </div>
                </div>
                <div
                    id="secondaryStats"
                    className="col-span-2 max-xl:col-span-6 max-xl:flex-row max-xl:grid max-xl:grid-cols-2 row-span-6 col-start-5 pl-8 max-xl:pl-0 flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-4">
                        <h1 className="text-3xl font-bold dark:text-content-primary">
                            {t('stats:overview.getHelp')}
                        </h1>
                        <StatCard>
                            <Diagnostic />
                        </StatCard>
                        <ExternalLink
                            title={t('stats:overview.links.resources.title')}
                            link={
                                'https://resources.sienci.com/view/gs-using-gsender/'
                            }
                            icon={<FaBookBookmark />}
                        >
                            {t('stats:overview.links.resources.description')}
                        </ExternalLink>
                        <ExternalLink
                            title={t('stats:overview.links.community.title')}
                            link={'https://forum.sienci.com/c/gsender/14'}
                            icon={<ImBubbles4 />}
                        >
                            {t('stats:overview.links.community.description')}
                        </ExternalLink>
                        <ExternalLink
                            title={t('stats:overview.links.github.title')}
                            link={'https://github.com/Sienci-Labs/gsender'}
                            icon={<FaGithub />}
                        >
                            {t('stats:overview.links.github.description')}
                        </ExternalLink>
                    </div>
                    <AlarmPreview />
                </div>
            </div>
        </div>
    );
}
