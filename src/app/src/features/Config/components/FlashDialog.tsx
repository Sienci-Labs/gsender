import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';

interface flashDialogProps {
    show: boolean;
    toggleShow: (b) => void;
}

export function FlashDialog({ show, toggleShow }: flashDialogProps) {
    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle>Flash Firmware</DialogTitle>
                </DialogHeader>
                <div>Here be content</div>
            </DialogContent>
        </Dialog>
    );
}
