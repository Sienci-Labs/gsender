import React, { useState, useRef } from 'react';
import { Upload, File } from 'lucide-react';
import { useSDCard } from '../hooks/useSDCard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import blob from 'axios/unsafe/platform/browser/classes/Blob';
import { toast } from 'app/lib/toaster';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface FileUpload {
    name: string;
    size: number;
    data: blob;
}

// List files on the card recursively. Only CNC related filetypes are listed: .nc, .ncc, .ngc, .cnc, .gcode, .txt, .text, .tap and .macro.
export const ACCEPTED_EXTENSIONS = [
    '.gcode',
    '.nc',
    '.ncc',
    '.ngc',
    '.cnc',
    '.txt',
    '.text',
    '.tap',
    '.macro',
];

export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { uploadFileToSDCard, isLoading } = useSDCard();
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0]; // Only take the first file
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (ACCEPTED_EXTENSIONS.includes(extension)) {
            setSelectedFile(file);
        } else {
            toast.error('Please select a valid gcode file');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;

                await uploadFileToSDCard({
                    name: selectedFile.name,
                    size: selectedFile.size,
                    data: new Blob([text], { type: 'text/plain' }),
                });
            };
            reader.readAsText(selectedFile);
            //await uploadFileToSDCard(dt.files);
            setSelectedFile(null);
            onClose();
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedFile(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>
                        Upload a valid gcode file to your SD card
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                            dragOver
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">
                            Drag & drop a file here, or{' '}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-xs text-gray-500">
                            Accepts: .gcode, .nc, .macro file
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".gcode,.nc,.macro"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                    />

                    {selectedFile && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Selected File:
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
                                <File className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate flex-1">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? 'Uploading...' : 'Upload'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
