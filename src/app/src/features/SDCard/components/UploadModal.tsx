import React, { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { useSDCard } from "../hooks/useSDCard";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "app/components/shadcn/Dialog";
import { toast } from "app/lib/toaster";

interface UploadModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// Mirrors the firmware's filename_valid() check from the SD card plugin.
// Returns null if valid, or an error string describing the problem.
export function validateSDFilename(filename: string): string | null {
	if (filename.length > 40) return "Filename too long (max 40 characters)";
	if (filename.includes("?")) return "Filename contains invalid character: ?";
	if (filename.includes("~")) return "Filename contains invalid character: ~";
	if (filename.includes("!")) return "Filename contains invalid character: !";
	return null;
}

// List files on the card recursively. Only CNC related filetypes are listed: .nc, .ncc, .ngc, .cnc, .gcode, .txt, .text, .tap and .macro.
export const ACCEPTED_EXTENSIONS = [
	".gcode",
	".nc",
	".ncc",
	".ngc",
	".cnc",
	".txt",
	".text",
	".tap",
	".macro",
	".json",
];

export const UploadModal: React.FC<UploadModalProps> = ({
	isOpen,
	onClose,
}) => {
	const { uploadFileToSDCard, isLoading } = useSDCard();
	const [dragOver, setDragOver] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const validFiles: File[] = [];
		const errors: string[] = [];

		Array.from(files).forEach((file) => {
			const extension = "." + file.name.split(".").pop()?.toLowerCase();

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
			toast.error(`Some files were rejected:\n${errors.join("\n")}`);
		}

		setSelectedFiles((prev) => [...prev, ...validFiles]);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		handleFileSelect(e.dataTransfer.files);
	};

	const handleUpload = async () => {
		if (selectedFiles.length > 0) {
			const fileDataPromises = selectedFiles.map((file) => {
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
			setSelectedFiles([]);
			onClose();
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setSelectedFiles([]);
			onClose();
		}
	};

	const formatFileSize = (size: number): string => {
		if (size < 1024) {
			return `${size} B`;
		}

		if (size < 1024 * 1024) {
			return `${(size / 1024).toFixed(1)} KB`;
		}

		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload Files</DialogTitle>
					<DialogDescription>
						Upload one or more valid gcode files to your SD card
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 my-2">
					<div
						className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
							dragOver
								? "border-blue-400 bg-blue-50"
								: "border-gray-300 hover:border-gray-400"
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
							Drag & drop files here, or{" "}
							<button
								onClick={() => fileInputRef.current?.click()}
								className="text-blue-500 hover:text-blue-600 font-medium"
							>
								browse
							</button>
						</p>
						<p className="text-xs text-gray-500">
							Accepts: .gcode, .nc, .macro and other supported files
						</p>
					</div>

					<input
						ref={fileInputRef}
						type="file"
						accept=".gcode,.nc,.macro,.ncc,.ngc,.cnc,.txt,.text,.tap,.json"
						multiple
						onChange={(e) => handleFileSelect(e.target.files)}
						className="hidden"
					/>

					{selectedFiles.length > 0 && (
						<div>
							<h3 className="text-sm font-medium text-gray-700 mb-2">
								Selected Files ({selectedFiles.length}):
							</h3>
							<div className="space-y-2 max-h-60 overflow-y-auto">
								{selectedFiles.map((file, index) => (
									<div
										key={`${file.name}-${index}`}
										className="flex items-center space-x-2 text-sm text-gray-600 p-2 bg-gray-50 rounded hover:bg-gray-100"
									>
										<File className="w-4 h-4 flex-shrink-0" />
										<span className="truncate flex-1">{file.name}</span>
										<span className="text-xs text-gray-500 flex-shrink-0">
											{formatFileSize(file.size)}
										</span>
										<button
											onClick={() => removeFile(index)}
											className="p-1 hover:bg-gray-200 rounded transition-colors"
											title="Remove file"
										>
											<X className="w-4 h-4 text-gray-500" />
										</button>
									</div>
								))}
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
						disabled={selectedFiles.length === 0 || isLoading}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						{isLoading
							? "Uploading..."
							: `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
