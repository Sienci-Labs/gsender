import Button from 'app/components/Button';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog.tsx';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { Switch } from 'app/components/shadcn/Switch';
import {
    AddressOption,
    AddressSummary,
} from 'app/features/RemoteMode/components/AddressOption.tsx';
import { QRCodeDisplay } from 'app/features/RemoteMode/components/QRCode.tsx';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';
import { isIPv4 } from 'app/lib/utils';
import type { RootState } from 'app/store/redux';
import { TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

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

    // Addresses another device can actually reach come first; loopback and
    // virtual adapters are kept but tucked away under "Other / advanced".
    const { usableAddresses, otherAddresses, recommended } = useMemo(
        () => ({
            usableAddresses: ipList.filter((entry) => entry.usable),
            otherAddresses: ipList.filter((entry) => !entry.usable),
            recommended: ipList.find((entry) => entry.recommended) ?? null,
        }),
        [ipList],
    );

    const selectedEntry = ipList.find((entry) => entry.address === ip) ?? null;
    // The saved address is gone - most often a laptop that has changed networks.
    const savedAddressMissing = ipList.length > 0 && !selectedEntry;

    useEffect(() => {
        remoteIp && setIp(remoteIp);
        remotePort && setPort(remotePort);
        remoteOn && setRemoteEnabled(remoteOn);
    }, [remoteIp, remotePort, remoteOn]);

    useEffect(() => {
        controller.listAllIps();
    }, [showRemote]);

    // Nothing saved yet - start on the address we recommend rather than on
    // 127.0.0.1, which no other device can ever reach.
    useEffect(() => {
        if (remoteIp || dirty) {
            return;
        }

        const preferred = recommended ?? usableAddresses[0];
        if (preferred) {
            setIp(preferred.address);
        }
    }, [remoteIp, dirty, recommended, usableAddresses]);

    function applyRecommendedIp() {
        if (recommended) {
            setDirty(true);
            setIp(recommended.address);
        }
    }

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

        if (!isIPv4(ip)) {
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
                                <span className="font-bold dark:text-content-primary">
                                    Enable Wireless Control
                                </span>
                                <Switch
                                    onChange={toggleRemoteMode}
                                    checked={remoteEnabled}
                                />
                            </div>
                            <p className="dark:text-content-primary">
                                In most cases you'll want the recommended
                                address and the default port:
                            </p>
                            {/* Addr and Port are one group, so they sit closer together than
							    the column's gap-8 would otherwise put them. */}
                            <div className="flex flex-col w-full gap-4">
                                <div className="flex flex-col w-full gap-1">
                                    <div className="flex flex-row w-full items-center gap-4">
                                        <span className="w-12 shrink-0 dark:text-content-primary">
                                            Addr:
                                        </span>
                                        <Select
                                            onValueChange={onIPSelect}
                                            value={ip}
                                        >
                                            {/* The shared trigger line-clamps its value span, which turns
										    it into a -webkit-box, and Radix's SelectValue drops any
										    className it is given, so the span can only be reached from
										    here. It needs full width to right-align the status marker. */}
                                            <SelectTrigger className="min-w-0 gap-2 [&>span]:!line-clamp-none [&>span]:w-full">
                                                <SelectValue>
                                                    <span className="flex items-center gap-2 w-full min-w-0 overflow-hidden">
                                                        <AddressSummary
                                                            address={ip}
                                                            entry={
                                                                selectedEntry
                                                            }
                                                        />
                                                    </span>
                                                </SelectValue>
                                            </SelectTrigger>
                                            {/* SelectContent pins itself to the trigger width, which is too
										    narrow for an address plus its description. The `[&]` wrapper
										    is deliberate: this config sets `important: true`, so a plain
										    (or `!`-prefixed) width utility loses to the component's own
										    `w-[var(--radix-select-trigger-width)]` on source order. */}
                                            <SelectContent className="bg-white z-[10000] [&]:w-max min-w-[var(--radix-select-trigger-width)] max-w-[20rem]">
                                                {usableAddresses.map((o) => (
                                                    <SelectItem
                                                        key={o.address}
                                                        value={o.address}
                                                    >
                                                        <AddressOption
                                                            entry={o}
                                                        />
                                                    </SelectItem>
                                                ))}
                                                {otherAddresses.length > 0 && (
                                                    <SelectGroup>
                                                        <SelectLabel className="pl-2 pt-2 text-xs font-normal text-gray-400 dark:text-content-muted border-t border-gray-100 dark:border-outline-subtle mt-1">
                                                            Other / advanced
                                                        </SelectLabel>
                                                        {otherAddresses.map(
                                                            (o) => (
                                                                <SelectItem
                                                                    key={
                                                                        o.address
                                                                    }
                                                                    value={
                                                                        o.address
                                                                    }
                                                                >
                                                                    <AddressOption
                                                                        entry={
                                                                            o
                                                                        }
                                                                    />
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Fixed height so switching addresses never shifts the dialog,
								    sized to the tallest state (the two-line warning) and no more. */}
                                    <div className="h-12 flex items-center text-xs leading-tight">
                                        {savedAddressMissing ? (
                                            <div className="flex flex-row w-full h-full gap-2 items-center text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded p-1.5">
                                                <TriangleAlert className="w-4 h-4 shrink-0" />
                                                <div className="flex flex-col items-start min-w-0">
                                                    <span>
                                                        This computer no longer
                                                        has{' '}
                                                        <b className="font-mono">
                                                            {ip}
                                                        </b>
                                                        .
                                                    </span>
                                                    {recommended && (
                                                        <button
                                                            type="button"
                                                            className="underline font-semibold"
                                                            onClick={
                                                                applyRecommendedIp
                                                            }
                                                        >
                                                            Use{' '}
                                                            {
                                                                recommended.address
                                                            }{' '}
                                                            ({recommended.label}
                                                            ) instead
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : selectedEntry?.usable === false ? (
                                            <span className="text-amber-700 dark:text-amber-400">
                                                Other devices can't reach
                                                gSender at this address — pick
                                                the recommended one to use
                                                wireless control.
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 dark:text-content-muted">
                                                {selectedEntry
                                                    ? `${selectedEntry.label} — `
                                                    : ''}
                                                other devices on your network
                                                use this address to reach
                                                gSender.
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-row w-full items-center gap-4">
                                    <span className="w-12 shrink-0 dark:text-content-primary">
                                        Port:
                                    </span>
                                    <input
                                        className="border border-gray-200 rounded p-2 focus:outline-none w-full min-w-0 dark:bg-surface-raised dark:text-content-primary"
                                        type="number"
                                        value={port}
                                        onChange={updatePort}
                                    />
                                </div>
                            </div>
                            <p className="dark:text-content-primary text-sm">
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
