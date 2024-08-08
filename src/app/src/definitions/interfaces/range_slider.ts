import { ChangeEventHandler, MouseEventHandler } from "react";

export interface RangeSliderProps {
    [key: string]: any,
    sliderName?: string,
    step?: number,
    min?: number,
    max?: number,
    value: string | number | Array<string>,
    onChange?: ChangeEventHandler<HTMLInputElement>,
    onMouseUp?: MouseEventHandler<HTMLInputElement>,
    unitString?: string,
}