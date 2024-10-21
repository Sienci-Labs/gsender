import controller from 'app/lib/controller';

export function refreshPorts() {
    if (!controller.connected) {
        controller.reconnect();
    }
    controller.listPorts();
}

export function refreshPortsOnParentEntry() {
    refreshPorts();
}
