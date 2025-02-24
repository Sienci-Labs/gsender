import { createFileRoute } from '@tanstack/react-router';
import { RemoteWidget } from 'app/components/RemoteWidget';

export const Route = createFileRoute('/remote/tools')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <RemoteWidget>1</RemoteWidget>
            <RemoteWidget>2</RemoteWidget>
            <RemoteWidget>3</RemoteWidget>
            <RemoteWidget>4</RemoteWidget>
            <RemoteWidget>5</RemoteWidget>
            <RemoteWidget>6</RemoteWidget>
        </>
    );
}
