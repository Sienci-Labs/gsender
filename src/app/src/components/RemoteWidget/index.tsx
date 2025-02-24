import { Widget } from 'app/components/Widget';

export function RemoteWidget({ children, label }) {
    return (
        <Widget>
            <Widget.Content>{children}</Widget.Content>
        </Widget>
    );
}
