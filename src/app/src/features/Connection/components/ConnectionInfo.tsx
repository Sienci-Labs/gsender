import { FirmwareFlavour } from 'app/features/Connection';

interface ConnectionInfoProps {
    firmwareType: FirmwareFlavour;
    port: string;
}

export function ConnectionInfo(props: ConnectionInfoProps) {
    return (
        <div className="flex flex-col gap-1 font-normal justify-end text-right">
            <div className="font-bold text-gray-900">{props.port}</div>
            <div className="text-sm text-gray-600">{props.firmwareType}</div>
        </div>
    );
}