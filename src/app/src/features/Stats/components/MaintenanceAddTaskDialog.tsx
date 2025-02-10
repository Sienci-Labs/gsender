import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import api from 'app/api';

import { tv } from 'tailwind-variants';
import { useContext, useEffect } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import maintenanceActions from '../../../../../app_old/containers/Preferences/Stats/lib/maintenanceApiActions';

export const buttonStyle = tv({
    base: 'inline-flex items-center px-6 py-3 border text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out',
    variants: {
        colors: {
            primary: 'border-transparent text-white bg-blue-500',
            secondary: 'bg-white border-blue-500 text-blue-500',
            danger: 'text-white border-transparent bg-red-500',
        },
    },
});

interface MaintenanceAddTaskDialogProps {
    show: boolean;
    toggleShow: (b) => void;
    handleSuccess: (e) => void;
}

export function MaintenanceAddTaskDialog({
    show,
    toggleShow,
}: MaintenanceAddTaskDialogProps) {
    const { maintenanceTasks, setMaintenanceTasks } = useContext(StatContext);

    const addTask = (newTask) => {
        const maxIDTask = maintenanceTasks.reduce((prev, current) => {
            return prev && prev.id > current.id ? prev : current;
        });
        newTask.id = maxIDTask.id + 1;

        maintenanceTasks.push(newTask);
        setMaintenanceTasks([...maintenanceTasks]);
        maintenanceActions.update(maintenanceTasks);
        //updateTasks(tasks);
    };

    function handleSubmit(e) {
        e.preventDefault();
        const description = e.target.description.value;
        const rangeStart = Number(e.target.startRange.value);
        const rangeEnd = Number(e.target.endRange.value);
        const name = e.target.taskName.value;

        const payload = {
            description,
            rangeStart,
            rangeEnd,
            name,
            currentTime: 0,
        };

        addTask(payload);
        toggleShow(false);
    }
    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <form className="w-full max-w-lg" onSubmit={handleSubmit}>
                    <MaintenanceTaskForm />
                    <div className="w-full -mx-3 mb-2 p-2 flex flex-row-reverse gap-4">
                        <button
                            type="submit"
                            className={buttonStyle({ colors: 'primary' })}
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            className={buttonStyle({ colors: 'secondary' })}
                            onClick={(e) => {
                                e.preventDefault();
                                toggleShow(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
