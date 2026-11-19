import Button from 'app/components/Button';
import { i18n, useAppTranslation } from 'app/i18n';
import { toast } from 'app/lib/toaster';
import { FaCopy } from 'react-icons/fa';
import QRCode from 'react-qr-code';

import { copyToClipboard } from '../utils';

export function QRCodeDisplay({ address = '192.168.0.10:8000' }) {
    const { t } = useAppTranslation();
    const handleCopy = async (address: string) => {
        const { success } = await copyToClipboard(address);

        if (success) {
            toast.success(i18n.t('notifications:remoteMode.linkCopied'));
            return;
        }

        toast.error(i18n.t('notifications:remoteMode.linkCopyFailed'));
    };

    const webAddress = `${address}`;
    const phoneAddress = `http://${address}/#/remote`;

    return (
        <div className="flex flex-col items-center text-sm text-gray-600 gap-4 px-4 justify-center dark:text-content-primary">
            <h1 className="text-blue-600 dark:text-blue-400 text-2xl">
                {t('common:wizard.scanQrCode')}
            </h1>
            <p>{t('tools:remoteMode.qrCode.scanHint')}</p>
            <div className="border-8 border-gray-900 dark:border-white rounded-md bg-white p-2">
                <QRCode size={200} value={phoneAddress} viewBox="0 0 200 200" />
            </div>
            <p>{t('tools:remoteMode.qrCode.typeAddress')}</p>
            <div className="flex flex-row items-center gap-2  text-xs font-semibold text-blue-600 bg-gray-100 border border-gray-200 rounded-lg dark:bg-surface-raised dark:border-outline dark:text-content-primary">
                <div className="px-2 select-text">{webAddress}</div>
                <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="flex flex-row items-center justify-center gap-1"
                    onClick={() => handleCopy(webAddress)}
                    text={t('tools:remoteMode.qrCode.copy')}
                    icon={<FaCopy />}
                />
            </div>
        </div>
    );
}
