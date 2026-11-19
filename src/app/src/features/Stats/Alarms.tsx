import api from 'app/api';
import { Button } from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import { AlarmListing } from 'app/features/Stats/components/AlarmListing.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { i18n, useAppTranslation } from 'app/i18n';
import { useContext } from 'react';
import { FaTrash } from 'react-icons/fa';

export function Alarms() {
    const { t } = useAppTranslation();
    const { setAlarms } = useContext(StatContext);
    function deleteAlarms() {
        Confirm({
            title: i18n.t('notifications:stats.deleteAlarmHistory.title'),
            content: i18n.t('notifications:stats.deleteAlarmHistory.content'),
            confirmLabel: i18n.t('common:actions.confirm'),
            cancelLabel: i18n.t('common:actions.cancel'),
            onConfirm: async () => {
                await api.alarmList.clearAll();
                setAlarms([]);
            },
        });
    }

    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4 w-full h-full min-h-0 overflow-hidden">
            <div className="col-span-4 max-xl:col-span-6 row-span-6 min-h-0">
                <StatCard>
                    <div className="h-full flex flex-col min-h-0">
                        <CardHeader>{t('stats:alarms.title')}</CardHeader>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <AlarmListing />
                        </div>
                    </div>
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 flex flex-col max-xl:flex-row max-xl:col-span-6 max-xl:col-start-1 max-xl:-order-1 gap-4 min-h-0">
                <div className="max-xl:flex-1">
                    <StatCard>
                        <div className="h-full flex flex-col gap-4 max-xl:justify-center">
                            <div className="max-xl:hidden">
                                <CardHeader>
                                    {t('stats:diagnostic.title')}
                                </CardHeader>
                            </div>
                            <Diagnostic compactOnSmall />
                        </div>
                    </StatCard>
                </div>
                <div className="max-xl:flex-1">
                    <StatCard>
                        <div className="h-full flex flex-col gap-4 justify-center">
                            <div className="max-xl:hidden">
                                <CardHeader>
                                    {t('stats:alarms.clear.title')}
                                </CardHeader>
                            </div>
                            <p className="text-gray-600 text-sm dark:text-content-primary max-xl:hidden">
                                {t('stats:alarms.clear.description')}
                            </p>
                            <Button
                                icon={
                                    <FaTrash className="text-gray-600 w-4 h-4 dark:text-content-secondary" />
                                }
                                onClick={deleteAlarms}
                                text={t('stats:alarms.clear.title')}
                                size="lg"
                                className="text-gray-600"
                            />
                        </div>
                    </StatCard>
                </div>
            </div>
        </div>
    );
}
