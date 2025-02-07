import { StatContext } from 'app/features/Stats/utils/StatContext.tsx';
import { useContext } from 'react';
import { JobPreview } from 'app/features/Stats/components/JobPreview.tsx';

export function JobPreviewList() {
    const { jobs } = useContext(StatContext);
    const jobShortlist = jobs.slice(0, 5);
    return (
        <div className="flex flex-col gap-4">
            {jobShortlist.map((job) => (
                <JobPreview {...job} />
            ))}
        </div>
    );
}
