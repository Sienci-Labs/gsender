import { Widget } from 'app/components/Widget';

interface RemoteWidgetProps {
    children: React.ReactElement;
    label: string;
}

export function RemoteWidget({ children, label }: RemoteWidgetProps) {
    return (
        <Widget>
            <Widget.Content className="flex flex-col">
                {label && (
                    <span className="text-lg text-gray-800 mb-2">{label}</span>
                )}
                {children}
            </Widget.Content>
        </Widget>
    );
}
