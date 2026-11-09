import api from 'app/api';
import Button from 'app/components/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import controller from 'app/lib/controller.ts';
import { toast } from 'app/lib/toaster';
import { Loader2, Monitor, QrCode, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { type PairRequest, parsePairPayload } from './pairPayload';
import QrScanner from './QrScanner';

const PENDING_PAIR_TTL_MS = 2 * 60 * 1000;

type PairedDesktop = { id: string; name: string; pairedAt: number };

interface PairedDesktopsProps {
    running: boolean;
}

export default function PairedDesktops({ running }: PairedDesktopsProps) {
    const [desktops, setDesktops] = useState<PairedDesktop[]>([]);
    const [scanning, setScanning] = useState(false);
    const [pendingName, setPendingName] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const res = await api.remoteFileReceive.listDesktops();
            setDesktops(res.data.desktops);
        } catch {
            // Keep whatever we last showed.
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const beginPair = useCallback(
        async (request: PairRequest) => {
            if (!running) {
                toast.error('Turn on Remote File Receive before pairing');
                return;
            }
            try {
                await api.remoteFileReceive.setPendingPair(request);
                setPendingName(request.desktopName);
                // Matches the server-side pending pair lifetime.
                setTimeout(() => setPendingName(null), PENDING_PAIR_TTL_MS);
            } catch {
                toast.error('Could not start pairing');
            }
        },
        [running],
    );

    const handleScan = useCallback(
        (text: string) => {
            setScanning(false);
            const request = parsePairPayload(text);
            if (!request) {
                toast.error("That QR code isn't a gSender pairing code");
                return;
            }
            beginPair(request);
        },
        [beginPair],
    );

    useEffect(() => {
        // The toast itself comes from the pendant-wide IncomingPairLink.
        const onComplete = () => {
            setPendingName(null);
            refresh();
        };
        controller.addListener('remote:pair-complete', onComplete);
        return () => {
            controller.removeListener('remote:pair-complete', onComplete);
        };
    }, [refresh]);

    async function forget(desktop: PairedDesktop) {
        try {
            await api.remoteFileReceive.forgetDesktop(desktop.id);
            refresh();
        } catch {
            toast.error(`Could not forget ${desktop.name}`);
        }
    }

    return (
        <div className="flex flex-col gap-2 rounded-md border border-gray-200 dark:border-outline p-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold dark:text-content-primary">
                    Paired desktops
                </span>
                <Button
                    variant="secondary"
                    disabled={!running}
                    onClick={() => setScanning(true)}
                >
                    <QrCode className="w-4 h-4 mr-1" />
                    Pair with desktop
                </Button>
            </div>

            {pendingName && (
                <p className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pairing with {pendingName}…
                </p>
            )}

            {desktops.length === 0 ? (
                <p className="text-sm text-gray-500">
                    On the desktop, open Send to Pendant and choose "Pair a new
                    tablet", then scan the code it shows.
                </p>
            ) : (
                desktops.map((desktop) => (
                    <div
                        key={desktop.id}
                        className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-surface-raised rounded"
                    >
                        <Monitor className="w-4 h-4 shrink-0 text-gray-500" />
                        <span className="flex-1 truncate dark:text-content-primary">
                            {desktop.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => forget(desktop)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-outline dark:text-content-primary"
                        >
                            <X className="w-3.5 h-3.5" />
                            Forget
                        </button>
                    </div>
                ))
            )}

            <Dialog open={scanning} onOpenChange={setScanning}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-surface-raised">
                    <DialogHeader>
                        <DialogTitle>Scan pairing code</DialogTitle>
                        <DialogDescription>
                            Point the camera at the QR code shown in the
                            desktop's Send to Pendant dialog.
                        </DialogDescription>
                    </DialogHeader>
                    {scanning && <QrScanner onScan={handleScan} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
