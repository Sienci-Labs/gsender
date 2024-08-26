import controller from '../../../lib/controller';

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
    console.log(controller.ports);
}
