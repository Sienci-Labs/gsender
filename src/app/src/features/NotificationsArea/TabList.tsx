import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'app/components/shadcn/Tabs';

import NotificationList from './NotificationList';

const TabList = () => {
    return (
        <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4 bg-gray-200">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="error">Errors</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
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
