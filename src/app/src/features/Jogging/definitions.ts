export interface JogSpeed {
    xyStep: number;
    zStep: number;
    aStep?: number;
    xaStep?: number;
    feedrate: number;
}

export interface JogSpeeds {
    rapid: JogSpeed;
    normal: JogSpeed;
    precise: JogSpeed;
}
