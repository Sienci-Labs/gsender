import { MouseEventHandler } from "react"
import { ALARM_CODE, GRBL_ACTIVE_STATES_T } from "../types"

export interface MachineStatusProps {
    alarmCode: ALARM_CODE,
    activeState: GRBL_ACTIVE_STATES_T,
    isConnected: boolean
};

export interface UnlockProps {
    activeState: GRBL_ACTIVE_STATES_T,
    alarmCode: ALARM_CODE,
    onClick: MouseEventHandler<HTMLButtonElement>,
}