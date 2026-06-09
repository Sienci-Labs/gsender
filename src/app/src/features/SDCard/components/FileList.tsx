import React, { useRef, useState } from 'react';
import { Play, Trash2, File } from 'lucide-react';
import { useSDCard } from '../hooks/useSDCard';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';
import { Confirm } from 'app/components/ConfirmationDialog/ConfirmationDialogLib.ts';
import controller from 'app/lib/controller.ts';
import reduxStore from 'app/store/redux';
import { clearSDCardFiles } from 'app/store/redux/slices/controller.slice.ts';
import cn from 'classnames';
import { toast } from 'app/lib/toaster';
import { ACCEPTED_EXTENSIONS, validateSDFilename } from 'app/features/SDCard/components/UploadModal.tsx';
import store from 'app/store';

const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

function getUnusableReason(filename: string): string {
    return validateSDFilename(filename) ?? 'File flagged as unusable by firmware';
}

export function isFileATCIRelated(filename, atciMacros) {
    if (filename === 'ATCI.macro' || filename === 'P100.macro') {
        return true;
    }
    const filtered = Object.entries(atciMacros).filter(
        ([_, v]) => v['name'] === filename,
    );
    return filtered.length > 0;
}

export const FileList: React.FC = () => {
    const {
        files,
        isLoading,
        runSDFile,
        uploadFileToSDCard,
        isConnected,
        isRunningSDFile,
        firmwareType,
        hasFTP,
        hasYM,
        isWorkflowIdle
    } = useSDCard();
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ATCIFiles = store.get('widgets.atc.templates.macros', {});

    function handleDelete(fileName: string) {
        Confirm({
            title: 'Delete File',
            content: `Are you sure you want to delete ${fileName}?`,
            onConfirm: () => {
                controller.command('sdcard:delete', fileName);
                reduxStore.dispatch(clearSDCardFiles({ path: fileName }));
            },
        });
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const validFiles: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (!ACCEPTED_EXTENSIONS.includes(extension)) {
                errors.push(`${file.name}: Invalid file type`);
                return;
            }

            const validationError = validateSDFilename(file.name);
            if (validationError) {
                errors.push(`${file.name}: ${validationError}`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            toast.error(`Some files were rejected:\n${errors.join('\n')}`);
        }

        if (validFiles.length > 0) {
            handleUpload(validFiles);
        }
    };

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }

    const handleUpload = async (files: File | File[]) => {
        const fileArray = Array.isArray(files) ? files : [files];

        if (fileArray.length === 0) return;

        const fileDataPromises = fileArray.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result as string;
                    resolve({
                        name: file.name,
                        content: text,
                        size: text.length,
                    });
                };
                reader.readAsText(file);
            });
        });

        const filesData = await Promise.all(fileDataPromises);
        await uploadFileToSDCard(filesData);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isConnected) {
        return (
            <div className="border-gray-300 bg-white dark:bg-dark text-center py-12 text-gray-500 rounded-lg shadow-sm border">
                Must be connected to use SD card functionality.
            </div>
        );
    }

    if (firmwareType !== 'grblHAL') {
        return (
            <div className="border-gray-300 bg-white dark:bg-dark text-center py-12 text-gray-500 rounded-lg shadow-sm border">
                SD card tools are only available for grblHAL devices.
            </div>
        );
    }

    if (!hasFTP && !hasYM) {
        return (
            <div className="border-gray-300 bg-white dark:bg-dark text-center py-12 text-gray-500 rounded-lg shadow-sm border">
                Enable FTP or YMODEM in firmware to use SD card tools.
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div
                className={cn(
                    'flex-1 items-center justify-center flex flex-col overflow-auto text-center py-12 text-gray-500 dark:text-gray-300 rounded-lg shadow-sm border border-gray-200',
                    {
                        'border-blue-400 bg-blue-50': dragOver,
                        'border-gray-300 bg-white dark:bg-dark': !dragOver,
                    },
                )}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={(e) => {
                    handleDrop(e);
                }}
            >
                <File className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No files found</p>
                <p className="text-sm">
                    Upload files or refresh to see SD card contents
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gcode,.nc,.macro,.ncc,.ngc,.cnc,.txt,.text,.tap,.json"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <>
            <div
                className={cn(
                    'flex-1 overflow-auto rounded-lg shadow-sm border border-gray-200',
                    {
                        'border-blue-400 bg-blue-50': dragOver,
                        'border-gray-300 bg-white ': !dragOver,
                    },
                )}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={(e) => {
                    handleDrop(e);
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gcode,.nc,.macro,.ncc,.ngc,.cnc,.txt,.text,.tap,.json"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Files ({files.length})
                    </h2>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead></TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => {
                            const isATCI = isFileATCIRelated(
                                file.name,
                                ATCIFiles,
                            );

                            return (
                                <TableRow
                                    key={file.name}
                                    className={cn({
                                        'bg-[repeating-linear-gradient(45deg,rgb(254_252_232)_0,rgb(254_252_232)_10px,transparent_5px,transparent_20px)]':
                                            isATCI,
                                    })}
                                >
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-500">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {isATCI && (
                                            <span className="italic">
                                                ATC Macro
                                            </span>
                                        )}
                                        {file.unusable && (
                                            <span
                                                className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded"
                                                title={getUnusableReason(file.name)}
                                            >
                                                Unusable
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() =>
                                                    runSDFile(file.name)
                                                }
                                                disabled={isRunningSDFile || !isWorkflowIdle || isLoading || isATCI || file.unusable}
                                                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                <span>Run</span>
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(file.name)
                                                }
                                                disabled={isRunningSDFile || !isWorkflowIdle || isLoading}
                                                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};
