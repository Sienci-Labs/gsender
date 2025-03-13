import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'app/components/shadcn/Select.tsx';
import { Button } from 'app/components/Button';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import { toast } from 'app/lib/toaster';
import controller from 'app/lib/controller.ts';

interface flashDialogProps {
    show: boolean;
    toggleShow: (b) => void;
}

enum FlashingState {
    Idle,
    Flashing,
    Complete,
    Error,
}

function getProfileType() {}

function startFlash({ port, hex = null, controllerType = 'grbl' }) {
    if (!port) {
        toast.error(
            'No port specified - please connect to the device to determine what is being flashed.',
        );
    }

    const isHal = controllerType === 'grblHAL';

    controller.flashFirmware(port, '', isHal, hex);
}

const CONTROLLER_TYPES = ['grbl', 'grblHAL'];

export function FlashDialog({ show, toggleShow }: flashDialogProps) {
    const [controllerType, setControllerType] = useState('');
    const [port, setPort] = useState('');
    const [ports, setPorts] = useState([]);

    const portList = useSelector((state: RootState) => state.connection.ports);

    // get Port list, set port, get connection type (if exists)
    useEffect(() => {
        setPorts(portList);
        setPort[portList[0].port];
    }, [portList]);

    function handlePortSelect(value) {
        setPort(value);
    }

    function handleTypeSelect(value) {
        setControllerType(value);
    }

    function startFlash() {}

    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col justify-center items-center">
                <DialogHeader>
                    <DialogTitle>Flash Firmware</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-700">
                        This feature exists to flash firmware onto a compatible
                        SLB or Arduino-based device.
                    </p>
                    <div className="flex flex-col">
                        <h2 className="text-gray-600 text-sm">Port</h2>
                        <Select onValueChange={handlePortSelect} value={port}>
                            <SelectTrigger className="bg-white bg-opacity-100">
                                <SelectValue placeholder={port} />
                            </SelectTrigger>
                            <SelectContent className="bg-white bg-opacity-100">
                                {ports.map((p) => (
                                    <SelectItem key={p.port} value={p.port}>
                                        {p.port}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-gray-600 text-sm">
                            Controller Type
                        </h2>
                        <Select
                            onValueChange={handleTypeSelect}
                            value={controllerType}
                        >
                            <SelectTrigger className="bg-white bg-opacity-100">
                                <SelectValue placeholder={''} />
                            </SelectTrigger>
                            <SelectContent className="bg-white bg-opacity-100">
                                {CONTROLLER_TYPES.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div></div>
                    <div className="bg-yellow-100 bg-opacity-60 border border-t border-b border-b-yellow-500 border-t-yellow-500 mt-8 p-4 flex flex-col gap-2">
                        <p className="text-sm text-gray-600 text-center">
                            This process will disconnect your machine, and may
                            take a couple of minutes to complete.
                            <br />
                            <b>Continue?</b>
                        </p>
                        <div className="flex flex-row gap-4 items-center justify-center">
                            <Button>No</Button>
                            <Button variant="primary">Yes</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
