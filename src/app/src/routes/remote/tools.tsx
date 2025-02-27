import { createFileRoute } from '@tanstack/react-router';
import { RemoteWidget } from 'app/components/RemoteWidget';
import Probe from 'app/features/Probe';
import Macros from 'app/features/Macros';
import Spindle from 'app/features/Spindle';
import { Coolant } from 'app/features/Coolant';
import Rotary from 'app/features/Rotary';
import Console from 'app/features/Console';

export const Route = createFileRoute('/remote/tools')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <RemoteWidget label="Probe">
                <Probe />
            </RemoteWidget>
            <RemoteWidget label="Macros">
                <Macros />
            </RemoteWidget>
            <RemoteWidget label="Spindle">
                <Spindle />
            </RemoteWidget>
            <RemoteWidget label="Coolant">
                <Coolant />
            </RemoteWidget>
            <RemoteWidget label="Rotary">
                <Rotary />
            </RemoteWidget>
            {/*
                            <RemoteWidget label="Console">
                <Console isActive={true} />
            </RemoteWidget>
                 */}
        </>
    );
}
