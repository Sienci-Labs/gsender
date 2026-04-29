import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@gsender/ui/shadcn/Dialog.tsx';
import Button from '@gsender/ui/primitives/Button';
import controller from '@gsender/controller-client/controller';
import { FaPlay } from 'react-icons/fa';

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
                <DialogTitle>ATC - {payload.title}</DialogTitle>
                <DialogDescription className="flex flex-col gap-4 text-gray-400">
                    {payload.body}
                    {payload.type === 'alert' && (
                        <Button
                            variant="success"
                            onClick={() => {
                                controller.command('gcode:start');
                                setShow(false);
                            }}
                        >
                            <FaPlay /> Run job
                        </Button>
                    )}
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
