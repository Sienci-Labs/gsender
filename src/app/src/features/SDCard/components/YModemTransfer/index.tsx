import React, { useState, useRef, useEffect } from 'react';
import controller from 'app/lib/controller';
import Button from 'app/components/Button';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { toast } from 'app/lib/toaster';

type YModemTransferProps = {
    onComplete?: () => void;
    onCancel?: () => void;
};

type TransferState =
    | 'idle'
    | 'transferring'
    | 'complete'
    | 'error'
    | 'cancelled';

const YModemTransfer: React.FC<YModemTransferProps> = ({
    onComplete,
    onCancel,
}) => {
    const [transferState, setTransferState] = useState<TransferState>('idle');
    const [progress, setProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState<string>('');
    const [fileSize, setFileSize] = useState(0);
    const [bytesSent, setBytesSent] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
    const [overwriteFilename, setOverwriteFilename] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );
    const controllerType = useTypedSelector((state) => state.controller.type);

    useEffect(() => {
        // Listen for YMODEM events
        const handleYModemReady = () => {
            setTransferState('transferring');
            setProgress(0);
            setErrorMessage('');
        };

        const handleYModemProgress = (data: {
            progress: number;
            bytesSent: number;
            totalBytes: number;
        }) => {
            setProgress(data.progress);
            setBytesSent(data.bytesSent);
            setFileSize(data.totalBytes);
        };

        const handleYModemComplete = (data: {
            filename: string;
            size: number;
            bytesSent: number;
        }) => {
            setTransferState('complete');
            setProgress(100);
            setBytesSent(data.bytesSent);
            setFileSize(data.size);
            setCurrentFile(data.filename);
            toast.success(`File "${data.filename}" transferred successfully!`);
            onComplete?.();
        };

        const handleYModemError = (data: { error: string }) => {
            setTransferState('error');
            setErrorMessage(data.error);
            toast.error(`Transfer failed: ${data.error}`);
        };

        const handleYModemCancelled = () => {
            setTransferState('cancelled');
            toast.info('Transfer cancelled');
            onCancel?.();
        };

        const handleYModemFileExists = (data: { filename: string }) => {
            setOverwriteFilename(data.filename);
            setShowOverwriteDialog(true);
        };

        const handleYModemStorageFull = () => {
            setTransferState('error');
            setErrorMessage('SD card storage is full');
            toast.error('SD card storage is full');
        };

        const handleYModemTimeout = () => {
            setTransferState('error');
            setErrorMessage('Transfer timeout');
            toast.error('Transfer timeout');
        };

        const handleYModemCrcError = () => {
            setTransferState('error');
            setErrorMessage('CRC error during transfer');
            toast.error('CRC error during transfer');
        };

        const handleYModemPacketError = (data: { packetNumber: number }) => {
            setTransferState('error');
            setErrorMessage(`Packet error at packet ${data.packetNumber}`);
            toast.error(`Packet error at packet ${data.packetNumber}`);
        };

        const handleYModemInvalidFilename = () => {
            setTransferState('error');
            setErrorMessage('Invalid filename');
            toast.error('Invalid filename');
        };

        const handleYModemUnsupportedType = () => {
            setTransferState('error');
            setErrorMessage('Unsupported file type');
            toast.error('Unsupported file type');
        };

        // Add event listeners
        controller.addListener('ymodem:ready', handleYModemReady);
        controller.addListener('ymodem:progress', handleYModemProgress);
        controller.addListener('ymodem:complete', handleYModemComplete);
        controller.addListener('ymodem:error', handleYModemError);
        controller.addListener('ymodem:cancelled', handleYModemCancelled);
        controller.addListener('ymodem:file_exists', handleYModemFileExists);
        controller.addListener('ymodem:storage_full', handleYModemStorageFull);
        controller.addListener('ymodem:timeout', handleYModemTimeout);
        controller.addListener('ymodem:crc_error', handleYModemCrcError);
        controller.addListener('ymodem:packet_error', handleYModemPacketError);
        controller.addListener(
            'ymodem:invalid_filename',
            handleYModemInvalidFilename,
        );
        controller.addListener(
            'ymodem:unsupported_type',
            handleYModemUnsupportedType,
        );

        // Cleanup function
        return () => {
            controller.removeListener('ymodem:ready', handleYModemReady);
            controller.removeListener('ymodem:progress', handleYModemProgress);
            controller.removeListener('ymodem:complete', handleYModemComplete);
            controller.removeListener('ymodem:error', handleYModemError);
            controller.removeListener(
                'ymodem:cancelled',
                handleYModemCancelled,
            );
            controller.removeListener(
                'ymodem:file_exists',
                handleYModemFileExists,
            );
            controller.removeListener(
                'ymodem:storage_full',
                handleYModemStorageFull,
            );
            controller.removeListener('ymodem:timeout', handleYModemTimeout);
            controller.removeListener('ymodem:crc_error', handleYModemCrcError);
            controller.removeListener(
                'ymodem:packet_error',
                handleYModemPacketError,
            );
            controller.removeListener(
                'ymodem:invalid_filename',
                handleYModemInvalidFilename,
            );
            controller.removeListener(
                'ymodem:unsupported_type',
                handleYModemUnsupportedType,
            );
        };
    }, [onComplete, onCancel]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCurrentFile(file.name);
            setFileSize(file.size);
            setBytesSent(0);
            setProgress(0);
            setTransferState('idle');
            setErrorMessage('');
        }
    };

    const handleStartTransfer = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        if (!isConnected || controllerType !== 'grblHAL') {
            toast.error('Must be connected to a GRBLHAL controller');
            return;
        }

        try {
            setTransferState('transferring');
            setProgress(0);
            setErrorMessage('');

            // Start YMODEM transfer
            controller.command('ymodem:start', file.path, file.name);
        } catch (error) {
            setTransferState('error');
            setErrorMessage(
                error instanceof Error ? error.message : 'Unknown error',
            );
            toast.error('Failed to start transfer');
        }
    };

    const handleCancelTransfer = () => {
        if (transferState === 'transferring') {
            controller.command('ymodem:cancel');
        }
        setTransferState('cancelled');
        onCancel?.();
    };

    const handleOverwriteConfirm = () => {
        controller.command('ymodem:overwrite');
        setShowOverwriteDialog(false);
    };

    const handleOverwriteCancel = () => {
        controller.command('ymodem:cancel');
        setShowOverwriteDialog(false);
        setTransferState('cancelled');
        onCancel?.();
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isGrblHal = controllerType === 'grblHAL';

    if (!isGrblHal) {
        return (
            <div className="flex flex-col gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800">
                    YMODEM Transfer
                </h3>
                <p className="text-yellow-700">
                    YMODEM file transfer is only available for GRBLHAL
                    controllers.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">
                YMODEM File Transfer
            </h3>

            {/* File Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                    Select File to Transfer
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gcode,.nc,.txt"
                    onChange={handleFileSelect}
                    disabled={transferState === 'transferring'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {currentFile && (
                    <div className="text-sm text-gray-600">
                        <p>File: {currentFile}</p>
                        <p>Size: {formatBytes(fileSize)}</p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {transferState === 'transferring' && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Transferring...</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500">
                        {formatBytes(bytesSent)} / {formatBytes(fileSize)}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {transferState === 'error' && errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            )}

            {/* Success Message */}
            {transferState === 'complete' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                        File transferred successfully!
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                {transferState === 'idle' && (
                    <Button
                        onClick={handleStartTransfer}
                        disabled={!currentFile || !isConnected}
                        className="flex-1"
                    >
                        Start Transfer
                    </Button>
                )}

                {transferState === 'transferring' && (
                    <Button
                        onClick={handleCancelTransfer}
                        variant="secondary"
                        className="flex-1"
                    >
                        Cancel Transfer
                    </Button>
                )}

                {(transferState === 'complete' ||
                    transferState === 'error' ||
                    transferState === 'cancelled') && (
                    <Button
                        onClick={() => {
                            setTransferState('idle');
                            setProgress(0);
                            setErrorMessage('');
                            setCurrentFile('');
                            setFileSize(0);
                            setBytesSent(0);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                        className="flex-1"
                    >
                        Transfer Another File
                    </Button>
                )}
            </div>

            {/* Overwrite Dialog */}
            {showOverwriteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <h4 className="text-lg font-semibold mb-4">
                            File Already Exists
                        </h4>
                        <p className="text-gray-600 mb-4">
                            The file "{overwriteFilename}" already exists on the
                            SD card. Do you want to overwrite it?
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleOverwriteConfirm}
                                variant="danger"
                                className="flex-1"
                            >
                                Overwrite
                            </Button>
                            <Button
                                onClick={handleOverwriteCancel}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YModemTransfer;
