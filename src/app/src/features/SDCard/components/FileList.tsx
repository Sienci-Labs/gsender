import React, { useState } from 'react';
import { Play, Trash2, File } from 'lucide-react';
import { useSDCard } from '../hooks/useSDCard';
//import { ConfirmDialog } from './ConfirmDialog';
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

export const FileList: React.FC = () => {
    const { files, isLoading, runSDFile, deleteSDFile } = useSDCard();

    if (files.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <File className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No files found</p>
                <p className="text-sm">
                    Upload files or refresh to see SD card contents
                </p>
            </div>
        );
    }

    function handleDelete(fileName: string) {
        Confirm({
            title: 'Delete File',
            content: `Are you sure you want to delete ${fileName}?`,
            onConfirm: () => {
                controller.command('sdcard:delete', fileName);
            },
        });
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow key={file.name}>
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
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => runSDFile(file.name)}
                                            disabled={isLoading}
                                            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            <span>Run</span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(file.name)
                                            }
                                            disabled={isLoading}
                                            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
};
