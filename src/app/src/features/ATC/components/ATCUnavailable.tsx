import type { ATCUnavailablePayload } from 'app/features/ATC/definitions';

export function ATCUnavailable({
    payload,
}: {
    payload: ATCUnavailablePayload;
}) {
    const { title, message, additionalInfo } = payload;

    return (
        <div
            className={
                'flex w-full h-full items-center justify-center gap-3 flex-col px-10 text-center'
            }
        >
            <div>
                <p className="text-gray-500 dark:text-content-muted text-sm">
                    ATC Unavailable
                </p>
                <h1 className="text-xl font-bold dark:text-content-primary">
                    {title}
                </h1>
            </div>
            <p className="dark:text-content-secondary">{message}</p>

            {additionalInfo && (
                <p className="text-gray-500 dark:text-content-muted text-sm">
                    {additionalInfo}
                </p>
            )}
        </div>
    );
}
