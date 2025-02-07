import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import { buttonStyle } from 'app/features/Stats/components/MaintenanceAddTaskDialog.tsx';

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
    function handleSubmit(e) {
        e.preventDefault();
        console.log(e);
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
                            Save
                        </button>
                        <button
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
