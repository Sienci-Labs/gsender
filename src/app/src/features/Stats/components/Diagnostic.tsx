import generateSupportFile from 'app/lib/diagnostics.tsx';

export function Diagnostic() {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-gray-600 text-sm dark:text-white">
                Share this file with our customer support or community so others
                can help you better. It contains your machine errors, profile,
                settings, and more.
            </p>
            {generateSupportFile()}
        </div>
    );
}
