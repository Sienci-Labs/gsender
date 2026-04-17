import isElectron from 'is-electron';
import { GrPowerShutdown } from 'react-icons/gr';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import Tooltip from 'app/components/Tooltip';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

const PowerButton = () => {
    const { showPowerButton } = useWorkspaceState();

    if (!isElectron() || !showPowerButton) {
        return null;
    }

    const handleClick = () => {
        Confirm({
            title: 'Shut Down Computer',
            content:
                'Are you sure you want to shut down this computer? This will close gSender and power off the host machine.',
            confirmLabel: 'Shut Down',
            cancelLabel: 'Cancel',
            onConfirm: () => {
                // @ts-ignore
                window.ipcRenderer.send('shutdown-host');
            },
        });
    };

    return (
        <Tooltip content="Shut Down Computer">
            <button
                className="flex flex-col gap-0.5 self-center content-center items-center justify-center text-sm text-gray-500 ml-4"
                onClick={handleClick}
                aria-label="Shut down host computer"
            >
                <GrPowerShutdown className="w-7 h-7 text-red-500 hover:text-red-700" />
            </button>
        </Tooltip>
    );
};

export default PowerButton;
