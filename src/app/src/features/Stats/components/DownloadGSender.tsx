import { Button } from 'app/components/Button';
import { useAppTranslation } from 'app/i18n';
import isElectron from 'is-electron';
import { useState } from 'react';
import { FaDownload, FaExternalLinkAlt } from 'react-icons/fa';

export function DownloadGSender({ version = '1.5.0', downloadPercent = 0 }) {
    const { t } = useAppTranslation();
    const [canClick, setCanClick] = useState(true);
    function updateGSender() {
        setCanClick(false);
        if (isElectron()) {
            window.ipcRenderer.send('restart_app');
        }
    }

    return (
        <div
            className="text-blue-800 border border-blue-500 rounded-lg bg-blue-50 bg-opacity-50 text-center mt-8 dark:text-content-primary dark:border-blue-500 dark:bg-blue-900 dark:bg-opacity-50 h-fit"
            role="alert"
        >
            <div className="flex items-center justify-center p-4">
                <svg
                    className="shrink-0 w-4 h-4 me-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="sr-only">{t('stats:update.info')}</span>
                <h3 className="text-lg font-medium">
                    {t('stats:update.available', { version })}
                </h3>
            </div>
            <div className="mt-2 mb-4 text-sm flex flex-col gap-2">
                <p>{t('stats:update.willUpdate', { version })}</p>{' '}
                <p>{t('stats:update.backupRecommended')}</p>
                <p>
                    <a
                        className="text-sm text-blue-600 dark:text-blue-400 underline text-center"
                        href="https://resources.sienci.com/view/gs-installation/#gsender-updates"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="flex items-center gap-1 text-center justify-center">
                            <span>{t('stats:update.readDocs')}</span>
                            <FaExternalLinkAlt />
                        </div>
                    </a>
                </p>
            </div>
            <div className="flex items-center justify-center border-t border-t-blue-500 py-4">
                <Button
                    type="button"
                    variant="primary"
                    className="gap-2"
                    onClick={updateGSender}
                >
                    <FaDownload />
                    {canClick && (
                        <span>{t('stats:update.updateNow', { version })}</span>
                    )}
                    {!canClick && (
                        <span>
                            {t('stats:update.downloading', {
                                percent: downloadPercent,
                            })}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
