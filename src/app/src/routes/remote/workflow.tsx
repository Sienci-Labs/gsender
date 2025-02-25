import { createFileRoute } from '@tanstack/react-router';
import FileControl from 'app/features/FileControl';
import JobControl from 'app/features/JobControl';

export const Route = createFileRoute('/remote/workflow')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex flex-col gap-32 mt-6">
            <FileControl />
            <JobControl />
        </div>
    );
}
