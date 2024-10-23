import { useState } from 'react';
import icon from './assets/icon.svg';
import triangle from './assets/triangle.svg';
import cx from 'classnames';
import { Card, CardContent, CardDescription } from 'app/components/shadcn/Card';
import PinRow from './PinRow';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import ModalRow from './ModalRow';
import store from 'app/store';

const MachineInfo = () => {
    const { pins, modals } = useTypedSelector((state) => ({
        pins: state.controller.state.status?.pinState,
        modals: state.controller.modal,
    }));
    const probeSelection = store.get('widgets.probe.probeCommand');
    const [open, setOpen] = useState(true);
    return (
        <div
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="w-[30px]"
        >
            <div className={cx('flex flex-col', { 'mt-[30px]': open })}>
                <img src={icon} className="w-[30px]" />
                <img
                    src={triangle}
                    className={cx('z-10', { hidden: !open })}
                ></img>
            </div>
            <Card
                className={cx({
                    hidden: !open,
                })}
            >
                <CardContent className="-mt-4 -ml-4 p-6 pt-2 absolute z-10 flex flex-col justify-center bg-gray-50 w-[400px] min-h-[300px] rounded-md [box-shadow:_0px_0px_2px_1px_var(--tw-shadow-color)] shadow-gray-400">
                    <span className="float-left font-bold text-2xl pb-2">
                        Machine Information
                    </span>
                    <div className="grid grid-cols-[3fr_2fr]">
                        <CardDescription className="flex flex-col pr-4">
                            <span className="underline float-left">
                                Firmware Modals
                            </span>
                            <div className="flex flex-col justify-between items-center">
                                <ModalRow
                                    label="Probe Selection"
                                    value={probeSelection}
                                />
                                <ModalRow
                                    label="Coordinate System"
                                    value={modals.wcs}
                                />
                                <ModalRow
                                    label="Plane Selection"
                                    value={modals.plane}
                                />
                                <ModalRow label="Units" value={modals.units} />
                                <ModalRow
                                    label="Distance Mode"
                                    value={modals.distance}
                                />
                                <ModalRow
                                    label="Feed"
                                    value={modals.feedrate}
                                />
                                <ModalRow
                                    label="Spindle"
                                    value={modals.spindle}
                                />
                                <ModalRow
                                    label="Coolant"
                                    value={modals.coolant}
                                />
                            </div>
                        </CardDescription>
                        <CardDescription className="flex flex-col border-l-2 border-l-gray-200 pl-4">
                            <span className="underline float-left">Pins</span>
                            <div className="flex flex-col justify-between items-center">
                                <PinRow label="X Limit" on={pins?.X} />
                                <PinRow label="Y Limit" on={pins?.Y} />
                                <PinRow label="Z Limit" on={pins?.Z} />
                                <PinRow label="A Limit" on={pins?.A} />
                                <PinRow label="Probe/TLS" on={pins?.P} />
                                <PinRow label="Door" on={pins?.D} />
                                <PinRow label="Cycle-Start" on={pins?.S} />
                                <PinRow label="Hold" on={pins?.H} />
                                <PinRow label="Soft-Reset" on={pins?.R} />
                            </div>
                        </CardDescription>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MachineInfo;
