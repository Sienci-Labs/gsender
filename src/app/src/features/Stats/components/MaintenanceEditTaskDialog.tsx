import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import { buttonStyle } from 'app/features/Stats/components/MaintenanceAddTaskDialog.tsx';
import { useContext, useEffect, useState } from 'react';
import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';

interface MaintenanceEditTaskDialogProps {
    show: boolean;
    toggleShow: (b) => void;
    id?: number;
}

export function MaintenanceEditTaskDialog({
    show,
    toggleShow,
    id = -1,
}: MaintenanceEditTaskDialogProps) {
    const { maintenanceTasks } = useContext(StatContext);
    const [task, setTask] = useState({});
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
    }

    useEffect(() => {
        const selectedTask = maintenanceTasks.find((obj) => obj.id === id);
        setTask(selectedTask);
    }, [id]);

    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <form className="w-full max-w-lg" onSubmit={handleSubmit}>
                    <MaintenanceTaskForm value={task} />
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
                        >
                            Delete
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
