import { useEffect, useState } from 'react';
import ipLib from 'ip';
import { useSelector } from 'react-redux';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { QRCodeDisplay } from 'app/features/RemoteMode/components/QRCode.tsx';
import Button from 'app/components/Button';
import { Switch } from 'app/components/shadcn/Switch';
import { toast } from 'app/lib/toaster';
import controller from 'app/lib/controller.ts';
import { RootState } from 'app/store/redux';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';

import { actions } from './apiActions.ts';

type RemoteModeDialogProps = {
    showRemote: boolean;
    onClose: (open: boolean) => void;
    setHeadlessSettings: (settings: any) => void;
    remoteIp: string;
    remotePort: number;
    remoteOn: boolean;
};

export function RemoteModeDialog({
    showRemote,
    onClose,
    setHeadlessSettings,
    remoteIp,
    remotePort,
    remoteOn,
}: RemoteModeDialogProps) {
    const [port, setPort] = useState(8000);
    const [ip, setIp] = useState('127.0.0.1');
    const [remoteEnabled, setRemoteEnabled] = useState(false);
    const [dirty, setDirty] = useState(false);

    const ipList = useSelector((state: RootState) => state.preferences.ipList);

    useEffect(() => {
        remoteIp && setIp(remoteIp);
        remotePort && setPort(remotePort);
        remoteOn && setRemoteEnabled(remoteOn);
    }, [remoteIp, remotePort, remoteOn]);

    useEffect(() => {
        controller.listAllIps();
    }, [showRemote]);

    function toggleRemoteMode() {
        setDirty(true);
        setRemoteEnabled(!remoteEnabled);
    }

    function updatePort(e: React.ChangeEvent<HTMLInputElement>) {
        setDirty(true);
        e.preventDefault();
        setPort(Number(e.target.value));
    }

    function onIPSelect(v: string) {
        setDirty(true);
        setIp(v);
    }

    function onConfirmUpdate() {
        const payload = {
            ip,
            port,
            headlessStatus: remoteEnabled,
        };

        // Validations
        if (Number(port) < 1025 || Number(port) > 65535) {
            toast.error('Invalid Port Number - Must be between 1025 and 65535');
            return;
        }

        if (!ipLib.isV4Format(ip)) {
            toast.error(
                `Invalid IP Address - ${ip} does not look like a valid V4 IP address`,
            );
            return;
        }

        onClose(false);
        actions.saveSettings(payload);
        setHeadlessSettings(payload);
        toast.success('Updated Wireless Control Settings', {
            position: 'bottom-right',
        });
    }

    function saveRemotePreferences(e: React.FormEvent<HTMLButtonElement>) {
        e.preventDefault();

        Confirm({
            onConfirm: onConfirmUpdate,
            confirmLabel: 'Save Settings',
            title: 'Save Wireless CNC Settings',
            content:
                'Are you sure you want to save these settings?  This will restart the application.',
        });
    }

    return (
        <Dialog open={showRemote} onOpenChange={onClose}>
            <DialogContent className="bg-white w-[750px] text-sm">
                <form>
                    <DialogHeader>
                        <DialogTitle>Wireless CNC Control</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 text-gray-600 grid-">
                        <div className="flex flex-col gap-8 px-4">
                            <div className="flex flex-row gap-4 items-center">
                                <span className="font-bold dark:text-white">
                                    Enable Wireless Control
                                </span>
                                <Switch
                                    onChange={toggleRemoteMode}
                                    checked={remoteEnabled}
                                />
                            </div>
                            <p className="dark:text-white">
                                Choose your settings below. In most cases the
                                default values should work:
                            </p>
                            <div className="flex flex-row w-full justify-between items-center gap-4">
                                <span className="dark:text-white">Addr:</span>
                                <Select onValueChange={onIPSelect} value={ip}>
                                    <SelectTrigger className="">
                                        <SelectValue placeholder={ip} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-[10000]">
                                        {ipList.map((o) => (
                                            <SelectItem
                                                key={`${o}`}
                                                value={`${o}`}
                                            >
                                                {o}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-row w-full justify-start items-center gap-4">
                                <span className="dark:text-white">Port:</span>
                                <input
                                    className="border border-gray-200 rounded p-2 focus:outline-none w-full dark:bg-dark dark:text-white"
                                    type="number"
                                    value={port}
                                    onChange={updatePort}
                                />
                            </div>
                            <p className="dark:text-white text-sm">
                                <b>Note:</b> Clicking "Save" will ask you to
                                restart gSender so that the settings can be
                                updated.
                            </p>
                            <hr />
                            <Button
                                variant="primary"
                                disabled={!dirty}
                                onClick={saveRemotePreferences}
                            >
                                Save
                            </Button>
                        </div>

                        <QRCodeDisplay address={`${ip}:${port}`} />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
