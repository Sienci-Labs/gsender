export interface AlarmsErrors {
    id: string;
    type: string;
    source: string;
    time: Date;
    CODE: number;
    MESSAGE: string;
    lineNumber: number;
    line: string;
    controller: 'GRBL' | 'grblHAL';
}
