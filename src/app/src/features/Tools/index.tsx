import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import Console from '../Console';
import Probe from '../Probe';
import Spindle from '../Spindle';
import Coolant from '../Coolant';
import Rotary from '../Rotary';
import Macros from '../Macros';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

const tabs = [
    {
        label: 'Probe',
        content: Probe,
    },
    {
        label: 'Macros',
        content: Macros,
    },
    {
        label: 'Spindle',
        content: Spindle,
    },
    {
        label: 'Coolant',
        content: Coolant,
    },
    {
        label: 'Rotary',
        content: Rotary,
    },
    {
        label: 'Console',
        content: Console,
    },
];

const Tools = () => {
    return (
        <Widget>
            <Widget.Content>
                <Tabs items={tabs as TabItem[]} />
            </Widget.Content>
        </Widget>
    );
};

export default Tools;
