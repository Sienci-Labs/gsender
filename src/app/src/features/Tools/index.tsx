import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import { Console } from '../Console';
import { WidgetConfigProvider } from '../WidgetConfig/WidgetContextProvider';

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
        content: <WidgetConfigProvider widgetId="probe"><Probe /></WidgetConfigProvider>,
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
