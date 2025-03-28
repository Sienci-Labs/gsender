import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import { QRCodeDisplay } from 'app/features/RemoteMode/components/QRCode.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import Button from 'app/components/Button';
import Toggle from 'app/components/Switch/Toggle.tsx';
import { useEffect, useState } from 'react';
import { toast } from 'app/lib/toaster';
import { actions } from './apiActions.ts';
import controller from 'app/lib/controller.ts';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';

export function RemoteModeDialog({
    showRemote,
    onClose,
    setHeadlessSettings,
    remoteIp,
    remotePort,
    remoteOn,
}) {
    const [port, setPort] = useState(8000);
    const [ip, setIp] = useState('192.168.0.10');
    const [remoteEnabled, setRemoteEnabled] = useState(false);
    const [dirty, setDirty] = useState(false);

    const ipList = useSelector((state: RootState) => state.preferences.ipList);

    useEffect(() => {
        setIp(remoteIp);
        setPort(remotePort);
        setRemoteEnabled(remoteOn);
    }, [remoteIp, remotePort, remoteOn]);

    useEffect(() => {
        controller.listAllIps();
    }, [showRemote]);

    function toggleRemoteMode() {
        setDirty(true);
        setRemoteEnabled(!remoteEnabled);
    }

    function updatePort(e) {
        e.preventDefault();
        setPort(e.target.value);
    }

    function onIPSelect(v) {
        setIp(v);
    }

    function saveRemotePreferences(e) {
        e.preventDefault();

        const payload = {
            ip,
            port,
            headlessStatus: remoteEnabled,
        };
        onClose(false);
        actions.saveSettings(payload);
        setHeadlessSettings(payload);
        toast.success('Updated Wireless Control Settings');
    }

    return (
        <Dialog open={showRemote} onOpenChange={onClose}>
            <DialogContent className="bg-white w-[750px] text-sm">
                <form>
                    <DialogHeader></DialogHeader>
                    <div className="grid grid-cols-2 text-gray-600 grid-">
                        <div className="flex flex-col gap-8 px-4">
                            <h1 className="text-2xl text-blue-500">
                                Wireless CNC Control
                            </h1>
                            <div className="flex flex-row gap-4 items-center">
                                <span className="font-bold dark:text-white">
                                    Enable Wireless Control
                                </span>
                                <Toggle
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
                                <Select onValueChange={onIPSelect}>
                                    <SelectTrigger className="w-2/3 bg-white bg-opacity-100">
                                        <SelectValue placeholder={ip} />
                                    </SelectTrigger>
                                    <SelectContent
                                        contentEditable={true}
                                        className="bg-white"
                                    >
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
                                    className="border border-gray-200 rounded p-2 focus:outline-none w-full"
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
                    <DialogFooter></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
