import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import Console from '../Console';
import Probe from '../Probe';
import Spindle from '../Spindle';
import Coolant from '../Coolant';
import Rotary from '../Rotary';
import Macros from '../Macros';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

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
        label: 'Spindle/Laser',
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
    const rotary = useWidgetState('rotary');
    const { spindleFunctions, coolantFunctions } = useWorkspaceState();

    const filteredTabs = tabs.filter((tab) => {
        if (tab.label === 'Rotary' && !rotary.tab.show) {
            return false;
        }

        if (tab.label === 'Spindle/Laser' && !spindleFunctions) {
            return false;
        }

        if (tab.label === 'Coolant' && !coolantFunctions) {
            return false;
        }

        return true;
    });

    return (
        <Widget>
            <Widget.Content>
                <Tabs items={filteredTabs as TabItem[]} />
            </Widget.Content>
        </Widget>
    );
};

export default Tools;
