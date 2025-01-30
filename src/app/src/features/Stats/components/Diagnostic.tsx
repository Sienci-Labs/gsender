import ToolModalButton from 'app/components/ToolModalButton';

export function Diagnostic() {
    return (
        <div className="flex flex-col gap-4">
            <p className="text-gray-600 text-sm">
                Share this file with our customer support or community so others
                can help you better. It contains your machine errors, profile,
                settings, and more.
            </p>
            <ToolModalButton>Download Diagnostic File</ToolModalButton>
        </div>
    );
}
