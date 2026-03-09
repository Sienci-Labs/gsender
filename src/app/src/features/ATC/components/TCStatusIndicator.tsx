import {useEffect, useState} from "react";
import cn from 'classnames';
import { TiWarning } from "react-icons/ti";
import { FaCheckCircle } from "react-icons/fa";

export enum TCStatus {
    NO_OFFSET,
    OFF_RACK,
    READY,
    EMPTY
}

function getStatusString(status: TCStatus) {
    switch (status) {
        case TCStatus.NO_OFFSET:
            return 'Offset not found';
        case TCStatus.OFF_RACK:
            return 'Off Rack';
        case TCStatus.READY:
            return 'Ready';
        case TCStatus.EMPTY:
            return 'Empty';
    }
}

function getStatusDescription(status: TCStatus) {
    switch (status) {
        case TCStatus.NO_OFFSET:
            return 'Make sure the tool is in the rack before proceeding.';
        case TCStatus.OFF_RACK:
            return 'Off Rack tool selected.';
        case TCStatus.READY:
            return 'Tool is ready to be loaded.';
            case TCStatus.EMPTY:
                return 'Tool is empty.';
    }
}

function getStatusIcon(status: TCStatus) {
    switch (status) {
        case TCStatus.READY:
            return <FaCheckCircle />
        default:
            return <TiWarning />;
    }
}

export function TCStatusIndicator({ id, xOffset = 0, zOffset}) {
    const [status, setStatus] = useState<TCStatus>(TCStatus.READY);
    const [selectedId, setSelectedId] = useState(0);

    useEffect(() => {
        if (xOffset === 0) {
            setStatus(TCStatus.NO_OFFSET);
        }
    }, [
        xOffset, zOffset, id
    ])
    return (
        <div className={cn("flex flex-col h-full px-1 py-2 justify-between border shadow-inner rounded-lg items-center bg-opacity-30", {
            "border-yellow-500 bg-yellow-100 text-yellow-500": (status === TCStatus.NO_OFFSET || status === TCStatus.OFF_RACK),
            "border-green-500 bg-green-100 text-green-500": status === TCStatus.READY,
            "border-gray-500 bg-gray-100-100 text-gray-600-500": status === TCStatus.EMPTY,
        })}>
            <div className="font-bold flex flex-col items-center">
                <span className="text-lg">{getStatusIcon(status)}</span>
                <span>{getStatusString(status)}</span></div>
            <div className="text-center text-sm">{getStatusDescription(status)}</div>
        </div>
    );
}
