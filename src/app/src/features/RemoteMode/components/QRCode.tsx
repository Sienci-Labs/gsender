import QRCode from 'react-qr-code';
import React from 'react';
import { FaCopy } from 'react-icons/fa';
import Button from 'app/components/Button';

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
}

export function QRCodeDisplay({ address = '192.168.0.10:8000' }) {
    const safeAddress = `http://${address}/#/remote`;
    return (
        <div className="flex flex-col items-center text-sm text-gray-600 gap-4 px-4 justify-center dark:text-white">
            <h1 className="text-blue-500 text-2xl">Scan QR Code</h1>
            <p>Scan this with your phone camera to control your CNC:</p>
            <QRCode size={200} value={safeAddress} viewBox="0 0 200 200" />
            <p>Or type the text below into a web browser on any device:</p>
            <div className="flex flex-row items-center gap-2  text-xs font-semibold text-blue-500 bg-gray-100 border border-gray-200 rounded-lg dark:bg-dark dark:border-gray-700 dark:text-white">
                <div className="px-2">{safeAddress}</div>
                <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="flex flex-row items-center justify-center gap-1"
                    onClick={() => copyToClipboard(safeAddress)}
                >
                    <span>Copy</span> <FaCopy />
                </Button>
            </div>
        </div>
    );
}
