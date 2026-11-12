import { Button } from 'app/components/Button';
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
import { Tooltip } from 'app/components/Tooltip';
import { useAppTranslation } from 'app/i18n';
import { FaRedo } from 'react-icons/fa';

type ReloadFileAlertProps = {
    fileLoaded: boolean;
    handleFileReload: () => void;
};

export function ReloadFileAlert({
    fileLoaded,
    handleFileReload,
}: ReloadFileAlertProps) {
    const { t } = useAppTranslation();
    return (
        <AlertDialog>
            <Tooltip content={t('workspace:fileControl.reloadFile')}>
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={!fileLoaded}
                        icon={
                            <FaRedo className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                        }
                        variant="ghost"
                        className="h-full rounded-none"
                        aria-label={t('workspace:fileControl.reloadFile')}
                    />
                </AlertDialogTrigger>
            </Tooltip>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('workspace:fileControl.confirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('workspace:fileControl.reloadFileConfirm')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t('common:actions.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleFileReload}>
                        {t('workspace:fileControl.reloadFile')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
