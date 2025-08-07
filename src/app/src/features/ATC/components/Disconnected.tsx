export function Disconnected() {
    return (
        <div
            className={
                'flex w-full h-full items-center justify-center gap-4 flex-col px-10 text-center'
            }
        >
            <h1 className="text-2xl">ATC Unavailable</h1>
            <p className="text-gray-500 ">
                You must be connected to a device with ATC support to use this
                feature.
            </p>
        </div>
    );
}
