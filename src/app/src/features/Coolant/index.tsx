import { connect } from 'react-redux';
import get from 'lodash/get';
import { FaShower } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';
import { FaBan } from 'react-icons/fa6';

import {
    startMist,
    startFlood,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import Button from 'app/components/Button';
import { COOLANT_CATEGORY } from 'app/constants';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';

export interface CoolantProps {
    mistActive: boolean;
    floodActive: boolean;
}

export function Coolant({ mistActive, floodActive }: CoolantProps) {
    const shuttleControlEvents = {
        MIST_COOLANT: {
            title: 'Mist Coolant',
            keys: '',
            cmd: 'MIST_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => startMist(),
        },
        FLOOD_COOLANT: {
            title: 'Flood Coolant',
            keys: '',
            cmd: 'FLOOD_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => startFlood(),
        },
        STOP_COOLANT: {
            title: 'Stop Coolant',
            keys: '',
            cmd: 'STOP_COOLANT',
            preventDefault: false,
            isActive: true,
            category: COOLANT_CATEGORY,
            callback: () => stopCoolant(),
        },
    };

    useShuttleEvents(shuttleControlEvents);
    useKeybinding(shuttleControlEvents);

    return (
        <div className="flex flex-col justify-around items-center h-full">
            <div className="flex flex-row justify-around w-full gap-4">
                <Button
                    text="Mist"
                    icon={<FaShower />}
                    onClick={startMist}
                    size="lg"
                    className="w-full h-16"
                    active={mistActive}
                />
                <Button
                    text="Flood"
                    icon={<FaWater />}
                    onClick={startFlood}
                    size="lg"
                    className="w-full h-16"
                    active={floodActive}
                />
                <Button
                    text="Off"
                    icon={<FaBan />}
                    onClick={stopCoolant}
                    size="lg"
                    className="w-full h-16"
                />
            </div>
        </div>
    );
}

export default connect((state) => {
    const coolantModal: string = get(state, 'controller.modal.coolant', 'M9');
    const mistActive = coolantModal === 'M7';
    const floodActive = coolantModal === 'M8';

    return {
        mistActive,
        floodActive,
    };
})(Coolant);
