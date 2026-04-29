import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { JobPreview } from 'app/features/Stats/components/JobPreview.tsx';
import { FaRegListAlt } from 'react-icons/fa';

export function EmptyJobList() {
    return (
        <div className="flex flex-col gap-2 items-center justify-center text-gray-700 dark:text-white h-full">
            <span className="text-6xl">
                <FaRegListAlt />
            </span>
            <span>No Jobs recorded. Get carving!</span>
        </div>
    );
}

export function JobPreviewList() {
    const { jobs = [] } = useContext(StatContext);
    const jobShortlist = jobs.slice(0, 5);

    if (jobs.length === 0) {
        return <EmptyJobList />;
    }

    return (
        <div className="flex flex-col gap-4">
            {jobShortlist.map((job, index) => (
                <JobPreview {...job} key={index} />
            ))}
        </div>
    );
}
