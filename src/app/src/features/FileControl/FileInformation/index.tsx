import { useState } from 'react';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import Switch from 'app/components/Switch';

import Size from './Size';
import Info from './Info';
import LoadingAnimation from './LoadingAnimation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'app/components/shadcn/Tooltip';

const FileInformation = () => {
    const { name, size, total, path, fileLoaded, fileProcessing } =
        useTypedSelector((state) => state.file);

    const [toggleInfo, setToggleInfo] = useState(false);

    if (fileProcessing) {
        return <LoadingAnimation />;
    }

    if (!fileLoaded) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center h-full">
                <h2 className="text-lg font-bold">No file loaded</h2>
            </div>
        );
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
    console.log(name);

    let cutName = '';
    let extension;
    if (name && name.length > 0) {
        cutName = name.substring(0, name.indexOf('.') - 3);
        extension = name.slice(name.indexOf('.') - 3);
    }

    return (
        <div className="flex flex-col gap-1 justify-center p-3 items-center h-full self-center text-sm max-w-full">
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

            <div className="text-gray-500 flex gap-1 text-sm">
                <span>{fileSize}</span>

                <span>({total} lines)</span>
            </div>

            {/*path && (
                <div className="text-gray-500 text-sm">
                    <span>Path</span>
                    <span>{path}</span>
                </div>
            )*/}

            <div className="flex gap-2 min-w-64 self-center justify-center items-center">
                <div className="flex flex-col items-center mr-1">
                    <span className="text-gray-500">Info</span>
                    <Switch
                        checked={toggleInfo}
                        onChange={() => setToggleInfo((prev) => !prev)}
                        position="vertical"
                    />
                    <span className="text-gray-500">Size</span>
                </div>

                <div className="w-full h-[115px] overflow-auto">
                    <ToggleOutput />
                </div>
            </div>
        </div>
    );
};

export default FileInformation;
