export interface Feeder {
    status: FeederStatus;
}

export interface Sender {
    status: SenderStatus;
}

export interface FeederStatus {
    hold: boolean;
    holdReason: {
        data: string;
        comment?: string;
    };
    queue: number;
    pending: boolean;
    changed: boolean;
}

export interface SenderStatus {
    sp: number;
    hold: boolean;
    holdReason: {
        data: string;
        comment?: string;
    };
    name: string;
    context: {
        // TODO
        global: object;
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
        zmin: number;
        zmax: number;
        mposx: string;
        mposy: string;
        mposz: string;
        mposa: string;
        mposb: string;
        mposc: string;
        posx: string;
        posy: string;
        posz: string;
        posa: string;
        posb: string;
        posc: string;
        modal: {
            motion: string;
            wcs: string;
            plane: string;
            units: string;
            distance: string;
            feedrate: string;
            spindle: string;
            coolant: string;
        };
        tool: number;
        params: object;
        programFeedrate: string;
        Math: object;
        JSON: object;
    };
    size: number;
    total: number;
    sent: number;
    received: number;
    startTime: number;
    finishTime: number;
    elapsedTime: number;
    remainingTime: number;
    toolChanges: number;
    estimatedTime: number;
    ovF: number;
    isRotaryFile: boolean;
    currentLineRunning: number;
}
