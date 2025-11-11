import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog.tsx';
import { Button } from 'app/components/Button';
import { FaRedo } from 'react-icons/fa';

import { Tooltip } from 'app/components/Tooltip';

type ReloadFileAlertProps = {
    fileLoaded: boolean;
    handleFileReload: () => void;
};

export function ReloadFileAlert({
    fileLoaded,
    handleFileReload,
}: ReloadFileAlertProps) {
    return (
        <AlertDialog>
            <Tooltip content="Reload File">
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={!fileLoaded}
                        icon={
                            <FaRedo className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                        }
                        variant="ghost"
                        className="h-full rounded-none"
                    />
                </AlertDialogTrigger>
            </Tooltip>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will reload the current file from disk.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFileReload}>
                        Reload File
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
