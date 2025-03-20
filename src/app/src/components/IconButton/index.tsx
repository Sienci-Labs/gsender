import { ButtonProps, buttonStyle } from 'app/components/Button';

export interface IconButtonProps extends ButtonProps {
    icon: JSX.Element;
    onClick?: () => void;
    disabled: boolean;
}

export function IconButton(props: IconButtonProps): JSX.Element {
    return (
        <button
            className={buttonStyle({ variant: 'alt' })}
            onClick={props.onClick}
            disabled={props.disabled}
            variant="alt"
        >
            <span className="flex flex-row gap-1 items-center">
                <span className="text-xl">{props.icon}</span>
                {props.children}
            </span>
        </button>
    );
}
