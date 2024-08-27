import controller from 'app/lib/controller';

export interface Port {
    port: string,
    inuse: boolean,
    manufacturer: string,
}


export function refreshPorts() {
    if (!controller.connected) {
        controller.reconnect();
    }
    controller.listPorts();
}


export function refreshPortsOnParentEntry() {
        refreshPorts();
}
