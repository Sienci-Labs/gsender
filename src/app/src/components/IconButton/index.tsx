import { ButtonProps } from 'app/components/Button';
import { Button } from '../shadcn/Button';

export interface IconButtonProps extends ButtonProps {
    icon: JSX.Element;
}

export function IconButton({
    icon,
    onClick,
    disabled,
    children,
    ...props
}: IconButtonProps): JSX.Element {
    return (
        <Button
            variant="alt"
            size="xs"
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            <span className="flex flex-row gap-1 items-center">
                <span className="text-xl">{icon}</span>
                {children}
            </span>
        </Button>
    );
}
