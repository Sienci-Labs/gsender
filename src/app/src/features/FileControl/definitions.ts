// Interfaces

export interface JobStatus {
    minimized: boolean;
    speed: string;
    lastFile: string;
    lastFileSize: string;
    lastFileRunLength: string;
}

export interface RecentFile {
    fileSize: number;
    filePath: string,
    fileName: string,
    timeUploaded: number
}
