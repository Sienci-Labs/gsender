import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';

import { tv } from 'tailwind-variants';
import { useContext } from 'react';
import {
    MaintenanceTask,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
// import maintenanceActions from '../../../../../app_old/containers/Preferences/Stats/lib/maintenanceApiActions';

export const buttonStyle = tv({
    base: 'inline-flex items-center px-6 py-3 border text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out',
    variants: {
        colors: {
            primary: 'border-transparent text-white bg-blue-500',
            secondary:
                'bg-white border-blue-500 text-blue-500 dark:bg-dark dark:text-white dark:border-dark-lighter',
            danger: 'text-white border-transparent bg-red-500',
        },
    },
});

interface MaintenanceAddTaskDialogProps {
    show: boolean;
    toggleShow: (b: boolean) => void;
    handleSuccess?: () => void;
}

export function MaintenanceAddTaskDialog({
    show,
    toggleShow,
}: MaintenanceAddTaskDialogProps) {
    const { maintenanceTasks, maintenanceActions, setMaintenanceTasks } =
        useContext(StatContext);

    const addTask = (newTask: MaintenanceTask) => {
        const maxIDTask = maintenanceTasks.reduce((prev, current) => {
            return prev && prev.id > current.id ? prev : current;
        });
        newTask.id = maxIDTask.id + 1;

        maintenanceTasks.push(newTask);
        setMaintenanceTasks([...maintenanceTasks]);
        maintenanceActions.update(maintenanceTasks);
        //updateTasks(tasks);
    };

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            description: { value: string };
            startRange: { value: string };
            endRange: { value: string };
            taskName: { value: string };
        };
        const description = target.description.value;
        const rangeStart = Number(target.startRange.value);
        const rangeEnd = Number(target.endRange.value);
        const name = target.taskName.value;

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
            <DialogContent className="bg-white w-1/2">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <form className="w-full" onSubmit={handleSubmit}>
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
