import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard';
import { AlarmListing } from 'app/features/Stats/components/AlarmListing.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import { FaTrash } from 'react-icons/fa';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import api from 'app/api';
import { useContext } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { Button } from 'app/components/Button';

export function Alarms() {
    const { setAlarms } = useContext(StatContext);
    function deleteAlarms() {
        Confirm({
            title: 'Delete History',
            content: 'Are you sure you want to delete all alarm/error history?',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
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
                        <CardHeader>Alarms & Errors</CardHeader>
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
                                <CardHeader>Diagnostic File</CardHeader>
                            </div>
                            <Diagnostic compactOnSmall />
                        </div>
                    </StatCard>
                </div>
                <div className="max-xl:flex-1">
                    <StatCard>
                        <div className="h-full flex flex-col gap-4 justify-center">
                            <div className="max-xl:hidden">
                                <CardHeader>Clear Alarms & Errors</CardHeader>
                            </div>
                            <p className="text-gray-600 text-sm dark:text-white max-xl:hidden">
                            Clear all prior alarms and errors. This action
                            cannot be undone.
                            </p>
                            <Button
                                icon={<FaTrash className="text-gray-600 w-4 h-4 dark:text-gray-200" />}
                                onClick={deleteAlarms}
                                text="Clear Alarms & Errors"
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
