export interface BasicObject {
    [key: string]: string | number | boolean | Array<any> | BasicObject,
};

export interface BasicPosition {
    x: number,
    y: number,
    z: number,
    a?: number,
    b?: number;
    c?: number;
};

export interface BBox {
    min: {
        x: number,
        y: number,
        z: number,
    },
    max: {
        x: number,
        y: number,
        z: number,
    },
    delta: {
        x: number,
        y: number,
        z: number,
    }
};

export interface Shuttle {
    feedrateMin: number;
    feedrateMax: number;
    hertz: number;
    overshoot: number;
}

export interface MDI {
    disabled: boolean;
}

export interface Tool {
    metricDiameter: number,
    imperialDiameter: number,
    type: string,
};

export interface i18n__Options {
    context: object,
    count: number,
    defaultValue: string,
};