import { PointerEventHandler } from "react";

export interface RangeSliderProps {
    [key: string]: any,
    title?: string,
    step?: number,
    min?: number,
    max?: number,
    value: number[],
    defaultValue?: number[],
    showValues: boolean // optional parameter to show text representations of the value and to show title
    onChange?: (value: number[]) => void,
    onPointerUp?: PointerEventHandler<HTMLInputElement>,
    unitString?: string,
}