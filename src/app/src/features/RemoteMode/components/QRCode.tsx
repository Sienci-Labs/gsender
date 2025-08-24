import QRCode from 'react-qr-code';
import { FaCopy } from 'react-icons/fa';

import Button from 'app/components/Button';
import { toast } from 'app/lib/toaster';

import { copyToClipboard } from '../utils';

export function QRCodeDisplay({ address = '192.168.0.10:8000' }) {
    const handleCopy = async (address: string) => {
        const { success } = await copyToClipboard(address);

        if (success) {
            toast.success('Copied link to clipboard');
            return;
        }

        toast.error(
            'There was an error copying the link to the clipboard, please copy it manually.',
        );
    };

    const webAddress = `${address}`;
    const phoneAddress = `http://${address}/#/remote`;

    return (
        <div className="flex flex-col items-center text-sm text-gray-600 gap-4 px-4 justify-center dark:text-white">
            <h1 className="text-blue-500 text-2xl">Scan QR Code</h1>
            <p>Scan with your phone camera to control your CNC</p>
            <QRCode size={200} value={phoneAddress} viewBox="0 0 200 200" />
            <p>
                Or type the text below into a web browser for any other device:
            </p>
            <div className="flex flex-row items-center gap-2  text-xs font-semibold text-blue-500 bg-gray-100 border border-gray-200 rounded-lg dark:bg-dark dark:border-gray-700 dark:text-white">
                <div className="px-2 select-text">{webAddress}</div>
                <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="flex flex-row items-center justify-center gap-1"
                    onClick={() => handleCopy(webAddress)}
                    text="Copy"
                    icon={<FaCopy />}
                />
            </div>
        </div>
    );
}
