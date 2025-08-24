import { useEffect, useState } from 'react';
import pubsub from 'pubsub-js';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { Switch } from 'app/components/shadcn/Switch';

import Size from './Size';
import Info from './Info';
import LoadingAnimation from './LoadingAnimation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';
import { getRecentFiles } from '../utils/recentfiles';
import { RecentFile } from '../definitions';
import { Job } from 'app/features/Stats/utils/StatContext';
import { MdInfoOutline } from 'react-icons/md';
import { LuFileCode2 } from 'react-icons/lu';
import { FiClock } from 'react-icons/fi';
import cx from 'classnames';
import { JOB_STATUS } from 'app/constants';
import { convertMillisecondsToTimeStamp } from 'app/lib/datetime';
import api from 'app/api';
import isElectron from 'is-electron';
import { ScrollArea } from 'app/components/shadcn/ScrollArea';
import { LiaFileUploadSolid } from 'react-icons/lia';

interface Props {
    handleRecentFileUpload: (file: RecentFile, isRecentFile?: boolean) => void;
}

const FileInformation: React.FC<Props> = ({ handleRecentFileUpload }) => {
    const { name, size, total, path, fileLoaded, fileProcessing } =
        useTypedSelector((state) => state.file);

    const [toggleInfo, setToggleInfo] = useState(false);
    const [recentFiles, setRecentFiles] =
        useState<RecentFile[]>(getRecentFiles());
    const [lastJob, setLastJob] = useState<Job>(null);

    const fetchJobs = async () => {
        const jobStatRes = await api.jobStats.fetch();
        const { jobs = [] } = jobStatRes.data;
        setLastJob(jobs[jobs.length - 1]);
    };

    useEffect(() => {
        setRecentFiles(getRecentFiles());
        fetchJobs();

        const tokens = [
            pubsub.subscribe(
                'recent-files-updated',
                (_: string, files: RecentFile[]) => {
                    setRecentFiles(files.slice());
                },
            ),
            pubsub.subscribe('lastJob', (_: string, job: Job) => {
                setLastJob(job);
            }),
        ];
        return () => {
            tokens.forEach((token) => {
                pubsub.unsubscribe(token);
            });
        };
    }, []);

    if (fileProcessing) {
        return <LoadingAnimation />;
    }

    if (!fileLoaded) {
        return (
            <div
                className={cx('mt-3 h-full', {
                    'grid grid-cols-[3fr_2fr] gap-8': isElectron(),
                    'flex justify-center': !isElectron(),
                })}
            >
                {isElectron() && (
                    <div className="flex flex-col gap-2 max-xl:gap-1">
                        <span className="ml-6 dark:text-white">
                            Recent Files
                        </span>
                        <ScrollArea className="ml-2 px-2 h-28 bg-white dark:bg-dark rounded-xl border-2 dark:border-dark-lighter">
                            <div className="grid divide-y items-center mr-2">
                                {recentFiles.map(
                                    (file, index) =>
                                        index < 8 && (
                                            <div
                                                className="grid grid-cols-[30px_3fr] items-center gap-1 cursor-pointer py-2"
                                                onClick={() =>
                                                    handleRecentFileUpload(
                                                        {
                                                            fileName:
                                                                file.fileName,
                                                            fileSize:
                                                                file.fileSize,
                                                            filePath:
                                                                file.filePath,
                                                            timeUploaded:
                                                                file.timeUploaded,
                                                        },
                                                        true,
                                                    )
                                                }
                                            >
                                                <div className="text-2xl float-right rounded-r dark:text-white">
                                                    <LiaFileUploadSolid />
                                                </div>
                                                <div className="grid items-start">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="block text-ellipsis text-nowrap overflow-hidden whitespace-nowrap dark:text-white">
                                                                    {
                                                                        file.fileName
                                                                    }
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {file.fileName}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        ),
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
                <div
                    className={cx(
                        'flex flex-col gap-4 text-sm justify-between',
                        {
                            'max-w-60': !isElectron(),
                        },
                    )}
                >
                    {lastJob && (
                        <>
                            <span className="text-base text-gray-900 dark:text-gray-300">
                                Last Job
                            </span>
                            <div className="grid grid-rows-3 gap-4 max-xl:gap-2 -ml-[2px] text-gray-500 font-bold">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="grid grid-cols-[20px_5fr] items-start gap-2">
                                                <LuFileCode2 className="text-lg" />
                                                <div className="block text-ellipsis text-nowrap overflow-hidden whitespace-nowrap">
                                                    <span className="font-bold">
                                                        {lastJob.file}
                                                    </span>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {lastJob.file}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <div className="flex flex-row gap-2">
                                    <MdInfoOutline className="text-xl -ml-[1px]" />
                                    <span
                                        className={cx({
                                            'text-green-500':
                                                lastJob.jobStatus ===
                                                JOB_STATUS.COMPLETE,
                                            'text-red-500':
                                                lastJob.jobStatus ===
                                                JOB_STATUS.STOPPED,
                                        })}
                                    >
                                        {lastJob.jobStatus}
                                    </span>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <FiClock className="text-lg" />
                                    <span>
                                        {convertMillisecondsToTimeStamp(
                                            lastJob.duration,
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="h-1/2"></div>
                        </>
                    )}
                </div>
            </div>
        );
        // <div className="flex flex-col gap-2 justify-center items-center h-full">
        //     <h2 className="text-lg font-bold">No file loaded</h2>
        // </div>
    }

    const formatFileSize = (size: number): string => {
        if (size < 1024) {
            return `${size} Bytes`;
        }

        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(0)} KB`;
        }

        return `${(size / (1024 * 1024)).toFixed(0)} MB`;
    };

    const fileSize = formatFileSize(size);
    const ToggleOutput = toggleInfo ? Info : Size;

    let cutName = '';
    let extension = '';
    if (name && name.length > 0) {
        if (name.indexOf('.') > 0) {
            cutName = name.substring(0, name.indexOf('.') - 3);
            extension = name.slice(name.indexOf('.') - 3);
        } else {
            cutName = name;
            extension = '';
        }
    }

    return (
        <div className="flex flex-col mt-2 justify-center items-start self-center text-sm max-w-full text-gray-900 dark:text-gray-300">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="max-w-full flex flex-row">
                            <h2 className="inline-block text-lg font-bold text-ellipsis overflow-hidden whitespace-nowrap">
                                {cutName}
                            </h2>
                            <h2 className="inline-block text-lg font-bold">
                                {extension}
                            </h2>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{name}</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="text-gray-500 flex gap-1 text-xs">
                <span>{fileSize}</span>

                <span>({total} lines)</span>
            </div>

            {path && (
                <div className="text-gray-500 text-xs max-w-full flex flex-row">
                    <span className="inline-block text-ellipsis overflow-hidden whitespace-nowrap">
                        {path}
                    </span>
                </div>
            )}

            <div className="flex gap-2 min-w-64 self-center justify-center items-start">
                <div className="flex flex-col items-center mr-1">
                    <span className="text-gray-500">Info</span>
                    <Switch
                        checked={toggleInfo}
                        onChange={() => setToggleInfo((prev) => !prev)}
                        position="vertical"
                    />
                    <span className="text-gray-500">Size</span>
                </div>

                <div className="w-full overflow-auto self-center">
                    <ToggleOutput />
                </div>
            </div>
        </div>
    );
};

export default FileInformation;
