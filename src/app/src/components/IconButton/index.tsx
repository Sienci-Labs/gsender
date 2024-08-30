import {ButtonProps, buttonStyle} from "app/components/Button";

export interface IconButtonProps extends ButtonProps {
    icon: JSX.Element
}

export function IconButton(props: IconButtonProps): JSX.Element {
    return (
        <button className={buttonStyle(props)}>
            <span className="flex flex-row gap-1 items-center">
                            {props.icon}
                {props.children}
            </span>
        </button>
    )
}
