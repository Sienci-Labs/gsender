import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { StatCard } from 'app/features/Stats/components/StatCard';
import { AlarmListing } from 'app/features/Stats/components/AlarmListing.tsx';
import { CardHeader } from 'app/features/Stats/components/CardHeader.tsx';
import ToolModalButton from 'app/components/ToolModalButton';
import { FaTrash } from 'react-icons/fa';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import api from 'app/api';
import { useContext } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';

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
                    <CardHeader>Errors and Alarms</CardHeader>
                    <AlarmListing />
                </StatCard>
            </div>
            <div className="col-span-2 row-span-6 col-start-5 px-8 flex flex-col gap-4">
                <StatCard>
                    <CardHeader>Diagnostic File</CardHeader>
                    <Diagnostic />
                </StatCard>
                <StatCard>
                    <CardHeader>Clear Alarm List</CardHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-gray-600 text-sm">
                            Clear all prior alarms and errors. This action
                            cannot be undone.
                        </p>
                        <ToolModalButton
                            icon={<FaTrash />}
                            onClick={deleteAlarms}
                        >
                            Clear Alarms and Errors
                        </ToolModalButton>
                    </div>
                </StatCard>
            </div>
        </div>
    );
}
