import { Button } from 'app/components/Button';
import { UpdateGSender } from 'app/features/Stats/components/UpdateGSender.tsx';
import { TransKey, useAppTranslation } from 'app/i18n';
import { cn } from 'app/lib/utils';
import type { RootState } from 'app/store/redux';
import { version } from 'app-root/package.json';
import { FaExternalLinkAlt } from 'react-icons/fa';
import Markdown from 'react-markdown';
import type { ReactMarkdownProps } from 'react-markdown/lib/ast-to-react';
import { useSelector } from 'react-redux';
import useGetReleaseNotes from './utils/useGetReleaseNotes';

const About = () => {
    const { t } = useAppTranslation();
    const { releaseNotes, status, fetchReleaseNotes } = useGetReleaseNotes();

    const updateReleaseNotes = useSelector(
        (state: RootState) => state.gSenderInfo.releaseNotes,
    );
    const hasUpdate = useSelector(
        (state: RootState) => state.gSenderInfo.hasUpdate,
    );

    const team = [
        { name: 'Kevin G.', title: t('stats:about.team.leadDev') },
        { name: 'Walid K.', title: t('stats:about.team.devManager') },
        { name: 'Sophia B.', title: t('stats:about.team.dev') },
        { name: 'Shilpa G', title: t('stats:about.team.qa') },
        { name: 'Stephen C.', title: t('stats:about.team.docs') },
        { name: 'Kelly Z.', title: t('stats:about.team.iconDesign') },
        { name: 'Brady B.', title: t('stats:about.team.uxUiDev') },
    ];

    const gSenderLogo = new URL(
        '../../../images/icon-square.png',
        import.meta.url,
    );
    const canadaFlag = new URL(
        '../../../images/canada-flag-icon.png',
        import.meta.url,
    );

    const renderReleaseNotes = () => {
        if (status === 'loading') {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500" />
                </div>
            );
        }

        if (status === 'error') {
            return (
                <div className="flex flex-col gap-2 items-center justify-center h-full">
                    <p>{t('stats:about.releaseNotes.loadError')}</p>
                    <p>
                        <TransKey
                            i18nKey="stats:about.releaseNotes.persistentError"
                            components={{
                                link: (
                                    <a
                                        href="https://github.com/Sienci-Labs/gsender/releases"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 underline"
                                    />
                                ),
                            }}
                        />
                    </p>
                    <Button onClick={fetchReleaseNotes} variant="outline">
                        {t('stats:about.releaseNotes.retry')}
                    </Button>
                </div>
            );
        }

        if (releaseNotes.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                    <p>{t('stats:about.releaseNotes.empty')}</p>

                    <Button onClick={fetchReleaseNotes} variant="outline">
                        {t('stats:about.releaseNotes.retry')}
                    </Button>
                </div>
            );
        }

        if (hasUpdate) {
            return <UpdateGSender />;
        }

        return releaseNotes.map((release, index) => {
            return (
                <Markdown
                    key={release.date}
                    components={{
                        h3: (props: ReactMarkdownProps) => (
                            <h3
                                className={cn(
                                    'text-xl font-bold underline dark:text-content-primary',
                                    {
                                        'mt-8': index !== 0,
                                    },
                                )}
                            >
                                {props.children}
                            </h3>
                        ),
                        ul: (props: ReactMarkdownProps) => (
                            <ul className="ml-4 list-disc [&>li]:mt-2 dark:text-content-primary">
                                {props.children}
                            </ul>
                        ),
                        li: (props: ReactMarkdownProps) => (
                            <li className="leading-7 dark:text-content-primary">
                                {props.children}
                            </li>
                        ),
                    }}
                >
                    {`### ${release.version} (${release.date})\n\n${release.notes.map((note) => `- ${note}`).join('\n')}`}
                </Markdown>
            );
        });
    };

    return (
        <div className="w-full flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <img
                        src={gSenderLogo.href}
                        alt={t('stats:about.logoAlt')}
                        width={125}
                        height={125}
                    />
                    <div className="dark:text-content-primary">
                        <h1 className="text-3xl font-bold">gSender</h1>
                        <p className="text-sm text-gray-600 dark:text-content-primary">
                            {t('stats:about.byline')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-content-primary">
                            {t('stats:about.version', { version })}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                    <p className=" text-gray-600 dark:text-content-primary">
                        {t('stats:about.copyright', {
                            year: new Date().getFullYear(),
                        })}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-content-primary">
                            {t('stats:about.madeInCanada')}
                        </span>
                        <img
                            src={canadaFlag.href}
                            alt={t('stats:about.canadaFlagAlt')}
                        />
                    </div>
                    <p>
                        <a
                            href="https://github.com/Sienci-Labs/gsender/blob/master/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline"
                        >
                            GNU GPLv3 License
                        </a>
                    </p>
                </div>
            </div>

            <p className="text-md md:text-lg dark:text-content-primary">
                {t('stats:about.description')}
            </p>

            <div>
                <h2 className="text-2xl text-blue-600 dark:text-blue-400 mb-2">
                    {t('stats:about.team.title')}
                </h2>
                <div className="text-md md:text-lg dark:text-content-primary">
                    {team.map((member, index) => (
                        <span key={member.name}>
                            <strong>{member.name}</strong> ({member.title})
                            {index < team.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </div>
            </div>
            {hasUpdate && <UpdateGSender notes={updateReleaseNotes} />}
            {!hasUpdate && (
                <div className="h-full flex flex-col gap-2">
                    <div className="flex gap-2 items-center justify-between">
                        <h2 className="text-2xl text-blue-600 dark:text-blue-400">
                            {t('stats:about.releaseNotes.title')}
                        </h2>

                        <a
                            className="text-sm text-blue-600 dark:text-blue-400 underline"
                            href="https://github.com/Sienci-Labs/gsender"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div className="flex items-center gap-1">
                                <span>
                                    {t('stats:about.releaseNotes.seeAll')}
                                </span>
                                <FaExternalLinkAlt />
                            </div>
                        </a>
                    </div>

                    <div className="relative h-full">
                        <div className="absolute top-0 left-0 w-full h-full overflow-y-auto border border-gray-300 rounded-md p-4">
                            {renderReleaseNotes()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default About;
