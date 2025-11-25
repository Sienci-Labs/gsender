import { ATCUnavailablePayload } from 'app/features/ATC/definitions';

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
                <p className="text-gray-500 text-sm">ATC Unavailable</p>
                <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <p className="">{message}</p>

            {additionalInfo && (
                <p className="text-gray-500 text-sm">{additionalInfo}</p>
            )}
        </div>
    );
}
