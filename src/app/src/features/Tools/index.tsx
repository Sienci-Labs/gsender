import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import { Console } from '../Console';

const Probe = () => {
    return <div>Probe</div>;
};

const Coolant = () => {
    return <div>Coolant</div>;
};

const Rotary = () => {
    return <div>Rotary</div>;
};

const tabs = [
    {
        label: 'Console',
        content: <Console />,
    },
    {
        label: 'Probe',
        content: <Probe />,
    },
    {
        label: 'Coolant',
        content: <Coolant />,
    },
    {
        label: 'Rotary',
        content: <Rotary />,
    },
];

export function Tools() {
    return (
        <Widget>
            <Widget.Content>
                <Tabs items={tabs} />
            </Widget.Content>
        </Widget>
    );
}
