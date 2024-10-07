import { IndicatorButton } from 'app/components/IndicatorButton';
import { FaShower } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';
import { FaBan } from 'react-icons/fa6';
import get from 'lodash/get';
import { connect } from 'react-redux';
import {
    startMist,
    startFlood,
    stopCoolant,
} from 'app/features/Coolant/utils/actions.ts';

export interface CoolantProps {
    mistActive: boolean;
    floodActive: boolean;
}

export function Coolant({ mistActive, floodActive }: CoolantProps) {
    return (
        <div className="flex flex-col justify-around items-center h-full">
            <div className="flex flex-row justify-around w-full">
                <IndicatorButton
                    label="Mist"
                    icon={<FaShower />}
                    onClick={startMist}
                    active={mistActive}
                />
                <IndicatorButton
                    label="Flood"
                    icon={<FaWater />}
                    onClick={startFlood}
                    active={floodActive}
                />
                <IndicatorButton
                    label="Off"
                    icon={<FaBan />}
                    active={false}
                    onClick={stopCoolant}
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
