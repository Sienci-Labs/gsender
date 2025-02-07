import { MaintenanceTaskForm } from 'app/features/Stats/components/MaintenanceTaskForm.tsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';

interface MaintenanceAddTaskDialogProps {
    show: boolean;
    toggleShow: (b) => void;
}

export function MaintenanceAddTaskDialog({
    show,
    toggleShow,
}: MaintenanceAddTaskDialogProps) {
    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <MaintenanceTaskForm />
                <div>HERE BE ACTIONS</div>
            </DialogContent>
        </Dialog>
    );
}
