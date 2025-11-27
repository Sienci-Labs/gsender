import { JSX } from 'react';

import { ButtonProps } from 'app/components/Button';
import { Button } from 'app/components/shadcn/Button';

export interface IconButtonProps extends ButtonProps {
    icon: JSX.Element;
    onClick?: () => void;
    disabled: boolean;
}

export function IconButton(props: IconButtonProps): JSX.Element {
    return (
        <Button
            variant="alt"
            size="xs"
            onClick={props.onClick}
            disabled={props.disabled}
        >
            <span className="flex flex-row gap-1 items-center">
                <span className="text-xl">{props.icon}</span>
                {props.children}
            </span>
        </Button>
    );
}
