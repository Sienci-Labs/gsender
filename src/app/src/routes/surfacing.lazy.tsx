import { createLazyFileRoute, Link } from '@tanstack/react-router';
// import { UpdateAlert } from 'app/components/UpdateAlert';
import Surfacing from 'app/features/Surfacing';

export const Route = createLazyFileRoute('/surfacing')({
    component: SurfacingPage,
});

function SurfacingPage() {
    return (
        <div className="p-4 text-lg font-bold">
            <Link
                to="/tools"
                className="text-blue-500 border border-blue-500 rounded-md p-2"
            >
                ← Back to Tools
            </Link>

            {/* <div className="mt-4 flex justify-center">
                <UpdateAlert />
            </div> */}
            <Surfacing />
        </div>
    );
}
