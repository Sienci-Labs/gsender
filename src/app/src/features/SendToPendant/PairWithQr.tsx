import api from 'app/api';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

import type { PendantTablet } from './usePendantTablets';

const POLL_MS = 1500;

interface PairWithQrProps {
    onPaired: (tablet: PendantTablet) => void;
    onUseCode: () => void;
    onCancel: () => void;
}

// Shows a one-time pairing QR and polls discovered tablets until one of them
// has scanned it. The tablet never connects back to us - the desktop server
// claims the scanned nonce against each tablet's receiver.
export const PairWithQr: React.FC<PairWithQrProps> = ({
    onPaired,
    onUseCode,
    onCancel,
}) => {
    const [qr, setQr] = useState<{ nonce: string; payload: string } | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let nonce: string | null = null;

        const issue = async () => {
            try {
                const res = await api.pendantPairing.createQr();
                if (cancelled) return;
                nonce = res.data.nonce;
                setQr({ nonce: res.data.nonce, payload: res.data.payload });
                setError(null);
            } catch {
                if (!cancelled) setError('Could not create a pairing code');
            }
        };

        const poll = async () => {
            if (cancelled) return;
            if (nonce) {
                try {
                    const res = await api.pendantPairing.claim({ nonce });
                    if (cancelled) return;
                    if (res.data.paired) {
                        onPaired({
                            ...res.data.tablet,
                            paired: true,
                            online: true,
                        });
                        return;
                    }
                } catch (err: any) {
                    // Expired - quietly swap in a fresh QR.
                    if (err?.response?.status === 410) {
                        await issue();
                    }
                }
            }
            timer = setTimeout(poll, POLL_MS);
        };

        issue().then(poll);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [onPaired]);

    return (
        <div className="flex flex-col items-center gap-3 text-sm">
            <p className="text-center text-gray-600 dark:text-content-muted">
                On the tablet, open <b>Remote File Receive</b> and tap{' '}
                <b>Pair with desktop</b>, then point it at this code.
            </p>
            <div className="bg-white p-3 rounded-md border border-gray-200">
                {qr ? (
                    <QRCode
                        size={200}
                        value={qr.payload}
                        viewBox="0 0 200 200"
                    />
                ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                )}
            </div>
            {error ? (
                <p className="text-red-600 text-xs">{error}</p>
            ) : (
                <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Waiting for a tablet to scan…
                </p>
            )}
            <div className="flex gap-4 text-xs">
                <button
                    type="button"
                    onClick={onUseCode}
                    className="text-blue-600 dark:text-blue-400 font-medium"
                >
                    Use pairing code instead
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-600 dark:text-content-muted"
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default PairWithQr;
