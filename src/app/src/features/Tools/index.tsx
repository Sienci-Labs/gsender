import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import Console from '../Console';
import Probe from '../Probe';
import Spindle from '../Spindle';
import Macros from '../Macro';

const Coolant = () => {
    return <div>Coolant</div>;
};

const Rotary = () => {
    return <div>Rotary</div>;
};

const tabs = [
    {
        label: 'Console',
        content: Console,
    },
    {
        label: 'Probe',
        content: Probe,
    },
    {
        label: 'Macros',
        content: Macros,
    },
    {
        label: 'Coolant',
        content: Coolant,
    },
    {
        label: 'Spindle',
        content: Spindle,
    },
    {
        label: 'Rotary',
        content: Rotary,
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
