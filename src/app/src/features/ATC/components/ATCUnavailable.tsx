export function ATCUnavailable() {
    return (
        <div
            className={
                'flex w-full h-full items-center justify-center gap-4 flex-col px-10 text-center'
            }
        >
            <h1 className="text-2xl">ATC Unavailable</h1>
            <p className="">
                Firmware did not report <b>ATC=1</b> on startup.
            </p>
            <p className="text-gray-500">
                Ensure the SD card is installed and mounted correct and the
                firmware has ATC support compiled in.
            </p>
        </div>
    );
}
