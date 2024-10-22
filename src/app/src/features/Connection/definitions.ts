export interface Connection {
    minimized: boolean;
    controller: {
        type: string;
    };
    port: string;
    baudrate: number;
    connection: {
        type: string;
        serial: {
            rtscts: boolean;
        };
    };
    autoReconnect: boolean;
    ip: number[];
}

export interface Port {
    port: string;
    inuse: boolean;
    manufacturer: string;
}
