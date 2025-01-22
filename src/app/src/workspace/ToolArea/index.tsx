import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';
import Tools from 'app/features/Tools';

export const ToolArea = () => {
    return (
        <div className="grid grid-cols-3 gap-2 box-border w-full">
            <div className="w-full p-1 box-border">
                <FileControl />
            </div>
            <div className="w-full p-1 box-border">
                <JobControl />
            </div>
            <div className="w-full p-1 box-border">
                <Tools />
            </div>
        </div>
    );
};
