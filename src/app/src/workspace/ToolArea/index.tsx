import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';
import Tools from 'app/features/Tools';

export const ToolArea = () => {
    return (
        <div className="flex-1 flex gap-2 box-border">
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
