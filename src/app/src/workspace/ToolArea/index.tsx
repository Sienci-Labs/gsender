import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';
import Tools from 'app/features/Tools';

export const ToolArea = () => {
    return (
        <div className="grid grid-cols-3 portrait:grid-cols-1 gap-2 box-border w-full h-full portrait:gap-6 portrait:grid-rows-3">
            <div className="w-full p-1 box-border order-1 portrait:order-2">
                <FileControl />
            </div>
            <div className="w-full p-1 box-border order-2 portrait:order-1">
                <JobControl />
            </div>
            <div className="w-full p-1 box-border order-3 portrait:order-3">
                <Tools />
            </div>
        </div>
    );
};
