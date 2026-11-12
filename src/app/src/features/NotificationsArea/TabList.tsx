import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';
import { useAppTranslation } from 'app/i18n';

import NotificationList from './NotificationList';

const TabList = () => {
    const { t } = useAppTranslation();
    return (
        <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4 bg-gray-200 dark:bg-surface-raised mb-2 !p-0">
                <TabsTrigger value="all">
                    {t('workspace:notifications.tabs.all')}
                </TabsTrigger>
                <TabsTrigger value="error">
                    {t('workspace:notifications.tabs.errors')}
                </TabsTrigger>
                <TabsTrigger value="info">
                    {t('workspace:notifications.tabs.info')}
                </TabsTrigger>
                <TabsTrigger value="success">
                    {t('workspace:notifications.tabs.success')}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                <NotificationList value="all" />
            </TabsContent>

            <TabsContent value="error">
                <NotificationList value="error" />
            </TabsContent>

            <TabsContent value="info">
                <NotificationList value="info" />
            </TabsContent>

            <TabsContent value="success">
                <NotificationList value="success" />
            </TabsContent>
        </Tabs>
    );
};

export default TabList;
