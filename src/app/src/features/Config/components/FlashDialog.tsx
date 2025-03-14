import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import React, { useEffect, useRef, useState } from 'react';
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
import store from 'app/store';
import get from 'lodash/get';

import cn from 'classnames';
import { FlashingProgress } from 'app/features/Config/components/FlashingProgress.tsx';

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

interface startFlashOptions {
    port: string;
    hex: string;
    controllerType: string;
}

const SLB_DFU_PORT = {
    port: 'SLB_DFU',
    manufacturer: '',
    inuse: false,
};

function startFlash({
    port,
    hex = null,
    controllerType = '',
}: startFlashOptions) {
    if (!port) {
        toast.error(
            'No port specified - please connect to the device to determine what is being flashed.',
        );
    }

    const selectedProfile = store.get('workspace.machineProfile', {});
    const machineVersion = get(selectedProfile, 'version', 'MK1');
    const isHal = controllerType === 'grblHAL';

    controller.flashFirmware(port, machineVersion, isHal, hex);
}

const CONTROLLER_TYPES = ['grbl', 'grblHAL'];

export function FlashDialog({ show, toggleShow }: flashDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [controllerType, setControllerType] = useState('');
    const [port, setPort] = useState('');
    const [ports, setPorts] = useState([]);
    const [file, setFile] = useState('');
    const [hex, setHex] = useState(new ArrayBuffer(1));
    const [flashState, setFlashState] = useState<FlashingState>(
        FlashingState.Idle,
    );

    const portList = useSelector((state: RootState) => state.connection.ports);

    function flashPort() {
        setFlashState(FlashingState.Flashing);

        startFlash({
            port,
            hex,
            controllerType,
        });
    }

    // get Port list, set port, get connection type (if exists)
    useEffect(() => {
        setPorts([...portList, SLB_DFU_PORT]);
    }, [portList]);

    // On show, refresh ports
    useEffect(() => {
        controller.listPorts();
        setFlashState(FlashingState.Idle);
    }, [show]);

    useEffect(() => {
        controller.addListener('flash:end', () => {
            setFlashState(FlashingState.Complete);
        });
        controller.addListener('task:error', () => {
            setFlashState(FlashingState.Error);
        });

        return () => {
            controller.removeListener('flash:end');
            controller.removeListener('task:error');
        };
    }, []);

    // File Reader on file change
    useEffect(() => {
        let fileReader,
            isCancel = false;
        if (file) {
            fileReader = new FileReader();
            fileReader.onload = (e) => {
                const { result } = e.target;
                if (result && !isCancel) {
                    setHex(result);
                }
            };
            fileReader.readAsText(file);
        }
        return () => {
            isCancel = true;
            if (fileReader && fileReader.readyState === 1) {
                fileReader.abort();
            }
        };
    }, [file]);

    function handlePortSelect(value) {
        setPort(value);
    }

    function handleTypeSelect(value) {
        setControllerType(value);
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            console.error('No file found');
            return;
        }
        setFile(file);
    }

    return (
        <Dialog open={show} onOpenChange={toggleShow}>
            <DialogContent className="bg-gray-100 w-[650px] min-h-[450px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Flash Firmware</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-700">
                        This feature exists to flash firmware onto a compatible
                        SLB or Arduino-based device.
                    </p>
                    <div
                        className={cn('flex flex-col gap-4', {
                            hidden: flashState !== FlashingState.Idle,
                        })}
                    >
                        <div className="flex flex-col">
                            <h2 className="text-gray-600 text-sm">Port</h2>
                            <Select
                                onValueChange={handlePortSelect}
                                value={port}
                            >
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
                                    <SelectValue placeholder={'grblHAL'} />
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
                        <div
                            className={cn('flex flex-col', {
                                invisible: controllerType === 'grbl',
                            })}
                        >
                            <h2 className="text-gray-600 text-sm">Hex File</h2>
                            <input
                                type="file"
                                id="firmware_image"
                                accept=".hex"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                    <div
                        className={cn(
                            'bg-yellow-100 bg-opacity-60 border border-t border-b border-b-yellow-500 border-t-yellow-500 mt-8 p-4 flex flex-col gap-2',
                            {
                                hidden: flashState !== FlashingState.Idle,
                            },
                        )}
                    >
                        <p className="text-sm text-gray-600 text-center">
                            This process will disconnect your machine, and may
                            take a couple of minutes to complete.
                            <br />
                            <b>Continue?</b>
                        </p>
                        <div className="flex flex-row gap-4 items-center justify-center">
                            <Button onClick={toggleShow}>No</Button>
                            <Button variant="primary" onClick={flashPort}>
                                Yes
                            </Button>
                        </div>
                    </div>
                    <div
                        className={cn(
                            { hidden: flashState === FlashingState.Idle },
                            {
                                'flex flex-col visible expand':
                                    flashState === FlashingState.Flashing,
                            },
                        )}
                    >
                        <FlashingProgress type={controllerType} />
                    </div>
                    <div
                        className={cn('flex items-center justify-center', {
                            hidden: flashState !== FlashingState.Complete,
                        })}
                    >
                        <Button variant="primary" onClick={toggleShow}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
