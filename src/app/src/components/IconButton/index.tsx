import {ButtonProps} from "app/components/Button";

export interface IconButtonProps extends ButtonProps {
    icon: JSX.Element
}

export function IconButton(props: IconButtonProps): JSX.Element {
    return (
        <button></button>
    )
}
