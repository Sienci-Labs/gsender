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

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACCEPTED_EXTENSIONS = ['.gcode', '.nc', '.macro'];

export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { uploadFileToSDCard, isLoading } = useSDCard();
    const [dragOver, setDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const validFiles = Array.from(files).filter((file) => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            return ACCEPTED_EXTENSIONS.includes(extension);
        });

        if (validFiles.length > 0) {
            const dt = new DataTransfer();
            validFiles.forEach((file) => dt.items.add(file));
            setSelectedFiles(dt.files);
        } else {
            alert('Please select only .gcode, .nc, or .macro files');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFiles) {
            await uploadFileToSDCard(selectedFiles);
            setSelectedFiles(null);
            onClose();
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedFiles(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>
                        Upload .gcode, .nc, or .macro files to your SD card
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
                            Drag & drop files here, or{' '}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-xs text-gray-500">
                            Accepts: .gcode, .nc, .macro files
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".gcode,.nc,.macro"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                    />

                    {selectedFiles && selectedFiles.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Selected Files ({selectedFiles.length}):
                            </h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {Array.from(selectedFiles).map(
                                    (file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-gray-50 rounded"
                                        >
                                            <File className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate flex-1">
                                                {file.name}
                                            </span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                ({(file.size / 1024).toFixed(1)}{' '}
                                                KB)
                                            </span>
                                        </div>
                                    ),
                                )}
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
                        disabled={
                            !selectedFiles ||
                            selectedFiles.length === 0 ||
                            isLoading
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? 'Uploading...' : 'Upload'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
