import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';

export function ATCStartValidations({
    show = true,
    setShow = () => {},
    payload,
}: {
    show: boolean;
    setShow: (show: boolean) => void;
    payload: object;
}) {
    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="w-[500px] min-h-[200px] flex flex-col">
                <DialogTitle>ATCI - {payload.title}</DialogTitle>
                <DialogDescription className="flex flex-col gap-4 text-gray-400">
                    {payload.body}
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
