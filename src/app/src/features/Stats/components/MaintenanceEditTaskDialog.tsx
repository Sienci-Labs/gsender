import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import { buttonStyle } from 'app/features/Stats/components/MaintenanceAddTaskDialog.tsx';
import { useContext, useEffect, useState } from 'react';
import {
    MaintenanceTask,
    StatContext,
} from 'app/features/Stats/utils/StatContext.tsx';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from 'app/components/shadcn/AlertDialog';
// import Button from 'app/components/Button';

interface MaintenanceEditTaskDialogProps {
    show: boolean;
    toggleShow: (b: boolean) => void;
    currentTask: MaintenanceTask;
}

export function MaintenanceEditTaskDialog({
    show,
    toggleShow,
    currentTask,
}: MaintenanceEditTaskDialogProps) {
    const { maintenanceTasks, maintenanceActions, setMaintenanceTasks } =
        useContext(StatContext);
    const [task, setTask] = useState<MaintenanceTask>(currentTask);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        setTask(currentTask);
    }, [currentTask]);

    const updateTask = (editedTask: MaintenanceTask) => {
        const updatedTasks = maintenanceTasks.map((obj) => {
            if (obj.id === editedTask.id) {
                return editedTask;
            }
            return obj;
        });
        setMaintenanceTasks([...updatedTasks]);
        setTask(editedTask);
        maintenanceActions.update(updatedTasks);
    };

    const deleteTask = () => {
        setShowDeleteConfirmation(false);
        toggleShow(false);
        const index = maintenanceTasks.indexOf(task);
        if (index >= 0) {
            maintenanceTasks.splice(index, 1);
        }
        setMaintenanceTasks([...maintenanceTasks]);
        maintenanceActions.update(maintenanceTasks);
    };

    const onDelete = () => {
        setShowDeleteConfirmation(true);
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
            id: task.id,
            description,
            rangeStart,
            rangeEnd,
            name,
            currentTime: task.currentTime,
        };

        updateTask(payload);
        toggleShow(false);
    }

    return (
        <>
            <Dialog open={show} onOpenChange={toggleShow}>
                <DialogContent className="bg-white w-1/2">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <form className="w-full" onSubmit={handleSubmit}>
                        <MaintenanceTaskForm task={task} />
                        <div className="w-full -mx-3 mb-2 p-2 flex flex-row-reverse gap-4">
                            <button
                                type="submit"
                                className={buttonStyle({ colors: 'primary' })}
                            >
                                Save
                            </button>
                            <button
                                className={buttonStyle({ colors: 'secondary' })}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleShow(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={buttonStyle({ colors: 'danger' })}
                                onClick={(_e) => onDelete()}
                            >
                                Delete
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            {showDeleteConfirmation && (
                <AlertDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                >
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                                {'Are you sure you want to delete ' +
                                    task.name +
                                    '?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteTask}>
                                Yes
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
