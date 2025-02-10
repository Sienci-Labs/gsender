import { FaWind } from 'react-icons/fa6';

export function EmptySectionWarning() {
    return (
        <div className="flex flex-col gap-4 w-full items-center justify-center my-2">
            <FaWind />
            <p className="text-gray-500 text-sm">
                Check your search filter or connect to your machine to see more
                options.
            </p>
        </div>
    );
}
