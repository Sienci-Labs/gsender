import { Widget } from 'app/components/Widget';

export function RemoteWidget({ children, label }) {
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
