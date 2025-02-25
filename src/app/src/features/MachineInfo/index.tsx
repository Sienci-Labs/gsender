import { useState } from 'react';
import icon from './assets/icon.svg';
import triangle from './assets/triangle.svg';
import cx from 'classnames';
import { Card, CardContent, CardDescription } from 'app/components/shadcn/Card';
import PinRow from './PinRow';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import ModalRow from './ModalRow';
import store from 'app/store';
import { TiPin, TiPinOutline } from 'react-icons/ti';

const MachineInfo = () => {
    const { pins, modals, isConnected } = useTypedSelector((state) => ({
        pins: state.controller.state.status?.pinState,
        modals: state.controller.modal,
        isConnected: state.connection.isConnected,
    }));
    const probeSelection = store.get('widgets.probe.probeCommand');
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);

    const openCard = (isOpen: boolean) => {
        if (pinned) {
            return;
        }
        setOpen(isOpen);
    };
    return (
        <div
            onMouseEnter={() => openCard(true)}
            onMouseLeave={() => openCard(false)}
            className="z-50 w-[30px]"
        >
            <div
                className={cx('flex flex-col max-sm:hidden', {
                    'mt-[30px]': open,
                })}
            >
                <img src={icon} className="w-[30px]" />
                <img
                    src={triangle}
                    className={cx('z-10', {
                        hidden: !open,
                        'text-gray-400': !isConnected,
                    })}
                ></img>
            </div>
            <Card
                className={cx({
                    hidden: !open,
                })}
            >
                <CardContent className="max-sm:block -mt-4 -ml-4 p-6 pt-2 absolute z-10 flex flex-col justify-center bg-gray-50 w-[400px] min-h-[300px] rounded-md [box-shadow:_0px_0px_2px_1px_var(--tw-shadow-color)] shadow-gray-400">
                    <div className="flex flex-row w-full justify-between">
                        <span className="float-left font-bold text-2xl pb-2">
                            Machine Information
                        </span>
                        <div className="text-2xl float-right pt-1 text-gray-600">
                            {pinned ? (
                                <TiPin onClick={() => setPinned(!pinned)} />
                            ) : (
                                <TiPinOutline
                                    onClick={() => setPinned(!pinned)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-[3fr_2fr]">
                        <CardDescription className="flex flex-col pr-4">
                            <span className="underline float-left">
                                Firmware Modals
                            </span>
                            <div className="flex flex-col justify-between items-center">
                                <ModalRow
                                    label="Probe Selection"
                                    value={isConnected ? probeSelection : '-'}
                                />
                                <ModalRow
                                    label="Coordinate System"
                                    value={isConnected ? modals.wcs : '-'}
                                />
                                <ModalRow
                                    label="Plane Selection"
                                    value={isConnected ? modals.plane : '-'}
                                />
                                <ModalRow
                                    label="Units"
                                    value={isConnected ? modals.units : '-'}
                                />
                                <ModalRow
                                    label="Distance Mode"
                                    value={isConnected ? modals.distance : '-'}
                                />
                                <ModalRow
                                    label="Feed"
                                    value={isConnected ? modals.feedrate : '-'}
                                />
                                <ModalRow
                                    label="Spindle"
                                    value={isConnected ? modals.spindle : '-'}
                                />
                                <ModalRow
                                    label="Coolant"
                                    value={isConnected ? modals.coolant : '-'}
                                />
                            </div>
                        </CardDescription>
                        <CardDescription className="flex flex-col border-l-2 border-l-gray-200 pl-4">
                            <span className="underline float-left">Pins</span>
                            <div className="flex flex-col justify-between items-center">
                                <PinRow
                                    label="X Limit"
                                    on={pins?.X}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Y Limit"
                                    on={pins?.Y}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Z Limit"
                                    on={pins?.Z}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="A Limit"
                                    on={pins?.A}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Probe/TLS"
                                    on={pins?.P}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Door"
                                    on={pins?.D}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Cycle-Start"
                                    on={pins?.S}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Hold"
                                    on={pins?.H}
                                    isConnected={isConnected}
                                />
                                <PinRow
                                    label="Soft-Reset"
                                    on={pins?.R}
                                    isConnected={isConnected}
                                />
                            </div>
                        </CardDescription>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MachineInfo;
