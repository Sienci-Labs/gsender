import Button from 'app/components/Button';
import cn from 'classnames';
import { TooltipProps } from 'app/components/Tooltip';

interface ActiveStateButtonProps {
    icon: JSX.Element;
    active?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
    disabled?: boolean;
    tooltip?: TooltipProps;
}

export function ActiveStateButton({
    icon,
    active = false,
    text = '',
    onClick = () => {},
    size = 'md',
    className = '',
    ...rest
}: ActiveStateButtonProps): JSX.Element {
    return (
        <div className="mx-auto flex items-center">
            <div className="relative z-10 flex w-full cursor-pointer items-center overflow-hidden rounded-xl border border-transparent p-[1px]">
                <div
                    className={cn(
                        'animate-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(theme(colors.robin.500)_20deg,transparent_120deg)]',
                        {
                            'bg-none': !active,
                        },
                    )}
                ></div>
                <div className="relative z-20 flex w-full rounded-2xl bg-transparent p-[1px]">
                    <Button
                        text={text}
                        icon={icon}
                        variant="active"
                        onClick={onClick}
                        size={size}
                        className={cn(className, {
                            'shadow-[inset_7px_4px_6px_0px_rgba(59,_130,_246,_0.1)] text-robin-500 dark:text-robin-500 w-full flex':
                                active,
                        })}
                        {...rest}
                    />
                </div>
            </div>
        </div>
    );
}
