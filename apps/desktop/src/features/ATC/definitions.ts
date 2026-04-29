export type ATCUnavailableReason =
    | 'firmware_not_compiled'
    | 'machine_not_homed'
    | 'machine_not_connected';

export type ATCUnavailablePayload = {
    reason: ATCUnavailableReason;
    title: string;
    message: string;
    additionalInfo?: string;
};
