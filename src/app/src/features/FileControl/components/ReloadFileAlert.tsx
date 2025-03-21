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

export function ReloadFileAlert({ fileLoaded, handleFileReload }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    disabled={!fileLoaded}
                    icon={
                        <FaRedo className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                    }
                    variant="ghost"
                    className="h-10 w-12 rounded-none"
                />
            </AlertDialogTrigger>
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
