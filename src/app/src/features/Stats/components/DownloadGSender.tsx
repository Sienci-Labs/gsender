import { Button } from 'app/components/Button';
import { FaDownload } from 'react-icons/fa';

export function DownloadGSender({ version = '1.5.0' }) {
    return (
        <div
            className="p-4 mb-4 text-blue-800 border border-blue-500 rounded-lg bg-blue-50 bg-opacity-50 w-1/2 mx-auto text-center "
            role="alert"
        >
            <div className="flex items-center justify-center">
                <svg
                    className="shrink-0 w-4 h-4 me-2"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="sr-only">Info</span>
                <h3 className="text-lg font-medium">
                    gSender v{version} available to download!
                </h3>
            </div>
            <div className="mt-2 mb-4 text-sm">
                <p>
                    Clicking the below button will update gSender to version{' '}
                    {version}.
                </p>{' '}
                <p>
                    It is recommended you backup your EEPROM values and settings
                    before updating.
                </p>
            </div>
            <div className="flex items-center justify-center">
                <Button type="button" variant="primary" className="gap-2">
                    <FaDownload />
                    <span>Update to v{version} now!</span>
                </Button>
            </div>
        </div>
    );
}
