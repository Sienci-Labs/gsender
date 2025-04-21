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
                await api.alarmList.clearAll().then((res) => {
                    setAlarms([]);
                });
            },
        });
    }

    return (
        <div className="grid grid-cols-6 grid-rows-6 gap-4">
            <div className="col-span-4 row-span-6 px-8 mb-2">
                <StatCard>
                    <CardHeader>Alarms & Errors</CardHeader>
                    <AlarmListing />
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 px-8 flex flex-col gap-4">
                <StatCard>
                    <CardHeader>Diagnostic File</CardHeader>
                    <Diagnostic />
                </StatCard>
                <StatCard>
                    <CardHeader>Clear Alarms & Errors</CardHeader>
                    <div className="flex flex-col gap-4 justify-center">
                        <p className="text-gray-600 text-sm">
                            Clear all prior alarms and errors. This action
                            cannot be undone.
                        </p>
                        <Button
                            icon={<FaTrash className="text-blue-500 w-4 h-4" />}
                            onClick={deleteAlarms}
                            text="Clear Alarms & Errors"
                            size="lg"
                            className="text-blue-500"
                        />
                    </div>
                </StatCard>
            </div>
        </div>
    );
}
